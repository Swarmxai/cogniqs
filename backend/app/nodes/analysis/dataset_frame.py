"""Shared helpers for analysis nodes — resolve a DataFrame from context."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app.utils import ds_formats
from app.utils.auto_install import lazy_import


def resolve_dataframe(parameters: dict[str, Any], context: dict[str, Any]):
    """Load a DataFrame from an upstream dataset path or inline records."""
    upstream = context.get("json", {}) or {}
    path = parameters.get("train_path") or upstream.get("train_path")
    if path and Path(path).exists():
        return ds_formats.read_dataframe(path)
    records = upstream.get("records") or upstream.get("rows")
    if records:
        pd = lazy_import("pandas")
        return pd.DataFrame(records)
    raise ValueError("No dataset found. Connect a Dataset Config node upstream.")
