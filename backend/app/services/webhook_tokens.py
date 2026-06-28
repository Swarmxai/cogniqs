"""Deterministic webhook tokens — no extra DB column required."""

from __future__ import annotations

import hashlib
import hmac

from app.config import settings


def make_webhook_token(workflow_id: int, owner_id: int) -> str:
    digest = hmac.new(
        settings.SECRET_KEY.encode(),
        f"webhook:{workflow_id}:{owner_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return digest[:32]


def verify_webhook_token(workflow_id: int, owner_id: int, token: str) -> bool:
    expected = make_webhook_token(workflow_id, owner_id)
    return hmac.compare_digest(expected, token)
