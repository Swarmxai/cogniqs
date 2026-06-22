"""UI Builder API — CRUD, publish, and public snapshot retrieval."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.ui_project import UIProject

router = APIRouter(prefix="/ui-projects", tags=["ui-builder"])


class UIProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class UIProjectUpdate(BaseModel):
    name: str | None = None
    components: list | None = None
    settings: dict | None = None


@router.get("")
async def list_ui_projects(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(UIProject).where(UIProject.owner_id == user.id).order_by(UIProject.updated_at.desc())
    )
    return [p.to_dict() for p in result.scalars()]


@router.post("")
async def create_ui_project(body: UIProjectCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = UIProject(name=body.name, owner_id=user.id)
    db.add(project)
    await db.flush()
    return project.to_dict()


async def _get_owned(db: AsyncSession, project_id: int, owner_id: int) -> UIProject:
    result = await db.execute(
        select(UIProject).where(UIProject.id == project_id, UIProject.owner_id == owner_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("UI project not found")
    return project


@router.get("/public/{public_id}")
async def get_public(public_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(UIProject).where(UIProject.public_id == public_id))
    project = result.scalar_one_or_none()
    if not project or not project.published:
        raise NotFoundError("Published UI not found")
    return project.to_dict(published=True)


@router.get("/{project_id}")
async def get_ui_project(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    return project.to_dict()


@router.put("/{project_id}")
async def update_ui_project(project_id: int, body: UIProjectUpdate, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    if body.name is not None:
        project.name = body.name
    if body.components is not None:
        project.components = json.dumps(body.components)
    if body.settings is not None:
        project.settings = json.dumps(body.settings)
    await db.flush()
    return project.to_dict()


@router.post("/{project_id}/publish")
async def publish_ui_project(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    project.published_snapshot = project.components
    project.published = True
    await db.flush()
    return {"published": True, "public_id": project.public_id, "url": f"/p/{project.public_id}"}


@router.delete("/{project_id}")
async def delete_ui_project(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    project = await _get_owned(db, project_id, user.id)
    await db.delete(project)
    return {"deleted": True}
