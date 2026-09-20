"""5.2 Conflict detection (build doc section 5.2).

Was originally an LLM call asked to eyeball raw lat/lng and guess whether
travel time was "sufficient" — with no concrete numbers to reason from, it
over-flagged nearly every consecutive pair, and never cited an actual
minute count in its explanation. This is fully deterministic instead, reusing
the same estimate_travel_minutes() the dashboard's transportation panel
already uses — so a flagged conflict's numbers always match what's shown
elsewhere in the app, and the issue text always says the real gap and the
real estimated travel time.
"""

from utils import estimate_travel_minutes


def _to_minutes(hhmm: str) -> int:
    h, m = (int(x) for x in hhmm.split(":"))
    return h * 60 + m


def _parse_hours(open_hours: str) -> tuple[int, int]:
    start_str, end_str = open_hours.split("-")
    return _to_minutes(start_str), _to_minutes(end_str)


def check_conflicts(itinerary: dict, pois: list[dict]) -> dict:
    poi_by_id = {p["id"]: p for p in pois}
    conflicts: list[dict] = []

    for day in itinerary.get("days", []):
        items = day.get("items", [])
        date = day.get("date", "")

        for item in items:
            poi = poi_by_id.get(item.get("id"))
            if poi is None or "open_hours" not in poi:
                continue
            open_start, open_end = _parse_hours(poi["open_hours"])
            start, end = _to_minutes(item["start"]), _to_minutes(item["end"])
            if start < open_start or end > open_end:
                conflicts.append({
                    "day": date,
                    "item_ids": [item["id"]],
                    "issue": f"{item['poi']} is scheduled {item['start']}–{item['end']}, outside its open hours ({poi['open_hours']}).",
                })

        for a, b in zip(items, items[1:]):
            gap = _to_minutes(b["start"]) - _to_minutes(a["end"])
            if gap < 0:
                conflicts.append({
                    "day": date,
                    "item_ids": [a["id"], b["id"]],
                    "issue": f"{a['poi']} ({a['start']}–{a['end']}) overlaps with {b['poi']} ({b['start']}–{b['end']}).",
                })
                continue
            if a.get("lat") is None or b.get("lat") is None:
                continue
            travel = estimate_travel_minutes(a["lat"], a["lng"], b["lat"], b["lng"])
            if gap < travel:
                conflicts.append({
                    "day": date,
                    "item_ids": [a["id"], b["id"]],
                    "issue": f"Only {gap} min between {a['poi']} ending and {b['poi']} starting, but travel takes about {travel} min.",
                })

    return {"conflicts": conflicts}
