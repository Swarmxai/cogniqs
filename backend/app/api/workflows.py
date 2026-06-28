import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.engine.node_registry import get_all_node_descriptions, get_node_categories
from app.executions.service import ExecutionService
from app.models.workflow import Workflow
from app.services.webhook_tokens import make_webhook_token
from app.schemas.workflow import (
    ExecuteNodeRequest,
    ExecuteRequest,
    ExecutionResponse,
    WorkflowCreate,
    WorkflowResponse,
    WorkflowUpdate,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


def _serialize_workflow(w: Workflow) -> WorkflowResponse:
    return WorkflowResponse(
        id=w.id,
        name=w.name,
        description=w.description,
        nodes=json.loads(w.nodes or "[]"),
        connections=json.loads(w.connections or "[]"),
        active=w.active,
        owner_id=w.owner_id,
        project_id=w.project_id,
        created_at=w.created_at,
        updated_at=w.updated_at,
    )


@router.get("", response_model=list[WorkflowResponse])
async def list_workflows(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[WorkflowResponse]:
    result = await db.execute(select(Workflow).where(Workflow.owner_id == user.id).order_by(Workflow.updated_at.desc()))
    return [_serialize_workflow(w) for w in result.scalars()]


@router.post("", response_model=WorkflowResponse)
async def create_workflow(
    body: WorkflowCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> WorkflowResponse:
    wf = Workflow(
        name=body.name,
        description=body.description,
        nodes=json.dumps(body.nodes),
        connections=json.dumps(body.connections),
        owner_id=user.id,
        project_id=body.project_id,
    )
    db.add(wf)
    await db.flush()
    return _serialize_workflow(wf)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> WorkflowResponse:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    return _serialize_workflow(wf)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int, body: WorkflowUpdate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> WorkflowResponse:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    if body.name is not None:
        wf.name = body.name
    if body.description is not None:
        wf.description = body.description
    if body.nodes is not None:
        wf.nodes = json.dumps(body.nodes)
    if body.connections is not None:
        wf.connections = json.dumps(body.connections)
    if body.active is not None:
        wf.active = body.active
    if body.project_id is not None:
        wf.project_id = body.project_id
    await db.flush()
    return _serialize_workflow(wf)


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    await db.delete(wf)
    return {"deleted": True}


@router.get("/{workflow_id}/webhook")
async def get_webhook_url(workflow_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    token = make_webhook_token(wf.id, wf.owner_id)
    return {
        "workflow_id": wf.id,
        "active": wf.active,
        "token": token,
        "url": f"/api/webhooks/{wf.id}/{token}",
        "method": "POST",
        "hint": "Activate the workflow and POST JSON to this URL from any external system.",
    }


@router.post("/{workflow_id}/execute-node", response_model=ExecutionResponse)
async def execute_workflow_node(
    workflow_id: int, body: ExecuteNodeRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> ExecutionResponse:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    execution = await ExecutionService.run_single_node(db, wf, body.node_id, body.trigger_data, user.id)
    return _serialize_execution(execution)


@router.post("/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: int, body: ExecuteRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> ExecutionResponse:
    wf = await _get_owned_workflow(db, workflow_id, user.id)
    execution = await ExecutionService.run_workflow(db, wf, body.trigger_data, user.id)
    return _serialize_execution(execution)


async def _get_owned_workflow(db: AsyncSession, workflow_id: int, user_id: int) -> Workflow:
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id, Workflow.owner_id == user_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow not found")
    return wf


def _serialize_execution(ex) -> ExecutionResponse:
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
