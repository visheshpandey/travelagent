"""Travel-time estimation via lat/lng distance + flat speed (build doc section 4).

No live Maps API: haversine distance at an assumed 20 km/h average city speed.
"""

import math

AVG_SPEED_KMPH = 20.0

# Rough India-city auto-rickshaw/cab estimate — no live fare API, so this is a
# clearly-labeled assumption (₹/km + a minimum fare floor), not real pricing.
FARE_PER_KM = 12.0
FARE_MINIMUM = 30.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def estimate_travel_minutes(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    km = haversine_km(lat1, lng1, lat2, lng2)
    hours = km / AVG_SPEED_KMPH
    return round(hours * 60)


def estimate_travel_cost(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    km = haversine_km(lat1, lng1, lat2, lng2)
    return round(max(FARE_MINIMUM, km * FARE_PER_KM))


def pick_accommodation(items: list[dict], accommodations: list[dict]) -> dict | None:
    """Picks the accommodation nearest the centroid of the (coord-enriched)
    itinerary items — a simple, deterministic stand-in for 'close to where
    you're actually spending your days', with no LLM guessing involved."""
    coords = [(item["lat"], item["lng"]) for item in items if item.get("lat") is not None and item.get("lng") is not None]
    if not coords or not accommodations:
        return None

    centroid_lat = sum(lat for lat, _ in coords) / len(coords)
    centroid_lng = sum(lng for _, lng in coords) / len(coords)

    return min(
        accommodations,
        key=lambda acc: haversine_km(centroid_lat, centroid_lng, acc["lat"], acc["lng"]),
    )


def enrich_items_with_coords(itinerary: dict, pois: list[dict]) -> dict:
    """Attaches each item's POI lat/lng by id, deterministically — the LLM
    output only carries the POI id, never trust it to echo coordinates."""
    poi_by_id = {p["id"]: p for p in pois}
    for day in itinerary.get("days", []):
        for item in day.get("items", []):
            poi = poi_by_id.get(item.get("id"))
            if poi:
                item["lat"] = poi["lat"]
                item["lng"] = poi["lng"]
    return itinerary
