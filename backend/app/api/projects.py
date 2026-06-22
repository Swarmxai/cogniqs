"""Projects API — group workflows into projects."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.project import Project

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    color: str = "#6366f1"


def _to_dict(p: Project, workflow_count: int = 0) -> dict:
    return {
        "id": p.id, "name": p.name, "description": p.description, "color": p.color,
        "workflow_count": workflow_count,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("")
async def list_projects(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(Project).where(Project.owner_id == user.id).order_by(Project.created_at.desc())
    )
    return [_to_dict(p, len(p.workflows or [])) for p in result.scalars()]


@router.post("")
async def create_project(body: ProjectBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = Project(name=body.name, description=body.description, color=body.color, owner_id=user.id)
    db.add(project)
    await db.flush()
    return _to_dict(project, 0)


async def _get_owned(db: AsyncSession, project_id: int, owner_id: int) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    return project


@router.put("/{project_id}")
async def update_project(project_id: int, body: ProjectBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    project.name = body.name
    project.description = body.description
    project.color = body.color
    await db.flush()
    return _to_dict(project, len(project.workflows or []))


@router.delete("/{project_id}")
async def delete_project(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    await db.delete(project)
    return {"deleted": True}
