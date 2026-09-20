"""Gemini client — swap model/provider by editing this one file.

Each prompt module calls generate_json(system_prompt, payload) and gets back
a parsed dict. Malformed JSON is retried once, per the build doc's
implementation note. Transient network/server errors are retried separately
with backoff, since a live demo can't afford to fail on a single dropped
connection to Gemini.
"""

import json
import os
import time

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

load_dotenv()

_TRANSIENT_ERRORS = (requests.exceptions.RequestException, genai_errors.ServerError)

_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set (see backend/.env.example)")
        _client = genai.Client(api_key=api_key)
    return _client


def _call(system_prompt: str, payload: dict, *, retries: int = 2) -> str:
    client = _get_client()
    for attempt in range(retries + 1):
        try:
            response = client.models.generate_content(
                model=_MODEL,
                contents=json.dumps(payload),
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    # Long, dense itineraries (many days x several stops/day)
                    # produce large JSON payloads — the default cap risks
                    # silent truncation on longer trips.
                    max_output_tokens=16384,
                ),
            )
            return response.text
        except _TRANSIENT_ERRORS:
            if attempt == retries:
                raise
            time.sleep(1.5 * (attempt + 1))


def generate_json(system_prompt: str, payload: dict) -> dict:
    """Calls Gemini with a system prompt + JSON payload, returns parsed JSON.

    Retries once on malformed JSON before giving up (network/server errors are
    retried separately, inside _call).
    """
    raw = _call(system_prompt, payload)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raw = _call(system_prompt, payload)
        return json.loads(raw)
