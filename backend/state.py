"""In-memory trip state store, keyed by trip_id."""

import uuid

_trips: dict[str, dict] = {}


def new_trip(
    destination: str,
    constraints: dict,
    itinerary: dict,
    accommodation: dict | None = None,
    user_id: str | None = None,
) -> str:
    trip_id = f"t_{uuid.uuid4().hex[:8]}"
    _trips[trip_id] = {
        "trip_id": trip_id,
        "destination": destination,
        "constraints": constraints,
        "itinerary": itinerary,
        "accommodation": accommodation,
        "user_id": user_id,
    }
    return trip_id


def get_trip(trip_id: str) -> dict | None:
    return _trips.get(trip_id)


def update_trip(trip_id: str, *, constraints: dict | None = None, itinerary: dict | None = None) -> None:
    trip = _trips.get(trip_id)
    if trip is None:
        raise KeyError(f"unknown trip_id: {trip_id}")
    if constraints is not None:
        trip["constraints"].update(constraints)
    if itinerary is not None:
        trip["itinerary"] = itinerary
