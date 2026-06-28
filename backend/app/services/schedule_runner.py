"""Background scheduler — runs active workflows with schedule_trigger nodes."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

from croniter import croniter
from sqlalchemy import select

from app.database import async_session_factory
from app.executions.service import ExecutionService
from app.models.workflow import Workflow

logger = logging.getLogger(__name__)

_RULE_TO_CRON = {
    "everyMinute": "* * * * *",
    "every15Minutes": "*/15 * * * *",
    "everyHour": "0 * * * *",
    "everyDay": "0 0 * * *",
    "everyWeek": "0 0 * * 0",
}

_last_run: dict[int, datetime] = {}
_task: asyncio.Task | None = None


def _cron_for_node(node: dict) -> str | None:
    params = node.get("data", {}).get("parameters", node.get("parameters", {}))
    rule = params.get("rule", "everyHour")
    if rule == "custom":
        return params.get("cronExpression") or None
    return _RULE_TO_CRON.get(rule)


def _should_run(workflow_id: int, cron_expr: str, now: datetime) -> bool:
    try:
        itr = croniter(cron_expr, now)
        prev = itr.get_prev(datetime)
    except Exception:
        return False
    last = _last_run.get(workflow_id)
    if last and prev <= last:
        return False
    # Fire if we're within the tick window (scheduler polls every 60s)
    return (now - prev).total_seconds() < 90


async def _tick() -> None:
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        result = await db.execute(select(Workflow).where(Workflow.active == True))  # noqa: E712
        workflows = result.scalars().all()
        for wf in workflows:
            nodes = json.loads(wf.nodes or "[]")
            sched = next((n for n in nodes if n.get("type") == "schedule_trigger"), None)
            if not sched:
                continue
            cron_expr = _cron_for_node(sched)
            if not cron_expr or not _should_run(wf.id, cron_expr, now):
                continue
            try:
                await ExecutionService.run_workflow(
                    db, wf, {"source": "schedule", "rule": cron_expr}, wf.owner_id,
                )
                _last_run[wf.id] = now
                await db.commit()
                logger.info("Scheduled run workflow #%s", wf.id)
            except Exception as exc:
                logger.warning("Schedule run failed for workflow %s: %s", wf.id, exc)
                await db.rollback()


async def _loop() -> None:
    while True:
        try:
            await _tick()
        except Exception as exc:
            logger.exception("Scheduler tick error: %s", exc)
        await asyncio.sleep(60)


def start_scheduler() -> None:
    global _task
    if _task is None or _task.done():
        _task = asyncio.create_task(_loop())
        logger.info("Workflow scheduler started (60s interval)")


def stop_scheduler() -> None:
    global _task
    if _task and not _task.done():
        _task.cancel()
        _task = None
