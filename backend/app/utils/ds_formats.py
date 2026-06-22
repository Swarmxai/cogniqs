"""Tabular dataset format helpers — read/sniff CSV, Parquet, Excel, JSON."""

from __future__ import annotations

import csv
import io
import json
from pathlib import Path
from typing import Any

TABULAR_EXTENSIONS = {".csv", ".tsv", ".parquet", ".xlsx", ".xls", ".json", ".jsonl"}


def detect_format(file_name: str) -> str:
    ext = Path(file_name).suffix.lower()
    return {
        ".csv": "csv", ".tsv": "tsv", ".parquet": "parquet",
        ".xlsx": "excel", ".xls": "excel", ".json": "json", ".jsonl": "jsonl",
    }.get(ext, "unknown")


def read_dataframe(path: str):
    """Read a tabular file into a pandas DataFrame (pandas lazy-imported)."""
    from app.utils.auto_install import lazy_import

    pd = lazy_import("pandas")
    fmt = detect_format(path)
    if fmt == "csv":
        return pd.read_csv(path)
    if fmt == "tsv":
        return pd.read_csv(path, sep="\t")
    if fmt == "parquet":
        return pd.read_parquet(path)
    if fmt == "excel":
        return pd.read_excel(path)
    if fmt == "json":
        return pd.read_json(path)
    if fmt == "jsonl":
        return pd.read_json(path, lines=True)
    return pd.read_csv(path)


def summarize_dataframe(df) -> dict[str, Any]:
    """Produce a JSON-serialisable summary of a DataFrame."""
    columns = []
    for col in df.columns:
        series = df[col]
        dtype = str(series.dtype)
        col_info = {
            "name": str(col),
            "dtype": dtype,
            "null_count": int(series.isnull().sum()),
            "unique_count": int(series.nunique()),
        }
        if dtype.startswith(("int", "float")):
            try:
                col_info.update({
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "mean": float(series.mean()),
                    "std": float(series.std()),
                })
            except (ValueError, TypeError):
                pass
        columns.append(col_info)
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": columns,
        "memory_bytes": int(df.memory_usage(deep=True).sum()),
    }


def preview_rows(df, limit: int = 50) -> list[dict[str, Any]]:
    head = df.head(limit)
    return json.loads(head.to_json(orient="records", default_handler=str))


def infer_problem_type(df, target_column: str) -> str:
    """Heuristically infer classification vs regression for a target column."""
    if target_column not in df.columns:
        return "unknown"
    series = df[target_column]
    n_unique = series.nunique()
    if str(series.dtype).startswith(("int", "float")):
        if n_unique <= 2:
            return "binary"
        if n_unique <= 20:
            return "multiclass"
        return "regression"
    return "binary" if n_unique == 2 else "multiclass"
