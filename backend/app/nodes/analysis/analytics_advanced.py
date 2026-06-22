"""Advanced analytics nodes — clustering, anomaly detection, forecasting, evaluation."""

from __future__ import annotations

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
from app.nodes.analysis.dataset_frame import resolve_dataframe
from app.utils.auto_install import lazy_import


@register_node
class ClusteringNode(BaseNode):
    description = NodeDescription(
        display_name="Clustering",
        name="clustering_suite",
        category="ML Analysis",
        icon="git-branch",
        color="#a855f7",
        description="KMeans / DBSCAN unsupervised clustering",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Algorithm", "algorithm", "options", default="kmeans",
                         options=[
                             NodePropertyOption("KMeans", "kmeans"),
                             NodePropertyOption("DBSCAN", "dbscan"),
                         ]),
            NodeProperty("Number of Clusters", "n_clusters", "number", default=3,
                         display_options={"show": {"algorithm": ["kmeans"]}}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        sklearn_cluster = lazy_import("sklearn.cluster", pip_name="scikit-learn")
        numeric = df.select_dtypes(include=["number"]).fillna(0)
        if numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for clustering")

        algorithm = parameters.get("algorithm", "kmeans")
        if algorithm == "dbscan":
            model = sklearn_cluster.DBSCAN()
            labels = model.fit_predict(numeric)
        else:
            n_clusters = int(parameters.get("n_clusters") or 3)
            model = sklearn_cluster.KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
            labels = model.fit_predict(numeric)

        labels_list = [int(x) for x in labels]
        distribution: dict[str, int] = {}
        for lbl in labels_list:
            distribution[str(lbl)] = distribution.get(str(lbl), 0) + 1

        return {
            "output_type": "clustering_result",
            "algorithm": algorithm,
            "n_clusters": len(set(labels_list)),
            "cluster_distribution": distribution,
            "labels": labels_list[:1000],
        }


@register_node
class AnomalyDetectionNode(BaseNode):
    description = NodeDescription(
        display_name="Anomaly Detection",
        name="anomaly_detection",
        category="ML Analysis",
        icon="alert-triangle",
        color="#ef4444",
        description="Isolation Forest outlier detection",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Contamination", "contamination", "number", default=0.05),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        ensemble = lazy_import("sklearn.ensemble", pip_name="scikit-learn")
        numeric = df.select_dtypes(include=["number"]).fillna(0)
        if numeric.shape[1] == 0:
            raise ValueError("No numeric columns available for anomaly detection")

        contamination = float(parameters.get("contamination") or 0.05)
        model = ensemble.IsolationForest(contamination=contamination, random_state=42)
        preds = model.fit_predict(numeric)
        anomalies = [i for i, p in enumerate(preds) if p == -1]
        return {
            "output_type": "anomaly_result",
            "total_rows": int(len(df)),
            "anomaly_count": len(anomalies),
            "anomaly_ratio": round(len(anomalies) / max(len(df), 1), 4),
            "anomaly_indices": anomalies[:1000],
        }


@register_node
class TimeSeriesForecastNode(BaseNode):
    description = NodeDescription(
        display_name="Time Series Forecast",
        name="time_series_forecast",
        category="ML Analysis",
        icon="trending-up",
        color="#14b8a6",
        description="Simple moving-average / linear trend forecast",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Value Column", "value_column", "string", required=True),
            NodeProperty("Forecast Horizon", "horizon", "number", default=5),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        np = lazy_import("numpy")
        value_col = parameters.get("value_column")
        if value_col not in df.columns:
            raise ValueError(f"Value column '{value_col}' not found")
        series = df[value_col].dropna().astype(float).values
        horizon = int(parameters.get("horizon") or 5)
        if len(series) < 2:
            raise ValueError("Need at least 2 data points to forecast")

        x = np.arange(len(series))
        slope, intercept = np.polyfit(x, series, 1)
        future_x = np.arange(len(series), len(series) + horizon)
        forecast = (slope * future_x + intercept).tolist()
        return {
            "output_type": "forecast_result",
            "value_column": value_col,
            "horizon": horizon,
            "forecast": [round(float(v), 4) for v in forecast],
            "trend_slope": round(float(slope), 6),
            "history_points": int(len(series)),
        }


@register_node
class ModelEvaluationNode(BaseNode):
    description = NodeDescription(
        display_name="Model Evaluation",
        name="model_evaluation",
        category="ML Analysis",
        icon="check-circle",
        color="#22c55e",
        description="Evaluate a trained model on a test dataset",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Model ID", "model_id", "number", required=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        model_id = int(parameters.get("model_id"))
        async with async_session_factory() as db:
            result = await db.execute(select(TrainedModel).where(TrainedModel.id == model_id))
            model = result.scalar_one_or_none()
            if not model or not model.model_path:
                raise ValueError(f"Trained model {model_id} not found")
            model_path = model.model_path

        tabular = lazy_import("autogluon.tabular", pip_name="autogluon.tabular[all]")
        predictor = tabular.TabularPredictor.load(model_path)
        metrics = predictor.evaluate(df, silent=True)
        return {
            "output_type": "evaluation_result",
            "model_id": model_id,
            "metrics": {k: (float(v) if isinstance(v, (int, float)) else v) for k, v in metrics.items()},
        }
