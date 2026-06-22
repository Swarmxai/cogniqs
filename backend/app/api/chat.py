import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.executions.service import ExecutionService
from app.models.workflow import Workflow

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/{workflow_id}")
async def chat(
    workflow_id: int,
    body: dict,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id, Workflow.owner_id == user.id)
    )
    wf = result.scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow not found")

    trigger_data = {
        "message": body.get("message", ""),
        "session_id": body.get("session_id", "default"),
        "history": body.get("history", []),
    }
    execution = await ExecutionService.run_workflow(db, wf, trigger_data, user.id)
    result_data = json.loads(execution.result or "{}")
    final = result_data.get("finalOutput", {})
    return {
        "response": final.get("response") or final.get("message") or final.get("answer", ""),
        "execution_id": execution.id,
        "status": execution.status,
    }
