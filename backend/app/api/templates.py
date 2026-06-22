import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.workflow import Workflow
from app.models.workflow_template import WorkflowTemplate

router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    tags: str
    icon: str
    featured: bool
    nodes: list
    connections: list

    model_config = {"from_attributes": True}


@router.get("", response_model=list[TemplateResponse])
async def list_templates(db: AsyncSession = Depends(get_db)) -> list[TemplateResponse]:
    result = await db.execute(select(WorkflowTemplate).order_by(WorkflowTemplate.featured.desc()))
    return [_serialize(t) for t in result.scalars()]


@router.post("/{template_id}/use")
async def use_template(
    template_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    result = await db.execute(select(WorkflowTemplate).where(WorkflowTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise NotFoundError("Template not found")

    wf = Workflow(
        name=f"{tpl.name} (copy)",
        description=tpl.description,
        nodes=tpl.nodes,
        connections=tpl.connections,
        owner_id=user.id,
    )
    db.add(wf)
    await db.flush()
    return {"id": wf.id, "name": wf.name}


def _serialize(t: WorkflowTemplate) -> TemplateResponse:
    return TemplateResponse(
        id=t.id, name=t.name, description=t.description, category=t.category,
        tags=t.tags, icon=t.icon, featured=t.featured,
        nodes=json.loads(t.nodes or "[]"), connections=json.loads(t.connections or "[]"),
    )
