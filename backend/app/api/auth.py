from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser
from app.core.errors import ValidationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginMFAComplete, MFARequiredResponse, TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise ValidationError("Email already registered")
    user = User(email=body.email, name=body.name, hashed_password=hash_password(body.password))
    db.add(user)
    await db.flush()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/login")
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise ValidationError("Invalid email or password")
    if user.mfa_enabled:
        return MFARequiredResponse(email=user.email)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/login/mfa", response_model=TokenResponse)
async def login_mfa(body: LoginMFAComplete, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise ValidationError("Invalid email or password")
    if not user.mfa_enabled or not user.mfa_secret:
        raise ValidationError("MFA is not enabled for this account")
    from app.api.mfa import _pyotp
    if not _pyotp().TOTP(user.mfa_secret).verify(body.code):
        raise ValidationError("Invalid authenticator code")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)
