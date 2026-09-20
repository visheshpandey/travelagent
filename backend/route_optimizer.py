"""Deterministic per-day route optimization (build doc section: reduce unnecessary
travel between activities).

Generation prompts the LLM to "cluster by proximity", but that's a best-effort
instruction, not a guarantee. This re-orders each day's stops with a real
algorithm over real travel-time estimates, and only ever keeps a reordering
that (a) reduces total travel time and (b) still respects every stop's
open_hours — never a regression, and never an invalid schedule.
"""

from itertools import permutations

from utils import estimate_travel_minutes

_MAX_ITEMS_TO_OPTIMIZE = 7


def _parse_hours(open_hours: str) -> tuple[int, int]:
    """'09:00-18:00' -> (540, 1080) in minutes since midnight."""
    start_str, end_str = open_hours.split("-")
    sh, sm = (int(x) for x in start_str.split(":"))
    eh, em = (int(x) for x in end_str.split(":"))
    return sh * 60 + sm, eh * 60 + em


def _to_minutes(hhmm: str) -> int:
    h, m = (int(x) for x in hhmm.split(":"))
    return h * 60 + m


def _to_hhmm(minutes: int) -> str:
    minutes = minutes % (24 * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _route_minutes(order: list[dict]) -> int:
    total = 0
    for a, b in zip(order, order[1:]):
        total += estimate_travel_minutes(a["lat"], a["lng"], b["lat"], b["lng"])
    return total


def _try_schedule(order: list[dict], poi_by_id: dict, day_start_minutes: int) -> list[dict] | None:
    """Walks `order` sequentially, recomputing start/end. Returns None if any
    stop can't fit inside its POI's open_hours."""
    scheduled = []
    prev_end = day_start_minutes
    prev_item = None
    for item in order:
        poi = poi_by_id.get(item["id"])
        if poi is None or "open_hours" not in poi:
            return None
        open_start, open_end = _parse_hours(poi["open_hours"])
        duration = poi.get("avg_duration_min", 60)

        if prev_item is None:
            arrival = max(prev_end, open_start)
        else:
            travel = estimate_travel_minutes(prev_item["lat"], prev_item["lng"], item["lat"], item["lng"])
            arrival = max(prev_end + travel, open_start)

        end = arrival + duration
        if end > open_end:
            return None

        new_item = {**item, "start": _to_hhmm(arrival), "end": _to_hhmm(end)}
        scheduled.append(new_item)
        prev_end = end
        prev_item = item
    return scheduled


def _optimize_day(items: list[dict], poi_by_id: dict) -> list[dict]:
    if len(items) <= 2 or len(items) > _MAX_ITEMS_TO_OPTIMIZE:
        return items
    if any(item.get("lat") is None or item.get("lng") is None for item in items):
        return items

    day_start_minutes = _to_minutes(items[0]["start"])
    original_minutes = _route_minutes(items)

    best_order = items
    best_minutes = original_minutes
    anchor, rest = items[0], items[1:]
    for perm in permutations(rest):
        candidate = [anchor, *perm]
        minutes = _route_minutes(candidate)
        if minutes < best_minutes:
            best_order, best_minutes = candidate, minutes

    if best_order is items:
        return items  # no improving permutation found

    scheduled = _try_schedule(best_order, poi_by_id, day_start_minutes)
    return scheduled if scheduled is not None else items


def optimize_itinerary(itinerary: dict, pois: list[dict]) -> dict:
    poi_by_id = {p["id"]: p for p in pois}
    for day in itinerary.get("days", []):
        day["items"] = _optimize_day(day["items"], poi_by_id)
    return itinerary
