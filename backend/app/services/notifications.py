"""Notification helpers."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def notify_user(
    db: AsyncSession,
    user_id: int,
    *,
    title: str,
    message: str = "",
    ntype: str = "info",
    link: str = "",
) -> Notification:
    n = Notification(user_id=user_id, type=ntype, title=title, message=message, link=link)
    db.add(n)
    await db.flush()
    return n
