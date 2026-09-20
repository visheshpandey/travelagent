"""TravelPilot FastAPI backend — endpoints per build doc section 3."""

import logging

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import auth
import opentripmap_client as mock_data
import state
from models import (
    AskRequest,
    AskResponse,
    ConflictResponse,
    DashboardResponse,
    DisruptRequest,
    DisruptResponse,
    GenerateItineraryRequest,
    GoogleLoginRequest,
    ItineraryResponse,
    LoginResponse,
    ModifyRequest,
    PoiSummary,
    SuggestAlternativesRequest,
    SuggestAlternativesResponse,
    UserOut,
    WeatherCheckResponse,
)
from prompts.conflicts import check_conflicts
from prompts.itinerary import generate_itinerary
from prompts.qna import answer_question
from prompts.replanner import replan
from route_optimizer import optimize_itinerary
from utils import enrich_items_with_coords, estimate_travel_cost, estimate_travel_minutes, pick_accommodation
from weather_client import get_current_weather

WEATHER_SENSITIVE_CATEGORIES = {"nature", "heritage"}

logger = logging.getLogger("travelpilot")

app = FastAPI(title="TravelPilot")

app.add_middleware(
    CORSMiddleware,
    # Wide open for hackathon demo/tunnel sharing — no auth or cookies in play.
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_optional_user(authorization: str | None = Header(None)) -> dict | None:
    """Parses `Authorization: Bearer <token>`, returns the session's user, or
    None on anything missing/invalid — never raises, since login stays
    optional for itinerary generation (see plan's scope decision)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return auth.get_session(authorization.removeprefix("Bearer ").strip())


def _require_user(authorization: str | None = Header(None)) -> dict:
    user = _get_optional_user(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@app.post("/auth/google-login", response_model=LoginResponse)
def google_login_endpoint(req: GoogleLoginRequest):
    user = auth.verify_google_id_token(req.id_token)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    session_token = auth.create_session(user)
    return {"session_token": session_token, "user": user}


@app.get("/auth/me", response_model=UserOut)
def me_endpoint(user: dict = Depends(_require_user)):
    return user


def _check_conflicts(itinerary: dict, pois: list[dict]) -> list[dict]:
    """Runs conflict detection (5.2), logs any findings, and returns them so the
    caller can surface them in the response instead of only logging."""
    try:
        result = check_conflicts(itinerary, pois)
        conflicts = result.get("conflicts", [])
        if conflicts:
            logger.warning("Itinerary has %d conflict(s): %s", len(conflicts), conflicts)
        return conflicts
    except Exception:
        logger.exception("Conflict check failed")
        return []


@app.get("/pois", response_model=list[PoiSummary])
def list_pois_endpoint(destination: str):
    """Not in the original API contract; lets the frontend offer a must-visit
    picker before generating an itinerary."""
    pois = mock_data.get_pois(destination)
    if not pois:
        raise HTTPException(
            status_code=404,
            detail=f"No POI data for destination '{destination}'. Available: {mock_data.list_destinations()}",
        )
    return [
        {"id": p["id"], "name": p["name"], "category": p["category"], "rating": p.get("rating")}
        for p in pois
    ]


@app.post("/generate-itinerary", response_model=ItineraryResponse)
def generate_itinerary_endpoint(req: GenerateItineraryRequest, user: dict | None = Depends(_get_optional_user)):
    pois = mock_data.get_pois(req.destination)
    if not pois:
        raise HTTPException(
            status_code=404,
            detail=f"No POI data for destination '{req.destination}'. Available: {mock_data.list_destinations()}",
        )

    constraints = req.model_dump()
    itinerary = generate_itinerary(constraints, pois)
    itinerary = enrich_items_with_coords(itinerary, pois)
    itinerary = optimize_itinerary(itinerary, pois)
    conflicts = _check_conflicts(itinerary, pois)

    all_items = [item for day in itinerary["days"] for item in day["items"]]
    accommodation = pick_accommodation(all_items, mock_data.get_accommodations(req.destination))

    trip_id = state.new_trip(
        req.destination,
        constraints,
        itinerary,
        accommodation=accommodation,
        user_id=user["sub"] if user else None,
    )
    return {"trip_id": trip_id, **itinerary, "accommodation": accommodation, "conflicts": conflicts}


@app.post("/modify", response_model=ItineraryResponse)
def modify_endpoint(req: ModifyRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    updates = req.model_dump(exclude={"trip_id"}, exclude_none=True)
    merged_constraints = {**trip["constraints"], **updates}
    pois = mock_data.get_pois(trip["destination"])

    itinerary = generate_itinerary(merged_constraints, pois)
    itinerary = enrich_items_with_coords(itinerary, pois)
    itinerary = optimize_itinerary(itinerary, pois)
    conflicts = _check_conflicts(itinerary, pois)

    state.update_trip(req.trip_id, constraints=updates, itinerary=itinerary)
    return {"trip_id": req.trip_id, **itinerary, "accommodation": trip.get("accommodation"), "conflicts": conflicts}


@app.post("/disrupt", response_model=DisruptResponse)
def disrupt_endpoint(req: DisruptRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    pois = mock_data.get_pois(trip["destination"])
    result = replan(trip["itinerary"], req.item_id, req.reason, pois)
    explanation = result.pop("explanation", "")
    result = enrich_items_with_coords(result, pois)
    result = optimize_itinerary(result, pois)
    conflicts = _check_conflicts(result, pois)

    state.update_trip(req.trip_id, itinerary=result)
    return {"trip_id": req.trip_id, "days": result["days"], "explanation": explanation, "conflicts": conflicts}


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    pois = mock_data.get_pois(trip["destination"])
    result = answer_question(trip["itinerary"], pois, req.question)
    return {"answer": result.get("answer", "")}


@app.post("/suggest-alternatives", response_model=SuggestAlternativesResponse)
def suggest_alternatives_endpoint(req: SuggestAlternativesRequest):
    """Cheap, non-committal preview of replacement candidates for a disrupted
    item — pure filtering, no LLM call, so it's instant and never mutates the
    trip. The actual replan (via /disrupt) is a separate, explicit action."""
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    items = [item for day in trip["itinerary"]["days"] for item in day["items"]]
    target = next((item for item in items if item["id"] == req.item_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"Unknown item_id: {req.item_id}")

    used_ids = {item["id"] for item in items}
    pois = mock_data.get_pois(trip["destination"])
    candidates = [
        p for p in pois if p["category"] == target["category"] and p["id"] not in used_ids
    ]
    candidates.sort(key=lambda p: -(p.get("rating") or 0))

    return {
        "alternatives": [
            {"id": p["id"], "name": p["name"], "category": p["category"], "rating": p.get("rating")}
            for p in candidates[:5]
        ]
    }


@app.post("/check-conflicts", response_model=ConflictResponse)
def check_conflicts_endpoint(trip_id: str):
    """Not in the original API contract; exposed for manual testing of the 5.2 module."""
    trip = state.get_trip(trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {trip_id}")

    pois = mock_data.get_pois(trip["destination"])
    return check_conflicts(trip["itinerary"], pois)


@app.get("/weather-check", response_model=WeatherCheckResponse)
def weather_check_endpoint(trip_id: str):
    """Checks TODAY's actual weather at the trip's destination (not a date-matched
    forecast — see weather_client.py) and flags outdoor-leaning itinerary items as
    at-risk when conditions are severe, so the user can trigger a real disruption."""
    trip = state.get_trip(trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {trip_id}")

    weather = get_current_weather(trip["destination"])

    at_risk_items = []
    if weather["is_severe"]:
        for day in trip["itinerary"].get("days", []):
            for item in day.get("items", []):
                if item["category"] in WEATHER_SENSITIVE_CATEGORIES:
                    at_risk_items.append({
                        "item_id": item["id"],
                        "poi": item["poi"],
                        "date": day["date"],
                        "category": item["category"],
                    })

    return {
        "destination": trip["destination"],
        "condition": weather["main"],
        "description": weather["description"],
        "temp_c": weather["temp_c"],
        "is_severe": weather["is_severe"],
        "at_risk_items": at_risk_items,
    }


@app.get("/dashboard", response_model=DashboardResponse)
def dashboard_endpoint(trip_id: str):
    trip = state.get_trip(trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {trip_id}")

    pois = mock_data.get_pois(trip["destination"])
    itinerary = trip["itinerary"]
    days = itinerary.get("days", [])
    accommodation = trip.get("accommodation")

    day_breakdown = []
    used_names = set()
    for day in days:
        items = day.get("items", [])
        legs: list[dict] = []

        def add_leg(name_a, lat_a, lng_a, name_b, lat_b, lng_b):
            if lat_a is None or lng_a is None or lat_b is None or lng_b is None:
                return
            legs.append({
                "from": name_a,
                "to": name_b,
                "estimated_minutes": estimate_travel_minutes(lat_a, lng_a, lat_b, lng_b),
                "estimated_cost": estimate_travel_cost(lat_a, lng_a, lat_b, lng_b),
            })

        if accommodation and items:
            add_leg(
                accommodation["name"], accommodation["lat"], accommodation["lng"],
                items[0]["poi"], items[0].get("lat"), items[0].get("lng"),
            )
        for a, b in zip(items, items[1:]):
            add_leg(a["poi"], a.get("lat"), a.get("lng"), b["poi"], b.get("lat"), b.get("lng"))
        if accommodation and items:
            add_leg(
                items[-1]["poi"], items[-1].get("lat"), items[-1].get("lng"),
                accommodation["name"], accommodation["lat"], accommodation["lng"],
            )

        day_breakdown.append({
            "date": day["date"],
            "accommodation_cost": accommodation["cost_per_night"] if accommodation else 0,
            "travel_cost": sum(leg["estimated_cost"] for leg in legs),
            "legs": legs,
        })
        used_names.update(item["poi"] for item in items)

    used_categories = {p["category"] for p in pois if p["name"] in used_names}
    backup_options = [
        {"poi": p["name"], "category": p["category"]}
        for p in pois
        if p["name"] not in used_names and p["category"] in used_categories
    ][:5]

    return {
        "trip_id": trip_id,
        "itinerary": days,
        "day_breakdown": day_breakdown,
        "total_cost": itinerary.get("total_cost", 0),
        "backup_options": backup_options,
        "accommodation": accommodation,
    }
