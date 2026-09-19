"""5.2 Conflict detection (build doc section 5.2)."""

from llm_client import generate_json

SYSTEM_PROMPT = """You review a day-by-day itinerary for scheduling problems.

Check for:
- Overlapping time windows on the same day
- A visit scheduled outside a POI's open_hours
- Insufficient travel time between consecutive POIs (assume travel time roughly
  proportional to lat/lng distance)

Output ONLY valid JSON:
{"conflicts": [{"day": "...", "item_ids": [...], "issue": "plain-language description"}]}
If none, return {"conflicts": []}.
"""


def check_conflicts(itinerary: dict, pois: list[dict]) -> dict:
    return generate_json(SYSTEM_PROMPT, {"itinerary": itinerary, "pois": pois})
