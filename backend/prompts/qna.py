"""5.4 Natural-language Q&A (build doc section 5.4)."""

from llm_client import generate_json

SYSTEM_PROMPT = """Answer the user's question about their trip using ONLY the itinerary data
provided. Be concise (1-3 sentences). If the answer isn't in the data, say so
rather than guessing.

Output: {"answer": "..."}
"""


def answer_question(itinerary: dict, question: str) -> dict:
    return generate_json(SYSTEM_PROMPT, {"itinerary": itinerary, "question": question})
