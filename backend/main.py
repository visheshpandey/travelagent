"""TravelPilot FastAPI backend — endpoints per build doc section 3."""

import logging
from datetime import date

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
from prompts.chat_action import classify_and_act
from prompts.conflicts import check_conflicts
from prompts.itinerary import _trip_dates, generate_itinerary
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


def _finalize_itinerary(
    trip_id: str,
    itinerary: dict,
    pois: list[dict],
    constraints_updates: dict | None = None,
) -> tuple[dict, list[dict]]:
    """Shared enrich -> optimize -> conflict-check -> persist pipeline used by
    every code path that produces a new itinerary for an existing trip
    (modify, disrupt, and chat-triggered actions)."""
    itinerary = enrich_items_with_coords(itinerary, pois)
    itinerary = optimize_itinerary(itinerary, pois)
    conflicts = _check_conflicts(itinerary, pois)
    state.update_trip(trip_id, constraints=constraints_updates, itinerary=itinerary)
    return itinerary, conflicts


def _union_pois(destinations: list[str]) -> list[dict]:
    """POI ids are already namespaced per city (jp_01, ud_03, ...), so this
    concatenation is safe to use wherever a trip's full POI context is
    needed regardless of how many destinations it spans."""
    return [p for d in destinations for p in mock_data.get_pois(d)]


def _carry_day_tags(old_days: list[dict], new_days: list[dict]) -> list[dict]:
    """replan()'s LLM output rebuilds `days` from scratch and never carries
    over `destination`/`is_travel_day` (it doesn't know those concepts) —
    without this, any disruption on a multi-city trip would silently wipe
    every day's city label and break per-day accommodation matching on the
    dashboard. Days are matched by date, which replan never adds/removes."""
    tags_by_date = {d["date"]: (d.get("destination"), d.get("is_travel_day", False)) for d in old_days}
    for day in new_days:
        destination, is_travel_day = tags_by_date.get(day["date"], (None, False))
        day["destination"] = destination
        day["is_travel_day"] = is_travel_day
    return new_days


def _split_days(trip_dates: list[str], destinations: list[str], gap: bool) -> list[tuple[str | None, list[str]]]:
    """Splits a trip's calendar dates into per-destination legs, in order.
    Returns a list of (destination, dates) pairs; a `None` destination marks
    a travel/gap day between two legs (no LLM call, no items). Falls back to
    skipping gap insertion (rather than starving a leg of all its days) when
    the trip is too short to fit both the requested cities and the gaps."""
    k = len(destinations)
    if k == 1:
        return [(destinations[0], trip_dates)]

    n = len(trip_dates)
    use_gap = gap and n >= 2 * k - 1
    gap_count = k - 1 if use_gap else 0
    activity_days = n - gap_count
    base, extra = divmod(activity_days, k)

    legs: list[tuple[str | None, list[str]]] = []
    idx = 0
    for i, dest in enumerate(destinations):
        count = max(base + (1 if i < extra else 0), 1)
        leg_dates = trip_dates[idx : idx + count]
        idx += count
        legs.append((dest, leg_dates))
        if use_gap and i < k - 1 and idx < n:
            legs.append((None, [trip_dates[idx]]))
            idx += 1
    return legs


def _build_itinerary(destinations: list[str], constraints: dict, travel_gap: bool) -> tuple[dict, list[dict]]:
    """Builds a (possibly multi-city) itinerary: one generate_itinerary call
    per real leg (narrow date range + that city's own POIs only, so the LLM
    never has to reason about two cities at once), gap-day placeholders
    between legs when requested, and one accommodation pick per leg. This is
    the single place multi-leg logic lives — reused by /generate-itinerary,
    /modify, and the chat-action modify path."""
    trip_dates = _trip_dates(constraints["start_date"], constraints["end_date"])
    legs = _split_days(trip_dates, destinations, travel_gap)
    # Only tag days with a destination/is_travel_day when there's more than
    # one city — keeps single-destination trips' JSON identical to before
    # this feature existed, so the frontend can treat "day.destination is
    # set" as "this is a multi-city trip" without a separate flag.
    multi = len(destinations) > 1

    all_days: list[dict] = []
    total_cost = 0.0
    accommodations: list[dict] = []

    for leg_dest, leg_dates in legs:
        if leg_dest is None:
            for d in leg_dates:
                all_days.append({
                    "date": d,
                    "items": [],
                    "day_cost": 0,
                    "destination": None,
                    "is_travel_day": True,
                })
            continue

        leg_pois = mock_data.get_pois(leg_dest)
        leg_poi_ids = {p["id"] for p in leg_pois}
        leg_constraints = {
            **constraints,
            "start_date": leg_dates[0],
            "end_date": leg_dates[-1],
            "must_visit": [m for m in constraints.get("must_visit", []) if m in leg_poi_ids],
            "budget_total": constraints["budget_total"] * len(leg_dates) / max(len(trip_dates), 1),
        }
        leg_itinerary = generate_itinerary(leg_constraints, leg_pois)
        # pick_accommodation needs item coordinates, which the LLM output
        # never carries (only POI ids) — enrich this leg locally before
        # picking a stay. The endpoint re-enriches the full stitched
        # itinerary afterwards anyway, so this is just redundant, not wrong.
        leg_itinerary = enrich_items_with_coords(leg_itinerary, leg_pois)
        if multi:
            for day in leg_itinerary.get("days", []):
                day["destination"] = leg_dest
                day["is_travel_day"] = False
        all_days.extend(leg_itinerary.get("days", []))
        total_cost += leg_itinerary.get("total_cost", 0)

        leg_items = [item for day in leg_itinerary.get("days", []) for item in day["items"]]
        accommodation = pick_accommodation(leg_items, mock_data.get_accommodations(leg_dest))
        if accommodation:
            accommodations.append({**accommodation, "destination": leg_dest})

    return {"days": all_days, "total_cost": total_cost}, accommodations


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
    destinations = req.destinations
    if not destinations or len(destinations) > 3:
        raise HTTPException(status_code=400, detail="Pick between 1 and 3 destinations.")
    if len(set(destinations)) != len(destinations):
        raise HTTPException(status_code=400, detail="Duplicate destinations aren't allowed.")
    unknown = [d for d in destinations if d not in mock_data.DESTINATION_CENTERS]
    if unknown:
        raise HTTPException(
            status_code=404,
            detail=f"No POI data for destination(s) {unknown}. Available: {mock_data.list_destinations()}",
        )
    trip_dates = _trip_dates(req.start_date, req.end_date)
    if len(trip_dates) < len(destinations):
        raise HTTPException(status_code=400, detail="Trip is shorter than the number of destinations picked.")

    constraints = req.model_dump()
    itinerary, accommodations = _build_itinerary(destinations, constraints, req.travel_gap)
    pois = _union_pois(destinations)
    itinerary = enrich_items_with_coords(itinerary, pois)
    itinerary = optimize_itinerary(itinerary, pois)
    conflicts = _check_conflicts(itinerary, pois)

    trip_id = state.new_trip(
        destinations,
        constraints,
        itinerary,
        accommodations=accommodations,
        travel_gap=req.travel_gap,
        user_id=user["sub"] if user else None,
    )
    return {
        "trip_id": trip_id,
        **itinerary,
        "accommodation": accommodations[0] if accommodations else None,
        "accommodations": accommodations,
        "destinations": destinations,
        "conflicts": conflicts,
    }


@app.post("/modify", response_model=ItineraryResponse)
def modify_endpoint(req: ModifyRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    updates = req.model_dump(exclude={"trip_id", "destinations", "travel_gap"}, exclude_none=True)
    merged_constraints = {**trip["constraints"], **updates}
    destinations = req.destinations or trip["destinations"]
    travel_gap = req.travel_gap if req.travel_gap is not None else trip.get("travel_gap", False)

    itinerary, accommodations = _build_itinerary(destinations, merged_constraints, travel_gap)
    pois = _union_pois(destinations)
    itinerary, conflicts = _finalize_itinerary(req.trip_id, itinerary, pois, constraints_updates=updates)
    state.update_trip(req.trip_id, destinations=destinations, accommodations=accommodations)
    return {
        "trip_id": req.trip_id,
        **itinerary,
        "accommodation": accommodations[0] if accommodations else None,
        "accommodations": accommodations,
        "destinations": destinations,
        "conflicts": conflicts,
    }


@app.post("/disrupt", response_model=DisruptResponse)
def disrupt_endpoint(req: DisruptRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    pois = _union_pois(trip["destinations"])
    result = replan(trip["itinerary"], req.item_id, req.reason, pois)
    explanation = result.pop("explanation", "")
    result["days"] = _carry_day_tags(trip["itinerary"]["days"], result.get("days", []))
    result, conflicts = _finalize_itinerary(req.trip_id, result, pois)
    return {"trip_id": req.trip_id, "days": result["days"], "explanation": explanation, "conflicts": conflicts}


def _fallback_answer(trip: dict, pois: list[dict], question: str) -> dict:
    result = answer_question(trip["itinerary"], pois, question)
    return {"answer": result.get("answer", ""), "action": "answer"}


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    trip = state.get_trip(req.trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {req.trip_id}")

    pois = _union_pois(trip["destinations"])

    try:
        result = classify_and_act(trip["itinerary"], trip["constraints"], pois, req.question)
        action = result.get("action")

        if action in ("modify_budget", "modify_dates"):
            updates: dict = {}
            budget_total = result.get("budget_total")
            if isinstance(budget_total, (int, float)) and budget_total > 0:
                updates["budget_total"] = budget_total
            start_date = result.get("start_date")
            end_date = result.get("end_date")
            if isinstance(start_date, str) and isinstance(end_date, str):
                try:
                    date.fromisoformat(start_date)
                    date.fromisoformat(end_date)
                    updates["start_date"] = start_date
                    updates["end_date"] = end_date
                except ValueError:
                    pass

            if not updates:
                return _fallback_answer(trip, pois, req.question)

            merged_constraints = {**trip["constraints"], **updates}
            destinations = trip["destinations"]
            travel_gap = trip.get("travel_gap", False)
            itinerary, accommodations = _build_itinerary(destinations, merged_constraints, travel_gap)
            itinerary, conflicts = _finalize_itinerary(req.trip_id, itinerary, pois, constraints_updates=updates)
            state.update_trip(req.trip_id, accommodations=accommodations)
            return {
                "answer": result.get("message", "Updated your plan."),
                "action": "modify",
                "modify_result": {
                    "trip_id": req.trip_id,
                    **itinerary,
                    "accommodation": accommodations[0] if accommodations else None,
                    "accommodations": accommodations,
                    "destinations": destinations,
                    "conflicts": conflicts,
                },
                "updated_constraints": merged_constraints,
            }

        if action == "disrupt_item":
            item_id = result.get("item_id")
            items = [item for day in trip["itinerary"]["days"] for item in day["items"]]
            if not item_id or not any(item["id"] == item_id for item in items):
                return _fallback_answer(trip, pois, req.question)

            reason = result.get("reason") or req.question
            replan_result = replan(trip["itinerary"], item_id, reason, pois)
            explanation = replan_result.pop("explanation", "")
            replan_result["days"] = _carry_day_tags(trip["itinerary"]["days"], replan_result.get("days", []))
            replan_result, conflicts = _finalize_itinerary(req.trip_id, replan_result, pois)
            return {
                "answer": result.get("message", explanation),
                "action": "disrupt",
                "disrupt_result": {
                    "trip_id": req.trip_id,
                    "days": replan_result["days"],
                    "explanation": explanation,
                    "conflicts": conflicts,
                },
            }

        return {"answer": result.get("message", ""), "action": "answer"}
    except Exception:
        logger.exception("Chat action failed, falling back to plain answer")
        return _fallback_answer(trip, pois, req.question)


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
    pois = _union_pois(trip["destinations"])
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

    pois = _union_pois(trip["destinations"])
    return check_conflicts(trip["itinerary"], pois)


@app.get("/weather-check", response_model=WeatherCheckResponse)
def weather_check_endpoint(trip_id: str):
    """Checks TODAY's actual weather at the trip's destination (not a date-matched
    forecast — see weather_client.py) and flags outdoor-leaning itinerary items as
    at-risk when conditions are severe, so the user can trigger a real disruption."""
    trip = state.get_trip(trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Unknown trip_id: {trip_id}")

    # Multi-city trips only check weather for the first leg — a per-city
    # weather check is out of scope for this pass.
    primary_destination = trip["destinations"][0]
    weather = get_current_weather(primary_destination)

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
        "destination": primary_destination,
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

    destinations = trip["destinations"]
    pois = _union_pois(destinations)
    itinerary = trip["itinerary"]
    days = itinerary.get("days", [])
    accommodations = trip.get("accommodations") or []
    acc_by_destination = {a["destination"]: a for a in accommodations if a.get("destination")}
    default_accommodation = accommodations[0] if len(accommodations) == 1 else None

    day_breakdown = []
    used_names = set()
    for day in days:
        items = day.get("items", [])
        legs: list[dict] = []
        day_destination = day.get("destination")
        accommodation = acc_by_destination.get(day_destination) if day_destination else default_accommodation

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
            "destination": day_destination,
        })
        used_names.update(item["poi"] for item in items)

    used_categories = {p["category"] for p in pois if p["name"] in used_names}
    backup_options = [
        {"poi": p["name"], "category": p["category"]}
        for p in pois
        if p["name"] not in used_names and p["category"] in used_categories
    ][:5]

    activities_cost = itinerary.get("total_cost", 0)
    stay_cost = sum(d["accommodation_cost"] for d in day_breakdown)
    travel_cost = sum(d["travel_cost"] for d in day_breakdown)
    grand_total = activities_cost + stay_cost + travel_cost

    return {
        "trip_id": trip_id,
        "itinerary": days,
        "day_breakdown": day_breakdown,
        "total_cost": activities_cost,
        "backup_options": backup_options,
        "accommodation": accommodations[0] if accommodations else None,
        "accommodations": accommodations,
        "destinations": destinations,
        "grand_total": grand_total,
    }
