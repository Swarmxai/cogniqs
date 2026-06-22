"""Local filesystem blob storage (datasets, models, artifacts).

Mirrors a blob-storage interface so it can later be swapped for Azure/S3.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from app.config import settings


def _ensure(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def dataset_dir(user_id: int) -> Path:
    return _ensure(Path(settings.DATASET_STORAGE_DIR) / str(user_id))


def model_dir(user_id: int, model_id: str) -> Path:
    return _ensure(Path(settings.MODEL_STORAGE_DIR) / str(user_id) / model_id)


def training_staging_dir(execution_key: str) -> Path:
    return _ensure(Path(settings.TRAINING_STAGING_DIR) / execution_key)


def save_bytes(target: Path, content: bytes) -> str:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    return str(target)


def save_text(target: Path, content: str) -> str:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    return str(target)


def directory_size_mb(path: str | Path) -> float:
    p = Path(path)
    if not p.exists():
        return 0.0
    total = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
    return round(total / (1024 * 1024), 3)


def remove_path(path: str | Path) -> None:
    p = Path(path)
    if p.is_dir():
        shutil.rmtree(p, ignore_errors=True)
    elif p.exists():
        p.unlink()
