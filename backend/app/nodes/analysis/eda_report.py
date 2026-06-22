"""EDA Report node — exploratory data analysis summary & charts."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.nodes.analysis.dataset_frame import resolve_dataframe
from app.utils import ds_formats


@register_node
class EDAReportNode(BaseNode):
    description = NodeDescription(
        display_name="EDA Report",
        name="eda_report",
        category="ML Analysis",
        icon="bar-chart",
        color="#06b6d4",
        description="Exploratory data analysis: stats, correlations, distributions",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Max Correlation Columns", "max_corr_cols", "number", default=20),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        df = resolve_dataframe(parameters, context)
        summary = ds_formats.summarize_dataframe(df)

        numeric = df.select_dtypes(include=["number"])
        correlations: dict[str, Any] = {}
        if numeric.shape[1] >= 2:
            max_cols = int(parameters.get("max_corr_cols") or 20)
            corr = numeric.iloc[:, :max_cols].corr().round(4)
            correlations = corr.fillna(0).to_dict()

        missing = {str(c): int(df[c].isnull().sum()) for c in df.columns if df[c].isnull().any()}

        return {
            "output_type": "eda_report",
            "summary": summary,
            "correlations": correlations,
            "missing_values": missing,
            "row_count": summary["row_count"],
            "column_count": summary["column_count"],
        }
