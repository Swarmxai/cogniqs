"""Datasets API — upload, list, preview, summarize, schema, manage."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import CurrentUser
from app.core.errors import NotFoundError, ValidationError
from app.database import get_db
from app.models.dataset import Dataset
from app.services import blob_storage
from app.services.dataset_service import DatasetService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/datasets", tags=["datasets"])


class DatasetUpdate(BaseModel):
    name: str | None = None
    target_column: str | None = None
    folder: str | None = None


class ImportUrlRequest(BaseModel):
    url: str
    name: str | None = None
    folder: str = ""


@router.get("")
async def list_datasets(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    folder: str | None = Query(None),
) -> list[dict]:
    stmt = select(Dataset).where(Dataset.owner_id == user.id).order_by(Dataset.created_at.desc())
    if folder is not None:
        stmt = stmt.where(Dataset.folder == folder)
    result = await db.execute(stmt)
    return [d.to_dict() for d in result.scalars()]


@router.post("/upload")
async def upload_dataset(
    user: CurrentUser,
    file: UploadFile = File(...),
    name: str = Form(...),
    folder: str = Form(""),
    db: AsyncSession = Depends(get_db),
) -> dict:
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise ValidationError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")
    dataset = await DatasetService.create_from_bytes(
        db, user.id, name, file.filename or "dataset.csv", content, folder
    )
    return dataset.to_dict()


@router.post("/import-url")
async def import_url(body: ImportUrlRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(body.url)
        resp.raise_for_status()
        content = resp.content
    file_name = body.url.split("/")[-1] or "dataset.csv"
    dataset = await DatasetService.create_from_bytes(
        db, user.id, body.name or file_name, file_name, content, body.folder
    )
    return dataset.to_dict()


@router.get("/folders")
async def list_folders(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[str]:
    result = await db.execute(
        select(Dataset.folder).where(Dataset.owner_id == user.id).distinct()
    )
    return sorted({f for f in result.scalars() if f})


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    return dataset.to_dict()


@router.patch("/{dataset_id}")
async def update_dataset(
    dataset_id: int, body: DatasetUpdate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    if body.name is not None:
        dataset.name = body.name
    if body.target_column is not None:
        dataset.target_column = body.target_column
    if body.folder is not None:
        dataset.folder = body.folder
    await db.flush()
    return dataset.to_dict()


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    path = dataset.get_file_path().get("path")
    if path:
        blob_storage.remove_path(path)
    await db.delete(dataset)
    return {"deleted": True}


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db), limit: int = 50
) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    return {"rows": DatasetService.preview(dataset, limit)}


@router.get("/{dataset_id}/schema")
async def dataset_schema(dataset_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    return DatasetService.schema(dataset)


@router.post("/{dataset_id}/summarize")
async def summarize_dataset(dataset_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    dataset = await DatasetService.get_owned(db, dataset_id, user.id)
    return await DatasetService.summarize(db, dataset)
