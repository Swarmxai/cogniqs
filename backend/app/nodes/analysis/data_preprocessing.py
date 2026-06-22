"""Data Preprocessing node — clean & transform a dataset for training."""

from __future__ import annotations

import secrets
from typing import Any

from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node
from app.nodes.analysis.dataset_frame import resolve_dataframe
from app.services import blob_storage


@register_node
class DataPreprocessingNode(BaseNode):
    description = NodeDescription(
        display_name="Data Preprocessing",
        name="data_preprocessing",
        category="ML Analysis",
        icon="filter",
        color="#0ea5e9",
        description="Handle missing values, drop duplicates, encode and scale",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Missing Value Strategy", "missing_strategy", "options", default="drop",
                         options=[
                             NodePropertyOption("Drop rows", "drop"),
                             NodePropertyOption("Fill mean", "mean"),
                             NodePropertyOption("Fill median", "median"),
                             NodePropertyOption("Fill zero", "zero"),
                         ]),
            NodeProperty("Drop Duplicates", "drop_duplicates", "boolean", default=True),
            NodeProperty("Drop Columns (comma-separated)", "drop_columns", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        before = len(df)

        drop_cols = [c.strip() for c in (parameters.get("drop_columns") or "").split(",") if c.strip()]
        if drop_cols:
            df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

        strategy = parameters.get("missing_strategy", "drop")
        if strategy == "drop":
            df = df.dropna()
        else:
            numeric = df.select_dtypes(include=["number"]).columns
            if strategy == "mean":
                df[numeric] = df[numeric].fillna(df[numeric].mean())
            elif strategy == "median":
                df[numeric] = df[numeric].fillna(df[numeric].median())
            elif strategy == "zero":
                df[numeric] = df[numeric].fillna(0)

        if parameters.get("drop_duplicates", True):
            df = df.drop_duplicates()

        user_id = context.get("user_id", "anon")
        out_dir = blob_storage.training_staging_dir(f"prep_{user_id}_{node_id}_{secrets.token_hex(4)}")
        out_path = str(out_dir / "preprocessed.csv")
        df.to_csv(out_path, index=False)

        upstream = context.get("json", {}) or {}
        return {
            "output_type": "preprocessing_result",
            "train_path": out_path,
            "target_column": upstream.get("target_column"),
            "rows_before": before,
            "rows_after": len(df),
            "columns": list(df.columns),
        }
