"""Dataset Config node — loads a registered dataset for downstream ML nodes.

Emits the dataset file path, target column, and summary so that training,
analysis, and preprocessing nodes can consume it from the workflow context.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app.database import async_session_factory
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.models.dataset import Dataset
from app.services.dataset_service import DatasetService


@register_node
class DatasetConfigNode(BaseNode):
    description = NodeDescription(
        display_name="Dataset Config",
        name="dataset_config",
        category="ML Data",
        icon="database",
        color="#f59e0b",
        description="Select a dataset and target column for ML training & analysis",
        inputs=[],
        outputs=["main"],
        properties=[
            NodeProperty("Dataset ID", "dataset_id", "number", required=True,
                         description="ID of a dataset uploaded on the Datasets page"),
            NodeProperty("Target Column", "target_column", "string",
                         description="Column to predict (label)"),
            NodeProperty("Test Split Ratio", "test_split_ratio", "number", default=0.2),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        dataset_id = int(parameters.get("dataset_id"))
        target_column = parameters.get("target_column") or None
        async with async_session_factory() as db:
            result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
            dataset = result.scalar_one_or_none()
            if not dataset:
                raise ValueError(f"Dataset {dataset_id} not found")
            summary = dataset.get_metadata().get("summary", {})
            file_path = dataset.get_file_path().get("path")
            return {
                "dataset_id": dataset.id,
                "dataset_name": dataset.name,
                "train_path": file_path,
                "target_column": target_column or dataset.target_column,
                "test_split_ratio": float(parameters.get("test_split_ratio", 0.2)),
                "summary": summary,
                "columns": summary.get("columns", []),
                "row_count": summary.get("row_count"),
            }
