"""Public webhook entrypoints — trigger workflows from external systems."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.database import get_db
from app.executions.service import ExecutionService
from app.models.workflow import Workflow
from app.schemas.workflow import ExecutionResponse
from app.services.webhook_tokens import verify_webhook_token

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/{workflow_id}/{token}", response_model=ExecutionResponse)
async def trigger_webhook(
    workflow_id: int,
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ExecutionResponse:
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow not found")
    if not wf.active:
        raise ForbiddenError("Workflow is not active — enable it in the editor")
    if not verify_webhook_token(workflow_id, wf.owner_id, token):
        raise ForbiddenError("Invalid webhook token")

    body: dict[str, Any] = {}
    if request.headers.get("content-type", "").startswith("application/json"):
        try:
            body = await request.json()
        except Exception:
            body = {}
    elif request.headers.get("content-type", "").startswith("application/x-www-form-urlencoded"):
        form = await request.form()
        body = dict(form)

    trigger_data = {
        "source": "webhook",
        "method": request.method,
        "headers": dict(request.headers),
        "query": dict(request.query_params),
        "body": body,
    }

    execution = await ExecutionService.run_workflow(db, wf, trigger_data, wf.owner_id)
    return _serialize(execution)


def _serialize(ex) -> ExecutionResponse:
    return ExecutionResponse(
        id=ex.id,
        workflow_id=ex.workflow_id,
        status=ex.status,
        trigger_data=json.loads(ex.trigger_data or "{}"),
        result=json.loads(ex.result or "{}"),
        error=ex.error,
        started_at=ex.started_at,
        finished_at=ex.finished_at,
    )
