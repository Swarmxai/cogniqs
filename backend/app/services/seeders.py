import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.core.security import hash_password
from app.models.user import User


async def ensure_demo_user(db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.email == "demo@cogniqs.dev"))
    if result.scalar_one_or_none():
        return
    db.add(User(
        email="demo@cogniqs.dev",
        name="Demo User",
        hashed_password=hash_password("demo1234"),
        role="admin",
    ))
