"""Travel-time estimation via lat/lng distance + flat speed (build doc section 4).

No live Maps API: haversine distance at an assumed 20 km/h average city speed.
"""

import math

AVG_SPEED_KMPH = 20.0


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
