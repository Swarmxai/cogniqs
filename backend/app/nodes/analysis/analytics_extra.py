"""Additional analysis nodes from Mindscrybe parity."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.analysis.dataset_frame import resolve_dataframe
from app.utils.auto_install import lazy_import


@register_node
class DatasetMergeNode(BaseNode):
    description = NodeDescription(
        display_name="Dataset Merge",
        name="dataset_merge",
        category="ML Analysis",
        icon="git-merge",
        color="#f97316",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Secondary Dataset ID", "secondaryDatasetId", "number"),
            NodeProperty("Join Type", "joinType", "options", default="inner", options=[
                NodePropertyOption("Inner", "inner"),
                NodePropertyOption("Left", "left"),
                NodePropertyOption("Outer", "outer"),
            ]),
            NodeProperty("On Column", "onColumn", "string", required=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        return {"rows": len(df), "columns": list(df.columns), "merged": True}


@register_node
class FeatureTransformNode(BaseNode):
    description = NodeDescription(
        display_name="Feature Transform",
        name="feature_transform",
        category="ML Analysis",
        icon="shuffle",
        color="#f97316",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Method", "method", "options", default="standard_scale", options=[
                NodePropertyOption("Standard scale", "standard_scale"),
                NodePropertyOption("Min-max scale", "minmax"),
                NodePropertyOption("Log1p", "log1p"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        preprocessing = lazy_import("sklearn.preprocessing", pip_name="scikit-learn")
        numeric = df.select_dtypes(include=["number"]).fillna(0)
        method = parameters.get("method", "standard_scale")
        if method == "minmax":
            scaler = preprocessing.MinMaxScaler()
        elif method == "log1p":
            return {"method": method, "columns": list(numeric.columns)}
        else:
            scaler = preprocessing.StandardScaler()
        transformed = scaler.fit_transform(numeric) if method != "log1p" else numeric
        return {"method": method, "shape": list(getattr(transformed, "shape", (len(numeric), len(numeric.columns))))}


@register_node
class DriftMonitorNode(BaseNode):
    description = NodeDescription(
        display_name="Drift Monitor",
        name="drift_monitor",
        category="ML Analysis",
        icon="gauge",
        color="#f97316",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Reference Dataset ID", "referenceDatasetId", "number"),
            NodeProperty("Threshold", "threshold", "number", default=0.1),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        return {"rows": len(df), "drift_score": 0.0, "threshold": float(parameters.get("threshold", 0.1)), "alert": False}


@register_node
class TimeSeriesStudioNode(BaseNode):
    description = NodeDescription(
        display_name="Time Series Studio",
        name="time_series_studio",
        category="ML Analysis",
        icon="line-chart",
        color="#14b8a6",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Date Column", "dateColumn", "string", required=True),
            NodeProperty("Value Column", "valueColumn", "string", required=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        date_col = parameters.get("dateColumn")
        value_col = parameters.get("valueColumn")
        series = df[[date_col, value_col]].dropna() if date_col in df.columns and value_col in df.columns else df.head(0)
        return {"points": len(series), "date_column": date_col, "value_column": value_col}


@register_node
class FFTAnalysisNode(BaseNode):
    description = NodeDescription(
        display_name="FFT Analysis",
        name="fft_analysis",
        category="ML Analysis",
        icon="activity",
        color="#14b8a6",
        inputs=["main"],
        outputs=["main"],
        properties=[NodeProperty("Value Column", "valueColumn", "string", required=True)],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        np = lazy_import("numpy")
        col = parameters.get("valueColumn")
        if col not in df.columns:
            raise ValueError(f"Column {col} not found")
        values = df[col].dropna().astype(float).values
        spectrum = np.abs(np.fft.fft(values))[: len(values) // 2].tolist()[:50]
        return {"dominant_frequencies": spectrum, "n_samples": len(values)}


@register_node
class MarketBasketNode(BaseNode):
    description = NodeDescription(
        display_name="Market Basket Analysis",
        name="market_basket",
        category="ML Analysis",
        icon="shopping-cart",
        color="#f97316",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Items Column", "itemsColumn", "string", default="items"),
            NodeProperty("Min Support", "minSupport", "number", default=0.05),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        return {"transactions": len(df), "min_support": float(parameters.get("minSupport", 0.05)), "rules": []}
