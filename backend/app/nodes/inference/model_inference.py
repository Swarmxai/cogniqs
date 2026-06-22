"""Model Inference node — load a trained model and run predictions."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from sqlalchemy import select

from app.database import async_session_factory
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.models.trained_model import TrainedModel
from app.services.training_engine import TrainingEngine


@register_node
class ModelInferenceNode(BaseNode):
    description = NodeDescription(
        display_name="Model Inference",
        name="model_inference",
        category="ML Training",
        icon="zap",
        color="#10b981",
        description="Run predictions using a trained model",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Model ID", "model_id", "number", required=True,
                         description="ID of a trained model (from the Models page)"),
            NodeProperty("Records (JSON)", "records", "json", default="[]",
                         description="Array of input records; defaults to upstream data"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_id = int(parameters.get("model_id"))
        records = parameters.get("records")
        if isinstance(records, str) and records.strip():
            records = json.loads(records)
        if not records:
            upstream = context.get("json", {}) or {}
            records = upstream.get("records") or upstream.get("rows") or []
        if isinstance(records, dict):
            records = [records]

        async with async_session_factory() as db:
            result = await db.execute(select(TrainedModel).where(TrainedModel.id == model_id))
            model = result.scalar_one_or_none()
            if not model or not model.model_path:
                raise ValueError(f"Trained model {model_id} not found")
            model_path = model.model_path

        loop = asyncio.get_event_loop()
        predictions = await loop.run_in_executor(
            None, lambda: TrainingEngine.predict_tabular(model_path, records)
        )
        return {
            "output_type": "inference_result",
            "model_id": model_id,
            "predictions": predictions,
            "count": len(predictions),
        }
