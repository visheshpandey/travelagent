"""TravelPilot FastAPI backend — endpoints per build doc section 3."""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
    ItineraryResponse,
    ModifyRequest,
    WeatherCheckResponse,
)
from prompts.conflicts import check_conflicts
from prompts.itinerary import generate_itinerary
from prompts.qna import answer_question
from prompts.replanner import replan
from utils import estimate_travel_minutes
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


def _log_conflicts(itinerary: dict, pois: list[dict]) -> None:
    """Runs conflict detection (5.2) and logs any findings; doesn't block the response."""
    try:
        result = check_conflicts(itinerary, pois)
        conflicts = result.get("conflicts", [])
        if conflicts:
            logger.warning("Itinerary has %d conflict(s): %s", len(conflicts), conflicts)
    except Exception:
        logger.exception("Conflict check failed")


@app.post("/generate-itinerary", response_model=ItineraryResponse)
def generate_itinerary_endpoint(req: GenerateItineraryRequest):
    pois = mock_data.get_pois(req.destination)
    if not pois:
        raise HTTPException(
            status_code=404,
            detail=f"No POI data for destination '{req.destination}'. Available: {mock_data.list_destinations()}",
        )

    constraints = req.model_dump()
    itinerary = generate_itinerary(constraints, pois)
    _log_conflicts(itinerary, pois)

    trip_id = state.new_trip(req.destination, constraints, itinerary)
    return {"trip_id": trip_id, **itinerary}


@app.post("/modify", response_model=ItineraryResponse)
def modify_endpoint(req: ModifyRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    updates = req.model_dump(exclude={"trip_id"}, exclude_none=True)
    merged_constraints = {**trip["constraints"], **updates}
    pois = mock_data.get_pois(trip["destination"])

    itinerary = generate_itinerary(merged_constraints, pois)
    _log_conflicts(itinerary, pois)

    state.update_trip(req.trip_id, constraints=updates, itinerary=itinerary)
    return {"trip_id": req.trip_id, **itinerary}


@app.post("/disrupt", response_model=DisruptResponse)
def disrupt_endpoint(req: DisruptRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    pois = mock_data.get_pois(trip["destination"])
    result = replan(trip["itinerary"], req.item_id, req.reason, pois)
    explanation = result.pop("explanation", "")
    _log_conflicts(result, pois)

    state.update_trip(req.trip_id, itinerary=result)
    return {"trip_id": req.trip_id, "days": result["days"], "explanation": explanation}


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    result = answer_question(trip["itinerary"], req.question)
    return {"answer": result.get("answer", "")}


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
    poi_by_name = {p["name"]: p for p in pois}
    itinerary = trip["itinerary"]
    days = itinerary.get("days", [])

    transportation = []
    used_names = set()
    for day in days:
        items = day.get("items", [])
        for a, b in zip(items, items[1:]):
            poi_a, poi_b = poi_by_name.get(a["poi"]), poi_by_name.get(b["poi"])
            if poi_a and poi_b:
                minutes = estimate_travel_minutes(poi_a["lat"], poi_a["lng"], poi_b["lat"], poi_b["lng"])
                transportation.append({
                    "day": day["date"],
                    "from": a["poi"],
                    "to": b["poi"],
                    "estimated_minutes": minutes,
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
        "transportation": transportation,
        "total_cost": itinerary.get("total_cost", 0),
        "backup_options": backup_options,
    }
