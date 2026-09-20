"""Chat intent classifier — lets the chat widget also DO things (change
budget/dates, replan a specific stop), not just answer questions. Only
decides WHAT the user wants; the endpoint does the actual work by calling
the same generate_itinerary/replan functions the button-driven flows use.
"""

from llm_client import generate_json

SYSTEM_PROMPT = """You are the intent classifier for a trip-planning chat assistant. Given
the current itinerary, the current constraints, and a free-text chat message,
decide which ONE action the user wants:

- "modify_budget": the user wants a different budget (e.g. "make it cheaper",
  "I have more to spend", "set my budget to 20000"). If they gave an explicit
  number, output it as budget_total. If only relative ("cheaper"/"costlier",
  no number), adjust the CURRENT budget_total by about 20% in that direction
  and output the new number as budget_total.
- "modify_dates": the user wants different trip dates. Output start_date and
  end_date as ISO "YYYY-MM-DD".
- "disrupt_item": the user says they missed a time slot, something is closed,
  or they want to swap out a specific stop (e.g. "I missed my visit to the
  fort", "skip the museum today"). Find the matching item in the itinerary
  and output its exact existing "id" field as item_id — NEVER invent an id
  that isn't already in the itinerary. Output a short reason paraphrasing why.
- "answer": anything else — a real question, small talk, or a request too
  vague to act on safely (e.g. "change my plan" with no specifics of what to
  change). When ambiguous, prefer "answer" and ask a clarifying question
  rather than guessing.

Always also output "message": a short natural-language reply to show the
user. For modify_budget/modify_dates/disrupt_item, the action ALWAYS
actually happens immediately — there is no separate approval step — so
phrase "message" as a confirmation of what you just did (past tense, e.g.
"Done — lowered your budget to ₹12,000 and replanned the day." or "Swapped
out the fort visit since you missed it — here's the updated plan."), never
as a question asking whether to proceed. For "answer", a helpful reply or,
if genuinely ambiguous, a clarifying question.

Output ONLY valid JSON matching this shape (omit fields that don't apply to
the chosen action):
{"action": "modify_budget"|"modify_dates"|"disrupt_item"|"answer", "budget_total": number, "start_date": "...", "end_date": "...", "item_id": "...", "reason": "...", "message": "..."}
"""


def classify_and_act(itinerary: dict, constraints: dict, pois: list[dict], message: str) -> dict:
    return generate_json(
        SYSTEM_PROMPT,
        {
            "itinerary": itinerary,
            "constraints": constraints,
            "pois": pois,
            "message": message,
        },
    )
