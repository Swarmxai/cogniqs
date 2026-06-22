"""Usage analytics API — token usage and cost telemetry."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.token_usage import TokenUsageLog

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/summary")
async def usage_summary(user: CurrentUser, db: AsyncSession = Depends(get_db), days: int = 30) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsageLog.total_tokens), 0),
            func.coalesce(func.sum(TokenUsageLog.estimated_cost), 0.0),
            func.count(TokenUsageLog.id),
        ).where(TokenUsageLog.created_at >= since)
    )
    total_tokens, total_cost, call_count = result.one()
    return {
        "total_tokens": int(total_tokens),
        "total_cost": round(float(total_cost), 4),
        "call_count": int(call_count),
        "days": days,
    }


@router.get("/models")
async def usage_by_model(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(
            TokenUsageLog.provider,
            TokenUsageLog.model,
            func.sum(TokenUsageLog.total_tokens),
            func.sum(TokenUsageLog.estimated_cost),
            func.count(TokenUsageLog.id),
        ).group_by(TokenUsageLog.provider, TokenUsageLog.model)
    )
    return [
        {"provider": row[0], "model": row[1], "tokens": int(row[2] or 0),
         "cost": round(float(row[3] or 0), 4), "calls": int(row[4])}
        for row in result.all()
    ]


@router.get("/daily")
async def usage_daily(user: CurrentUser, db: AsyncSession = Depends(get_db), days: int = 30) -> list[dict]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(TokenUsageLog.created_at, TokenUsageLog.total_tokens, TokenUsageLog.estimated_cost)
        .where(TokenUsageLog.created_at >= since)
    )
    buckets: dict[str, dict] = {}
    for created_at, tokens, cost in result.all():
        day = created_at.date().isoformat() if created_at else "unknown"
        b = buckets.setdefault(day, {"date": day, "tokens": 0, "cost": 0.0})
        b["tokens"] += int(tokens or 0)
        b["cost"] += float(cost or 0)
    return sorted(buckets.values(), key=lambda x: x["date"])
