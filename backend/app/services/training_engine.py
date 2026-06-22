"""AutoGluon training engine — runs in-process when AutoGluon is available.

Keeps AutoGluon optional via lazy import. When unavailable and auto-install is
disabled, raises a clear error so workflows fail gracefully.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.services import blob_storage
from app.utils import ds_formats
from app.utils.auto_install import lazy_import

logger = logging.getLogger(__name__)


class TrainingEngine:
    @staticmethod
    def train_tabular(
        *,
        train_path: str,
        target_column: str,
        problem_type: str,
        output_dir: str,
        presets: str = "medium_quality",
        time_limit: int = 300,
        eval_metric: str | None = None,
        hyperparameters: dict | None = None,
        test_path: str | None = None,
    ) -> dict[str, Any]:
        """Train an AutoGluon TabularPredictor and persist it to output_dir."""
        tabular = lazy_import("autogluon.tabular", pip_name="autogluon.tabular[all]")
        TabularPredictor = tabular.TabularPredictor

        train_df = ds_formats.read_dataframe(train_path)
        ag_problem_type = None if problem_type == "custom" else problem_type

        predictor = TabularPredictor(
            label=target_column,
            problem_type=ag_problem_type,
            eval_metric=eval_metric or None,
            path=output_dir,
        )
        fit_kwargs: dict[str, Any] = {"presets": presets, "time_limit": time_limit}
        if hyperparameters:
            fit_kwargs["hyperparameters"] = hyperparameters
        predictor.fit(train_df, **fit_kwargs)

        leaderboard = predictor.leaderboard(silent=True)
        leaderboard_records = leaderboard.to_dict(orient="records")

        result: dict[str, Any] = {
            "best_model": str(predictor.model_best),
            "problem_type": str(predictor.problem_type),
            "leaderboard": leaderboard_records,
            "model_path": output_dir,
            "label": target_column,
            "feature_importance": {},
            "test_metrics": {},
        }

        if test_path and Path(test_path).exists():
            test_df = ds_formats.read_dataframe(test_path)
            try:
                result["test_metrics"] = predictor.evaluate(test_df, silent=True)
                fi = predictor.feature_importance(test_df)
                result["feature_importance"] = fi["importance"].to_dict() if "importance" in fi else {}
            except Exception as exc:
                logger.warning("Evaluation/feature importance failed: %s", exc)

        result["model_size_mb"] = blob_storage.directory_size_mb(output_dir)
        return result

    @staticmethod
    def train_timeseries(
        *,
        train_path: str,
        target_column: str,
        timestamp_column: str,
        item_id_column: str,
        output_dir: str,
        prediction_length: int = 1,
        presets: str = "medium_quality",
        time_limit: int = 300,
        eval_metric: str | None = None,
    ) -> dict[str, Any]:
        ts = lazy_import("autogluon.timeseries", pip_name="autogluon.timeseries[all]")
        TimeSeriesPredictor = ts.TimeSeriesPredictor
        TimeSeriesDataFrame = ts.TimeSeriesDataFrame

        df = ds_formats.read_dataframe(train_path)
        ts_df = TimeSeriesDataFrame.from_data_frame(
            df, id_column=item_id_column, timestamp_column=timestamp_column
        )
        predictor = TimeSeriesPredictor(
            target=target_column,
            prediction_length=prediction_length,
            eval_metric=eval_metric or "WQL",
            path=output_dir,
        )
        predictor.fit(ts_df, presets=presets, time_limit=time_limit)
        leaderboard = predictor.leaderboard(silent=True)
        return {
            "best_model": str(predictor.model_best),
            "problem_type": "timeseries",
            "leaderboard": leaderboard.to_dict(orient="records"),
            "model_path": output_dir,
            "label": target_column,
            "feature_importance": {},
            "test_metrics": {},
            "model_size_mb": blob_storage.directory_size_mb(output_dir),
        }

    @staticmethod
    def predict_tabular(model_path: str, records: list[dict]) -> list[Any]:
        tabular = lazy_import("autogluon.tabular", pip_name="autogluon.tabular[all]")
        pd = lazy_import("pandas")
        predictor = tabular.TabularPredictor.load(model_path)
        df = pd.DataFrame(records)
        preds = predictor.predict(df)
        return [p.item() if hasattr(p, "item") else p for p in preds.tolist()]

    @staticmethod
    def model_schema(model_path: str) -> dict[str, Any]:
        tabular = lazy_import("autogluon.tabular", pip_name="autogluon.tabular[all]")
        predictor = tabular.TabularPredictor.load(model_path)
        features = predictor.feature_metadata.get_features()
        return {
            "label": predictor.label,
            "problem_type": str(predictor.problem_type),
            "features": [{"name": f, "type": str(predictor.feature_metadata.get_feature_type_raw(f))} for f in features],
        }
