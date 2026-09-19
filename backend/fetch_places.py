"""One-time setup script: fetches real POI data from Google Places API (New)
for each destination and caches it to data/pois_real.json.

Run manually (`python fetch_places.py`) whenever you want to refresh the
cache — the running app never calls Places API itself, so a live API hiccup
can't affect a demo. This mirrors mock_data.py's schema exactly, so
poi_data.py can serve either source through the same interface.

Places API doesn't expose ticket prices or typical visit duration, so those
two fields are category-based estimates, not real data — everything else
(name, coordinates, weekly hours, rating) is real.
"""

import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.location,places.types,"
    "places.regularOpeningHours,places.rating,places.priceLevel"
)

DESTINATIONS = {
    "Jaipur": "jp",
    "Delhi": "dl",
    "Agra": "ag",
    "Goa": "go",
    "Udaipur": "ud",
    "Kochi": "kc",
}

CATEGORY_QUERIES = {
    "heritage": "heritage sites and historical landmarks in {dest} India",
    "food": "top restaurants in {dest} India",
    "nightlife": "nightlife and bars in {dest} India",
    "shopping": "shopping markets and bazaars in {dest} India",
    "nature": "parks and nature attractions in {dest} India",
}

RESULTS_PER_CATEGORY = 3

AVG_DURATION_MIN = {
    "heritage": 90,
    "food": 60,
    "nightlife": 120,
    "shopping": 90,
    "nature": 75,
}

PRICE_LEVEL_TO_COST = {
    "food": {
        "PRICE_LEVEL_FREE": 200,
        "PRICE_LEVEL_INEXPENSIVE": 300,
        "PRICE_LEVEL_MODERATE": 600,
        "PRICE_LEVEL_EXPENSIVE": 1200,
        "PRICE_LEVEL_VERY_EXPENSIVE": 2000,
    },
    "nightlife": {
        "PRICE_LEVEL_FREE": 300,
        "PRICE_LEVEL_INEXPENSIVE": 600,
        "PRICE_LEVEL_MODERATE": 1000,
        "PRICE_LEVEL_EXPENSIVE": 1800,
        "PRICE_LEVEL_VERY_EXPENSIVE": 3000,
    },
}
DEFAULT_COST = {"heritage": 300, "food": 400, "nightlife": 1000, "shopping": 500, "nature": 0}

WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _estimate_cost(category: str, price_level: str | None) -> int:
    if category in PRICE_LEVEL_TO_COST and price_level in PRICE_LEVEL_TO_COST[category]:
        return PRICE_LEVEL_TO_COST[category][price_level]
    return DEFAULT_COST[category]


def _derive_hours(regular_hours: dict | None) -> tuple[str | dict, list[str]]:
    """Returns (open_hours, closed_weekdays). open_hours is a single "HH:MM-HH:MM"
    string when identical every open day, else a {weekday_name: "HH:MM-HH:MM"} map."""
    if not regular_hours or not regular_hours.get("periods"):
        return "00:00-23:59", []

    by_day: dict[int, str] = {}
    for period in regular_hours["periods"]:
        open_pt, close_pt = period.get("open"), period.get("close")
        if not open_pt:
            continue
        if not close_pt:
            # No close time at all means open 24 hours (Google's convention).
            return "00:00-23:59", []
        start = f"{open_pt['hour']:02d}:{open_pt.get('minute', 0):02d}"
        end = f"{close_pt['hour']:02d}:{close_pt.get('minute', 0):02d}"
        by_day[open_pt["day"]] = f"{start}-{end}"

    closed_weekdays = [WEEKDAY_NAMES[d] for d in range(7) if d not in by_day]
    distinct_ranges = set(by_day.values())
    if len(distinct_ranges) == 1 and not closed_weekdays:
        return next(iter(distinct_ranges)), []
    return {WEEKDAY_NAMES[d]: rng for d, rng in by_day.items()}, closed_weekdays


def fetch_category(destination: str, category: str) -> list[dict]:
    query = CATEGORY_QUERIES[category].format(dest=destination)
    resp = requests.post(
        SEARCH_URL,
        json={"textQuery": query, "maxResultCount": RESULTS_PER_CATEGORY},
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("places", [])


def build_destination_pois(destination: str, code: str) -> list[dict]:
    pois = []
    seen_place_ids = set()
    counter = 1

    for category in CATEGORY_QUERIES:
        try:
            places = fetch_category(destination, category)
        except requests.RequestException as e:
            print(f"  ! {category} fetch failed for {destination}: {e}")
            continue

        for place in places:
            place_id = place.get("id")
            if place_id in seen_place_ids:
                continue
            seen_place_ids.add(place_id)

            open_hours, closed_weekdays = _derive_hours(place.get("regularOpeningHours"))
            poi = {
                "id": f"{code}_{counter:02d}",
                "name": place.get("displayName", {}).get("text", "Unknown"),
                "lat": place["location"]["latitude"],
                "lng": place["location"]["longitude"],
                "category": category,
                "open_hours": open_hours,
                "avg_duration_min": AVG_DURATION_MIN[category],
                "cost": _estimate_cost(category, place.get("priceLevel")),
                "closed_on": None,
                "closed_weekdays": closed_weekdays,
                "rating": place.get("rating"),
            }
            pois.append(poi)
            counter += 1

        time.sleep(0.2)  # be polite to the API

    return pois


def main():
    if not API_KEY:
        raise RuntimeError("GOOGLE_PLACES_API_KEY is not set (see backend/.env.example)")

    result = {}
    for destination, code in DESTINATIONS.items():
        print(f"Fetching {destination}...")
        result[destination] = build_destination_pois(destination, code)
        print(f"  -> {len(result[destination])} POIs")

    os.makedirs("data", exist_ok=True)
    out_path = os.path.join("data", "pois_real.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()
