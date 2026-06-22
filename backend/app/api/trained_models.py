"""Trained models API — registry, predict, deploy, schema, download."""

from __future__ import annotations

import io
import secrets
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.trained_model import TrainedModel
from app.services import blob_storage
from app.services.training_engine import TrainingEngine

router = APIRouter(prefix="/trained-models", tags=["trained-models"])


class PredictRequest(BaseModel):
    records: list[dict]


class ModelUpdate(BaseModel):
    name: str | None = None
    status: str | None = None


@router.get("")
async def list_models(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(TrainedModel).where(TrainedModel.owner_id == user.id).order_by(TrainedModel.created_at.desc())
    )
    return [m.to_dict() for m in result.scalars()]


async def _get_owned(db: AsyncSession, model_id: int, owner_id: int) -> TrainedModel:
    result = await db.execute(
        select(TrainedModel).where(TrainedModel.id == model_id, TrainedModel.owner_id == owner_id)
    )
    model = result.scalar_one_or_none()
    if not model:
        raise NotFoundError("Trained model not found")
    return model


@router.get("/{model_id}")
async def get_model(model_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    model = await _get_owned(db, model_id, user.id)
    return model.to_dict()


@router.patch("/{model_id}")
async def update_model(
    model_id: int, body: ModelUpdate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    model = await _get_owned(db, model_id, user.id)
    if body.name is not None:
        model.name = body.name
    if body.status is not None:
        model.status = body.status
    await db.flush()
    return model.to_dict()


@router.delete("/{model_id}")
async def delete_model(model_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    model = await _get_owned(db, model_id, user.id)
    if model.model_path:
        blob_storage.remove_path(model.model_path)
    await db.delete(model)
    return {"deleted": True}


@router.get("/{model_id}/schema")
async def model_schema(model_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    model = await _get_owned(db, model_id, user.id)
    if not model.model_path:
        raise NotFoundError("Model artifacts not available")
    return TrainingEngine.model_schema(model.model_path)


@router.post("/{model_id}/predict")
async def predict(
    model_id: int, body: PredictRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    model = await _get_owned(db, model_id, user.id)
    predictions = TrainingEngine.predict_tabular(model.model_path, body.records)
    return {"predictions": predictions, "count": len(predictions)}


@router.post("/{model_id}/predict/public")
async def predict_public(model_id: int, body: PredictRequest, api_key: str, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(TrainedModel).where(TrainedModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model or model.api_key != api_key:
        raise NotFoundError("Model not found or invalid API key")
    predictions = TrainingEngine.predict_tabular(model.model_path, body.records)
    return {"predictions": predictions, "count": len(predictions)}


@router.post("/{model_id}/rotate-api-key")
async def rotate_api_key(model_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    model = await _get_owned(db, model_id, user.id)
    model.api_key = secrets.token_urlsafe(32)
    await db.flush()
    return {"api_key": model.api_key}


@router.get("/{model_id}/download")
async def download_model(model_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    model = await _get_owned(db, model_id, user.id)
    if not model.model_path or not Path(model.model_path).exists():
        raise NotFoundError("Model artifacts not available")

    buffer = io.BytesIO()
    base = Path(model.model_path)
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in base.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(base))
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="model_{model_id}.zip"'},
    )
