"""Google Sign-In verification + in-memory sessions.

Uses Google Identity Services on the frontend (a signed ID token handed
straight to the browser, no redirect flow) and verifies that token here
against Google's public keys — no client secret needed. Sessions are an
in-memory store keyed by an opaque token, mirroring state.py's _trips
pattern; good enough for a hackathon demo, not meant to survive a restart.
"""

import os
import time
import uuid

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

_sessions: dict[str, dict] = {}


def verify_google_id_token(token: str) -> dict | None:
    """Verifies a Google-signed ID token. Returns the user's claims on
    success, None on any failure (bad signature, expired, wrong audience,
    missing GOOGLE_CLIENT_ID) — callers turn that into a 400, never a crash."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        return None
    try:
        claims = google_id_token.verify_oauth2_token(token, google_requests.Request(), audience=client_id)
    except Exception:
        return None
    return {
        "sub": claims["sub"],
        "email": claims.get("email", ""),
        "name": claims.get("name", claims.get("email", "")),
        "picture": claims.get("picture"),
    }


def create_session(user: dict) -> str:
    token = f"s_{uuid.uuid4().hex}"
    _sessions[token] = {"user": user, "expires_at": time.time() + _SESSION_TTL_SECONDS}
    return token


def get_session(token: str) -> dict | None:
    session = _sessions.get(token)
    if session is None:
        return None
    if session["expires_at"] < time.time():
        del _sessions[token]
        return None
    return session["user"]
