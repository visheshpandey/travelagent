"""5.4 Natural-language Q&A (build doc section 5.4)."""

from llm_client import generate_json

SYSTEM_PROMPT = """Answer the user's question about their trip. You're given the current
itinerary AND the full list of points of interest (POIs) available at the
destination, including ones not currently in the itinerary — use the latter
for questions like "what else is nearby" or "what am I not doing" that the
itinerary alone can't answer. Be concise (1-3 sentences).

For hypothetical questions ("what happens if X is cancelled?"), reason
qualitatively from the data available (e.g. name a same-category POI that
could replace it) — don't claim to already know a replanned outcome, since
you're not actually rebuilding the itinerary here. If the user wants that to
really happen, tell them to use the disruption flow.

If the answer isn't in the data, say so rather than guessing.

Output: {"answer": "..."}
"""


def answer_question(itinerary: dict, pois: list[dict], question: str) -> dict:
    return generate_json(SYSTEM_PROMPT, {"itinerary": itinerary, "pois": pois, "question": question})
