"""Real POI data via OpenTripMap — same schema and function interface as
mock_data.py (id, name, lat, lng, category, open_hours, avg_duration_min,
cost, closed_on), so nothing downstream (agent prompts, itinerary
generation, conflict detection, replanner) needs to change.

OpenTripMap gives real names/coordinates/kinds but no opening hours or
cost, so those two fields are still category-based estimates — same
approach mock_data.py always used, just applied to real places now.

Each destination's POI list is fetched once and cached in memory for the
life of the process (see _CACHE) — repeated /generate-itinerary calls
during a demo don't re-hit the API.
"""

import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()

_BASE_URL = "https://api.opentripmap.com/0.1/en/places"
_RADIUS_M = 25000
_RESULTS_PER_CATEGORY = 3

DESTINATION_CENTERS = {
    "Jaipur": (26.9124, 75.7873),
    "Delhi": (28.6139, 77.2090),
    "Agra": (27.1767, 78.0081),
    "Goa": (15.2993, 74.1240),
    "Udaipur": (24.5854, 73.7125),
    "Kochi": (9.9312, 76.2673),
}
DESTINATION_CODES = {"Jaipur": "jp", "Delhi": "dl", "Agra": "ag", "Goa": "go", "Udaipur": "ud", "Kochi": "kc"}

# What we search OpenTripMap for, per our category — not the final classification
# (see _map_kinds_to_category), just cast a wide enough net for recall.
CATEGORY_SEARCH_KINDS = {
    "heritage": "historic,architecture,cultural,religion",
    "food": "foods",
    "nightlife": "amusements",
    "shopping": "shops",
    "nature": "natural,beaches",
}

# Ordered most-specific-first; a POI's `kinds` string is checked against each
# category's keywords in this order and assigned to the first match. Falls
# back to "heritage" (OpenTripMap's broadest, most common bucket) otherwise.
_CATEGORY_KEYWORDS = [
    ("nightlife", ["night_clubs", "casinos", "pubs", "bars", "amusements", "adult"]),
    ("food", ["foods", "restaurants", "cafes", "fast_food"]),
    ("shopping", ["shops", "marketplaces", "malls"]),
    ("nature", ["natural", "beaches", "geological", "nature_reserves", "gardens", "parks"]),
    ("heritage", ["historic", "architecture", "cultural", "religion", "museums", "monuments", "castles", "palaces"]),
]

AVG_DURATION_MIN = {"heritage": 90, "food": 60, "nightlife": 120, "shopping": 90, "nature": 75}
DEFAULT_COST = {"heritage": 300, "food": 400, "nightlife": 1000, "shopping": 500, "nature": 0}
DEFAULT_OPEN_HOURS = {
    "heritage": "09:00-18:00",
    "food": "11:00-22:00",
    "nightlife": "19:00-23:00",
    "shopping": "10:00-21:00",
    "nature": "06:00-19:00",
}

# Mirrors mock_data.py: one guaranteed-closed POI per destination so the
# scripted disruption demo never depends on OpenTripMap actually reporting
# closures (it doesn't return closure data at all).
SCRIPTED_CLOSED_DATE = "2026-11-10"

_CACHE: dict[str, list[dict]] = {}


def _map_kinds_to_category(kinds: str) -> str:
    tags = kinds.split(",")
    for category, keywords in _CATEGORY_KEYWORDS:
        if any(kw in tag for tag in tags for kw in keywords):
            return category
    return "heritage"


def _search_category(lat: float, lon: float, category: str, api_key: str) -> list[dict]:
    resp = requests.get(
        f"{_BASE_URL}/radius",
        params={
            "radius": _RADIUS_M,
            "lat": lat,
            "lon": lon,
            "kinds": CATEGORY_SEARCH_KINDS[category],
            "limit": 10,
            "apikey": api_key,
        },
        timeout=15,
    )
    resp.raise_for_status()
    # Force UTF-8 decoding — OpenTripMap doesn't always set a charset, and
    # requests' encoding guess otherwise mangles non-ASCII place names.
    features = json.loads(resp.content.decode("utf-8")).get("features", [])
    features.sort(key=lambda f: -f["properties"].get("rate", 0))
    return features[:_RESULTS_PER_CATEGORY]


def _get_details(xid: str, api_key: str) -> dict:
    resp = requests.get(f"{_BASE_URL}/xid/{xid}", params={"apikey": api_key}, timeout=15)
    resp.raise_for_status()
    return json.loads(resp.content.decode("utf-8"))


def _fetch_destination(destination: str) -> list[dict]:
    api_key = os.environ.get("OPENTRIPMAP_API_KEY")
    if not api_key:
        raise RuntimeError("OPENTRIPMAP_API_KEY is not set (see backend/.env.example)")

    lat, lon = DESTINATION_CENTERS[destination]
    code = DESTINATION_CODES[destination]

    pois: list[dict] = []
    seen_xids: set[str] = set()
    counter = 1

    for search_category in CATEGORY_SEARCH_KINDS:
        for feature in _search_category(lat, lon, search_category, api_key):
            props = feature["properties"]
            xid = props.get("xid")
            name = props.get("name")
            if not xid or not name or xid in seen_xids:
                continue
            seen_xids.add(xid)

            details = _get_details(xid, api_key)
            point = details.get("point") or {}
            poi_lat = point.get("lat", feature["geometry"]["coordinates"][1])
            poi_lng = point.get("lon", feature["geometry"]["coordinates"][0])
            category = _map_kinds_to_category(details.get("kinds", props.get("kinds", "")))

            pois.append({
                "id": f"{code}_{counter:02d}",
                "name": name,
                "lat": poi_lat,
                "lng": poi_lng,
                "category": category,
                "open_hours": DEFAULT_OPEN_HOURS[category],
                "avg_duration_min": AVG_DURATION_MIN[category],
                "cost": DEFAULT_COST[category],
                "closed_on": None,
            })
            counter += 1

    if pois:
        pois[0]["closed_on"] = SCRIPTED_CLOSED_DATE

    return pois


def get_pois(destination: str) -> list[dict]:
    if destination not in DESTINATION_CENTERS:
        return []
    if destination not in _CACHE:
        _CACHE[destination] = _fetch_destination(destination)
    return _CACHE[destination]


def get_poi_by_id(destination: str, poi_id: str) -> dict | None:
    for poi in get_pois(destination):
        if poi["id"] == poi_id:
            return poi
    return None


def list_destinations() -> list[str]:
    return list(DESTINATION_CENTERS.keys())
