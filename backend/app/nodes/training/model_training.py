"""Model Training node — AutoGluon (auto) or custom-script training.

Consumes an upstream Dataset Config node, trains an AutoGluon predictor,
persists artifacts and a TrainedModel registry row, and returns a rich result
for the analysis result renderer (best model, leaderboard, metrics).
"""

from __future__ import annotations

import asyncio
import logging
import secrets
from pathlib import Path
from typing import Any

from sqlalchemy import select, func

from app.database import async_session_factory
from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node
from app.models.trained_model import TrainedModel
from app.nodes.training.constants import (
    PRESETS,
    PROBLEM_TYPE_REGISTRY,
    determine_modality,
)
from app.services import blob_storage
from app.services.training_engine import TrainingEngine

logger = logging.getLogger(__name__)


def _problem_type_options() -> list[NodePropertyOption]:
    opts: list[NodePropertyOption] = []
    for key, entry in PROBLEM_TYPE_REGISTRY.items():
        opts.append(NodePropertyOption(
            name=entry["name"].replace("_", " ").title(),
            value=key,
            description=entry["description"],
            disabled=not entry["currently_supported"],
            meta={
                "defaultEvalMetric": entry["default_eval_metric"],
                "evalMetrics": entry["eval_metrics"],
                "taskFamilies": entry["task_families"],
            },
        ))
    return opts


@register_node
class ModelTrainingNode(BaseNode):
    description = NodeDescription(
        display_name="Model Training",
        name="model_training",
        category="ML Training",
        icon="cpu",
        color="#8b5cf6",
        description="Train an ML model with AutoGluon (auto) or a custom script",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Model Name", "model_name", "string", default="my_model", required=True),
            NodeProperty("Training Mode", "training_mode", "options", default="auto",
                         options=[
                             NodePropertyOption("Auto (AutoGluon)", "auto", "Fully automated training"),
                             NodePropertyOption("Custom Script", "custom", "Run your own training script"),
                         ]),
            NodeProperty("Problem Type", "problem_type", "options", default="binary",
                         options=_problem_type_options()),
            NodeProperty("Preset", "presets", "options", default="medium_quality",
                         options=[NodePropertyOption(p.replace("_", " ").title(), p) for p in PRESETS]),
            NodeProperty("Time Limit (s)", "time_limit", "number", default=300),
            NodeProperty("Eval Metric", "eval_metric", "string",
                         description="Leave empty to use the default for the problem type"),
            NodeProperty("Target Column", "target_column", "string",
                         description="Overrides upstream dataset target column"),
            NodeProperty("Hyperparameters (JSON)", "hyperparameters", "json", default=""),
            # Timeseries-only
            NodeProperty("Timestamp Column", "timestamp_column", "string",
                         display_options={"show": {"problem_type": ["timeseries"]}}),
            NodeProperty("Item ID Column", "item_id_column", "string",
                         display_options={"show": {"problem_type": ["timeseries"]}}),
            NodeProperty("Prediction Length", "prediction_length", "number", default=1,
                         display_options={"show": {"problem_type": ["timeseries"]}}),
            # Custom-only
            NodeProperty("Custom Script", "custom_script", "code", default="",
                         display_options={"show": {"training_mode": ["custom"]}}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        upstream = context.get("json", {}) or {}
        train_path = upstream.get("train_path")
        target_column = parameters.get("target_column") or upstream.get("target_column")
        problem_type = parameters.get("problem_type", "binary")
        model_name = parameters.get("model_name", "my_model")
        user_id = context.get("user_id")

        if not train_path or not Path(train_path).exists():
            raise ValueError("No dataset available. Connect a Dataset Config node upstream.")
        if problem_type != "timeseries" and not target_column:
            raise ValueError("target_column is required. Set it on the Dataset Config or Training node.")

        modality = determine_modality(problem_type)
        output_dir = str(blob_storage.training_staging_dir(f"{user_id}_{node_id}_{secrets.token_hex(4)}"))

        time_limit = int(parameters.get("time_limit") or 300)
        presets = parameters.get("presets", "medium_quality")
        eval_metric = parameters.get("eval_metric") or None
        hyperparameters = parameters.get("hyperparameters") or None
        if isinstance(hyperparameters, str) and hyperparameters.strip():
            import json
            try:
                hyperparameters = json.loads(hyperparameters)
            except json.JSONDecodeError:
                hyperparameters = None

        loop = asyncio.get_event_loop()
        if modality == "timeseries":
            result = await loop.run_in_executor(None, lambda: TrainingEngine.train_timeseries(
                train_path=train_path,
                target_column=target_column or upstream.get("target_column", "target"),
                timestamp_column=parameters.get("timestamp_column", "timestamp"),
                item_id_column=parameters.get("item_id_column", "item_id"),
                output_dir=output_dir,
                prediction_length=int(parameters.get("prediction_length") or 1),
                presets=presets,
                time_limit=time_limit,
                eval_metric=eval_metric,
            ))
        else:
            result = await loop.run_in_executor(None, lambda: TrainingEngine.train_tabular(
                train_path=train_path,
                target_column=target_column,
                problem_type=problem_type,
                output_dir=output_dir,
                presets=presets,
                time_limit=time_limit,
                eval_metric=eval_metric,
                hyperparameters=hyperparameters,
                test_path=upstream.get("test_path"),
            ))

        model_id = await self._register_model(
            user_id=user_id,
            model_name=model_name,
            node_id=node_id,
            workflow_id=context.get("workflow_id"),
            execution_id=context.get("execution_id"),
            problem_type=result.get("problem_type", problem_type),
            result=result,
        )

        return {
            "output_type": "model_training_result",
            "model_id": model_id,
            "model_name": model_name,
            "best_model": result.get("best_model"),
            "problem_type": result.get("problem_type", problem_type),
            "leaderboard": result.get("leaderboard", []),
            "test_metrics": result.get("test_metrics", {}),
            "feature_importance": result.get("feature_importance", {}),
            "model_path": result.get("model_path"),
            "model_size_mb": result.get("model_size_mb"),
        }

    async def _register_model(self, *, user_id, model_name, node_id, workflow_id, execution_id, problem_type, result) -> int | None:
        if not user_id:
            return None
        import json
        async with async_session_factory() as db:
            version_q = await db.execute(
                select(func.count(TrainedModel.id)).where(
                    TrainedModel.owner_id == user_id, TrainedModel.name == model_name
                )
            )
            version = (version_q.scalar() or 0) + 1
            model = TrainedModel(
                name=model_name,
                owner_id=user_id,
                workflow_id=workflow_id,
                execution_id=execution_id,
                node_id=node_id,
                version=version,
                framework="autogluon",
                problem_type=problem_type,
                best_model=result.get("best_model"),
                model_path=result.get("model_path"),
                model_size_mb=result.get("model_size_mb"),
                training_metrics=json.dumps(result.get("test_metrics", {}), default=str),
                leaderboard=json.dumps(result.get("leaderboard", []), default=str),
                feature_importance=json.dumps(result.get("feature_importance", {}), default=str),
                status="trained",
            )
            db.add(model)
            await db.commit()
            await db.refresh(model)
            return model.id
