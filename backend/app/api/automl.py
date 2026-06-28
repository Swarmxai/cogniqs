"""AutoML API — standalone model training outside workflows."""

from __future__ import annotations

import asyncio
import json
import logging
import secrets
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError, ValidationError
from app.database import get_db
from app.models.dataset import Dataset
from app.models.trained_model import TrainedModel
from app.nodes.training.constants import (
    CURRENTLY_SUPPORTED_TYPES,
    PRESETS,
    PROBLEM_TYPE_REGISTRY,
    determine_modality,
)
from app.services import blob_storage
from app.services.dataset_service import DatasetService
from app.services.training_engine import TrainingEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/automl", tags=["automl"])


class AutoMLTrainRequest(BaseModel):
    dataset_id: int
    model_name: str = Field(min_length=1, max_length=255)
    problem_type: str = "binary"
    target_column: str
    presets: str = "medium_quality"
    time_limit: int = Field(default=300, ge=30, le=86400)
    eval_metric: str | None = None
    timestamp_column: str | None = None
    item_id_column: str | None = None
    prediction_length: int = Field(default=1, ge=1)


@router.get("/options")
async def automl_options() -> dict[str, Any]:
    """Problem types and presets for the Auto ML studio UI."""
    problem_types = [
        {
            "value": key,
            "label": entry["name"].replace("_", " ").title(),
            "description": entry["description"],
            "default_eval_metric": entry["default_eval_metric"],
            "eval_metrics": entry["eval_metrics"],
            "supported": entry["currently_supported"],
        }
        for key, entry in PROBLEM_TYPE_REGISTRY.items()
        if entry["currently_supported"]
    ]
    return {
        "problem_types": problem_types,
        "presets": [
            {"value": p, "label": p.replace("_", " ").title()}
            for p in PRESETS
        ],
    }


async def _register_automl_model(
    db: AsyncSession,
    *,
    user_id: int,
    model_name: str,
    problem_type: str,
    result: dict[str, Any],
) -> TrainedModel:
    version_q = await db.execute(
        select(func.count(TrainedModel.id)).where(
            TrainedModel.owner_id == user_id,
            TrainedModel.name == model_name,
        )
    )
    version = (version_q.scalar() or 0) + 1
    model = TrainedModel(
        name=model_name,
        owner_id=user_id,
        workflow_id=None,
        execution_id=None,
        node_id="automl",
        version=version,
        framework="autogluon",
        problem_type=problem_type,
        best_model=result.get("best_model"),
        model_path=result.get("model_path"),
        model_size_mb=result.get("model_size_mb"),
        training_metrics=json.dumps(result.get("test_metrics", {}), default=str),
        leaderboard=json.dumps(result.get("leaderboard", []), default=str),
        feature_importance=json.dumps(result.get("feature_importance", {}), default=str),
        extra_metadata=json.dumps({"source": "automl"}, default=str),
        status="trained",
    )
    db.add(model)
    await db.flush()
    await db.refresh(model)
    return model


@router.post("/train")
async def train_automl(
    body: AutoMLTrainRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Train an AutoGluon model from a dataset and register it in the model library."""
    if body.problem_type not in CURRENTLY_SUPPORTED_TYPES:
        raise ValidationError(f"Unsupported problem type: {body.problem_type}")

    dataset = await DatasetService.get_owned(db, body.dataset_id, user.id)
    train_path = dataset.get_file_path().get("path")
    if not train_path or not Path(train_path).exists():
        raise NotFoundError("Dataset file not found")

    schema = DatasetService.schema(dataset)
    columns = [c.get("name") for c in schema.get("columns", [])]
    if body.target_column not in columns:
        raise ValidationError(f"Target column '{body.target_column}' not found in dataset")

    if body.problem_type == "timeseries":
        for col, label in [(body.timestamp_column, "Timestamp"), (body.item_id_column, "Item ID")]:
            if not col:
                raise ValidationError(f"{label} column is required for time series")
            if col not in columns:
                raise ValidationError(f"{label} column '{col}' not found in dataset")

    run_id = secrets.token_hex(8)
    output_dir = str(blob_storage.model_dir(user.id, f"automl_{run_id}"))
    modality = determine_modality(body.problem_type)
    loop = asyncio.get_running_loop()

    try:
        if modality == "timeseries":
            result = await loop.run_in_executor(
                None,
                lambda: TrainingEngine.train_timeseries(
                    train_path=train_path,
                    target_column=body.target_column,
                    timestamp_column=body.timestamp_column or "timestamp",
                    item_id_column=body.item_id_column or "item_id",
                    output_dir=output_dir,
                    prediction_length=body.prediction_length,
                    presets=body.presets,
                    time_limit=body.time_limit,
                    eval_metric=body.eval_metric,
                ),
            )
        else:
            result = await loop.run_in_executor(
                None,
                lambda: TrainingEngine.train_tabular(
                    train_path=train_path,
                    target_column=body.target_column,
                    problem_type=body.problem_type,
                    output_dir=output_dir,
                    presets=body.presets,
                    time_limit=body.time_limit,
                    eval_metric=body.eval_metric,
                ),
            )
    except Exception as exc:
        logger.exception("AutoML training failed")
        blob_storage.remove_path(output_dir)
        raise ValidationError(f"Training failed: {exc}") from exc

    model = await _register_automl_model(
        db,
        user_id=user.id,
        model_name=body.model_name,
        problem_type=result.get("problem_type", body.problem_type),
        result=result,
    )

    return {
        "model": model.to_dict(),
        "training": {
            "best_model": result.get("best_model"),
            "problem_type": result.get("problem_type"),
            "leaderboard": result.get("leaderboard", [])[:10],
            "test_metrics": result.get("test_metrics", {}),
            "model_size_mb": result.get("model_size_mb"),
        },
    }
