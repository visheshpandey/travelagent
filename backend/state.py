"""In-memory trip state store, keyed by trip_id."""

import uuid

_trips: dict[str, dict] = {}


def new_trip(
    destinations: list[str],
    constraints: dict,
    itinerary: dict,
    accommodations: list[dict] | None = None,
    travel_gap: bool = False,
    user_id: str | None = None,
) -> str:
    trip_id = f"t_{uuid.uuid4().hex[:8]}"
    _trips[trip_id] = {
        "trip_id": trip_id,
        "destinations": destinations,
        "constraints": constraints,
        "itinerary": itinerary,
        "accommodations": accommodations or [],
        "travel_gap": travel_gap,
        "user_id": user_id,
    }
    return trip_id


def get_trip(trip_id: str) -> dict | None:
    return _trips.get(trip_id)


def update_trip(
    trip_id: str,
    *,
    constraints: dict | None = None,
    itinerary: dict | None = None,
    destinations: list[str] | None = None,
    accommodations: list[dict] | None = None,
) -> None:
    trip = _trips.get(trip_id)
    if trip is None:
        raise KeyError(f"unknown trip_id: {trip_id}")
    if constraints is not None:
        trip["constraints"].update(constraints)
    if itinerary is not None:
        trip["itinerary"] = itinerary
    if destinations is not None:
        trip["destinations"] = destinations
    if accommodations is not None:
        trip["accommodations"] = accommodations
