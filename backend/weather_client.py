"""Live current-weather lookup via OpenWeatherMap — used as a real,
demo-friendly disruption trigger (see build doc: forecasts can't reach
months into the future, so this checks TODAY's actual conditions at the
destination, not a date-matched forecast).
"""

import os

import requests

_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# OpenWeatherMap condition groups that would plausibly disrupt outdoor plans.
_SEVERE_MAIN_GROUPS = {"Thunderstorm", "Drizzle", "Rain", "Snow"}
_SEVERE_CONDITION_IDS = {771, 781}  # squall, tornado


def get_current_weather(destination: str) -> dict:
    """Returns {"description": str, "main": str, "temp_c": float, "is_severe": bool}."""
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENWEATHER_API_KEY is not set (see backend/.env.example)")

    resp = requests.get(
        _BASE_URL,
        params={"q": f"{destination},IN", "appid": api_key, "units": "metric"},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    condition = data["weather"][0]
    is_severe = condition["main"] in _SEVERE_MAIN_GROUPS or condition["id"] in _SEVERE_CONDITION_IDS

    return {
        "main": condition["main"],
        "description": condition["description"],
        "temp_c": data["main"]["temp"],
        "is_severe": is_severe,
    }
