"""5.3 Replanner with explanation (build doc section 5.3) — the differentiator."""

from llm_client import generate_json

SYSTEM_PROMPT = """A planned itinerary has been disrupted (a booking or activity is no longer
available). Rebuild the itinerary around this, keeping as much of the original
plan intact as possible, and explain your reasoning in plain language.

Rules:
- Only change what's necessary because of the disruption.
- If replacing a POI, prefer one in the same category from the available POI list.
- Your explanation must name what changed and WHY, in one or two sentences a
  non-technical person would understand.

Output ONLY valid JSON:
{"days": [{"date": "...", "items": [{"id":..,"poi":..,"start":..,"end":..,"cost":..,"category":..}], "day_cost": ..}], "explanation": "..."}
"""


def replan(itinerary: dict, item_id: str, reason: str, pois: list[dict]) -> dict:
    return generate_json(
        SYSTEM_PROMPT,
        {
            "itinerary": itinerary,
            "disrupted_item_id": item_id,
            "reason": reason,
            "pois": pois,
        },
    )
