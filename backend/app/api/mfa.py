"""MFA (TOTP) API — enroll, verify, validate. Uses pyotp (lazy-installed)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import ValidationError
from app.database import get_db
from app.utils.auto_install import lazy_import

router = APIRouter(prefix="/auth/mfa", tags=["mfa"])


class TOTPBody(BaseModel):
    code: str


def _pyotp():
    return lazy_import("pyotp", pip_name="pyotp", auto_install=True)


@router.post("/enroll")
async def enroll(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    pyotp = _pyotp()
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    user.mfa_enabled = False
    await db.flush()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="Cogniqs")
    return {"secret": secret, "otpauth_uri": uri}


@router.post("/verify")
async def verify(body: TOTPBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    pyotp = _pyotp()
    if not user.mfa_secret:
        raise ValidationError("Start enrollment first")
    if not pyotp.TOTP(user.mfa_secret).verify(body.code):
        raise ValidationError("Invalid code")
    user.mfa_enabled = True
    await db.flush()
    return {"mfa_enabled": True}


@router.post("/validate")
async def validate(body: TOTPBody, user: CurrentUser) -> dict:
    pyotp = _pyotp()
    if not user.mfa_enabled or not user.mfa_secret:
        raise ValidationError("MFA not enabled")
    valid = pyotp.TOTP(user.mfa_secret).verify(body.code)
    if not valid:
        raise ValidationError("Invalid code")
    return {"valid": True}


@router.post("/disable")
async def disable(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    user.mfa_enabled = False
    user.mfa_secret = ""
    await db.flush()
    return {"mfa_enabled": False}
