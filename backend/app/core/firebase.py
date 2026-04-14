"""Firebase Admin SDK initialization and token verification."""

from __future__ import annotations

import os

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

_app: firebase_admin.App | None = None


def get_firebase_app() -> firebase_admin.App:
    """Initialize Firebase Admin SDK (lazy singleton)."""
    global _app
    if _app is None:
        cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
        if cred_path:
            cred = credentials.Certificate(cred_path)
            _app = firebase_admin.initialize_app(cred)
        else:
            # Use Application Default Credentials (works on GCP)
            _app = firebase_admin.initialize_app()
    return _app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    get_firebase_app()
    decoded = firebase_auth.verify_id_token(id_token)
    return decoded
