"""Dataset service — upload, validate, summarize, preview, schema."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.models.dataset import Dataset
from app.services import blob_storage
from app.utils import ds_formats

logger = logging.getLogger(__name__)


class DatasetService:
    @staticmethod
    async def create_from_bytes(
        db: AsyncSession,
        owner_id: int,
        name: str,
        file_name: str,
        content: bytes,
        folder: str = "",
    ) -> Dataset:
        fmt = ds_formats.detect_format(file_name)
        if fmt == "unknown":
            raise ValidationError(f"Unsupported dataset format: {file_name}")

        target_dir = blob_storage.dataset_dir(owner_id)
        safe_name = f"{name.replace('/', '_')}_{file_name}"
        path = target_dir / safe_name
        blob_storage.save_bytes(path, content)

        dataset = Dataset(
            name=name,
            file_name=file_name,
            owner_id=owner_id,
            dataset_type="tabular",
            folder=folder,
            status="uploaded",
        )
        dataset.set_file_path({"path": str(path)})
        db.add(dataset)
        await db.flush()

        try:
            DatasetService._compute_summary(dataset)
            dataset.status = "validated"
        except Exception as exc:
            logger.warning("Dataset summary failed: %s", exc)
        await db.flush()
        return dataset

    @staticmethod
    def _compute_summary(dataset: Dataset) -> dict[str, Any]:
        path = dataset.get_file_path().get("path")
        if not path or not Path(path).exists():
            raise ValidationError("Dataset file not found")
        df = ds_formats.read_dataframe(path)
        summary = ds_formats.summarize_dataframe(df)
        meta = dataset.get_metadata()
        meta["summary"] = summary
        dataset.set_metadata(meta)
        return summary

    @staticmethod
    async def summarize(db: AsyncSession, dataset: Dataset) -> dict[str, Any]:
        summary = DatasetService._compute_summary(dataset)
        await db.flush()
        return summary

    @staticmethod
    def preview(dataset: Dataset, limit: int = 50) -> list[dict[str, Any]]:
        path = dataset.get_file_path().get("path")
        if not path or not Path(path).exists():
            raise NotFoundError("Dataset file not found")
        df = ds_formats.read_dataframe(path)
        return ds_formats.preview_rows(df, limit)

    @staticmethod
    def schema(dataset: Dataset) -> dict[str, Any]:
        meta = dataset.get_metadata()
        if "summary" in meta:
            return {"columns": meta["summary"].get("columns", [])}
        path = dataset.get_file_path().get("path")
        if not path or not Path(path).exists():
            raise NotFoundError("Dataset file not found")
        df = ds_formats.read_dataframe(path)
        return {"columns": ds_formats.summarize_dataframe(df).get("columns", [])}

    @staticmethod
    async def get_owned(db: AsyncSession, dataset_id: int, owner_id: int) -> Dataset:
        result = await db.execute(
            select(Dataset).where(Dataset.id == dataset_id, Dataset.owner_id == owner_id)
        )
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise NotFoundError("Dataset not found")
        return dataset
