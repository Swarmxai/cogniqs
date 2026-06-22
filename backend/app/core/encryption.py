"""Simple encryption helpers — optional Fernet when cryptography is available."""

from __future__ import annotations

import base64
import hashlib


def _derive_key(secret: str) -> bytes:
    return base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())


def encrypt_value(value: str, secret: str) -> str:
    try:
        from cryptography.fernet import Fernet
        return Fernet(_derive_key(secret)).encrypt(value.encode()).decode()
    except ImportError:
        import json
        encoded = base64.b64encode(value.encode()).decode()
        return json.dumps({"v": 1, "d": encoded})


def decrypt_value(token: str, secret: str) -> str:
    try:
        from cryptography.fernet import Fernet
        return Fernet(_derive_key(secret)).decrypt(token.encode()).decode()
    except ImportError:
        import json
        payload = json.loads(token)
        return base64.b64decode(payload["d"]).decode()
