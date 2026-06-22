import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.execution import Execution
from app.models.workflow import Workflow
from app.schemas.workflow import ExecutionResponse

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("", response_model=list[ExecutionResponse])
async def list_executions(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    workflow_id: int | None = None,
) -> list[ExecutionResponse]:
    stmt = (
        select(Execution)
        .join(Workflow, Execution.workflow_id == Workflow.id)
        .where(Workflow.owner_id == user.id)
        .order_by(Execution.started_at.desc())
        .limit(50)
    )
    if workflow_id is not None:
        stmt = stmt.where(Execution.workflow_id == workflow_id)
    result = await db.execute(stmt)
    return [_serialize(e) for e in result.scalars()]


def _serialize(ex: Execution) -> ExecutionResponse:
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
