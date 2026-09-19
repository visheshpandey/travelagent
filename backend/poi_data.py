"""POI data source used by the app: serves the real Google Places cache
(data/pois_real.json, built by fetch_places.py) when present, otherwise
falls back to the hand-curated mock_data.py — same interface either way,
so nothing else in the app needs to know which source is active.
"""

import json
import os

import mock_data

_CACHE_PATH = os.path.join(os.path.dirname(__file__), "data", "pois_real.json")


def _load_real_pois() -> dict[str, list[dict]] | None:
    if not os.path.exists(_CACHE_PATH):
        return None
    with open(_CACHE_PATH, encoding="utf-8") as f:
        return json.load(f)


_POIS = _load_real_pois()
USING_REAL_DATA = _POIS is not None
if _POIS is None:
    _POIS = mock_data.POIS


def get_pois(destination: str) -> list[dict]:
    return _POIS.get(destination, [])


def get_poi_by_id(destination: str, poi_id: str) -> dict | None:
    for poi in get_pois(destination):
        if poi["id"] == poi_id:
            return poi
    return None


def list_destinations() -> list[str]:
    return list(_POIS.keys())
