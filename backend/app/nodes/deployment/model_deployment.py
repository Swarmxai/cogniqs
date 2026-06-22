"""Model Deployment node — publish a trained model as a callable API.

Marks the model as deployed and issues a public API key so it can be invoked
via POST /api/trained-models/{id}/predict/public.
"""

from __future__ import annotations

import secrets
from typing import Any

from sqlalchemy import select

from app.database import async_session_factory
from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node
from app.models.trained_model import TrainedModel


@register_node
class ModelDeploymentNode(BaseNode):
    description = NodeDescription(
        display_name="Model Deployment",
        name="model_deployment",
        category="ML Training",
        icon="rocket",
        color="#ec4899",
        description="Deploy a trained model as a public prediction API",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Model ID", "model_id", "number", required=True),
            NodeProperty("Target", "target", "options", default="api",
                         options=[
                             NodePropertyOption("Public API", "api", "Expose a public predict endpoint"),
                             NodePropertyOption("Download Package", "package", "Generate a deployable package"),
                         ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_id_param = parameters.get("model_id")
        upstream = context.get("json", {}) or {}
        model_id = int(model_id_param) if model_id_param else upstream.get("model_id")
        if not model_id:
            raise ValueError("model_id is required (connect a Model Training node or set it)")

        async with async_session_factory() as db:
            result = await db.execute(select(TrainedModel).where(TrainedModel.id == int(model_id)))
            model = result.scalar_one_or_none()
            if not model:
                raise ValueError(f"Trained model {model_id} not found")
            if not model.api_key:
                model.api_key = secrets.token_urlsafe(32)
            model.status = "deployed"
            await db.commit()
            await db.refresh(model)
            return {
                "output_type": "deployment_result",
                "model_id": model.id,
                "status": "deployed",
                "api_key": model.api_key,
                "predict_url": f"/api/trained-models/{model.id}/predict/public",
            }
