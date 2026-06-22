"""Notifications & audit log APIs."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, require_role
from app.database import get_db
from app.models.notification import AuditLog, Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])
audit_router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
async def list_notifications(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc()).limit(100)
    )
    return [n.to_dict() for n in result.scalars()]


@router.get("/unread-count")
async def unread_count(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)  # noqa: E712
    )
    return {"count": len(result.scalars().all())}


@router.post("/{notification_id}/read")
async def mark_read(notification_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
        .values(is_read=True)
    )
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(
        update(Notification).where(Notification.user_id == user.id).values(is_read=True)
    )
    return {"ok": True}


@audit_router.get("/logs")
async def audit_logs(
    user=Depends(require_role("admin")), db: AsyncSession = Depends(get_db), limit: int = 100
) -> list[dict]:
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    )
    return [a.to_dict() for a in result.scalars()]
