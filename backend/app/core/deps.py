"""FastAPI auth dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token") from exc
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

# Role hierarchy — higher index = more privilege
ROLE_HIERARCHY = ["viewer", "tester", "editor", "admin", "owner"]


def require_role(min_role: str):
    """Dependency factory enforcing a minimum role level."""
    from app.core.errors import ForbiddenError

    async def _checker(user: CurrentUser) -> User:
        try:
            user_level = ROLE_HIERARCHY.index(user.role)
            required_level = ROLE_HIERARCHY.index(min_role)
        except ValueError:
            raise ForbiddenError("Unknown role")
        if user.is_active and user_level >= required_level:
            return user
        raise ForbiddenError(f"Requires '{min_role}' role or higher")

    return _checker
