"""Training constants: problem-type registry, presets, requirements."""

from __future__ import annotations

from enum import Enum
from typing import Any


class TrainingMode(str, Enum):
    AUTO = "auto"
    CUSTOM = "custom"


class TrainingEnvironment(str, Enum):
    LOCAL = "local"
    KAGGLE = "kaggle"
    AZUREML = "azureml"


class TrainingStatus(str, Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    TRAINING = "TRAINING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# Problem type registry — currently_supported drives whether the UI enables it.
PROBLEM_TYPE_REGISTRY: dict[str, dict[str, Any]] = {
    "binary": {
        "name": "binary",
        "description": "Binary classification (2 classes)",
        "currently_supported": True,
        "task_families": ["classification"],
        "eval_metrics": ["roc_auc", "accuracy", "f1", "precision", "recall", "log_loss"],
        "default_eval_metric": "roc_auc",
    },
    "multiclass": {
        "name": "multiclass",
        "description": "Multi-class classification (3+ classes)",
        "currently_supported": True,
        "task_families": ["classification"],
        "eval_metrics": ["accuracy", "f1_macro", "f1_weighted", "log_loss"],
        "default_eval_metric": "accuracy",
    },
    "regression": {
        "name": "regression",
        "description": "Continuous value prediction",
        "currently_supported": True,
        "task_families": ["regression"],
        "eval_metrics": ["rmse", "r2", "mae", "mse", "mape"],
        "default_eval_metric": "rmse",
    },
    "timeseries": {
        "name": "timeseries",
        "description": "Time series forecasting",
        "currently_supported": True,
        "task_families": ["timeseries"],
        "eval_metrics": ["WQL", "MASE", "MAPE", "RMSE", "MAE"],
        "default_eval_metric": "WQL",
    },
    "custom": {
        "name": "custom",
        "description": "User-defined problem type (custom script)",
        "currently_supported": True,
        "task_families": ["classification", "regression", "clustering", "timeseries"],
        "eval_metrics": [],
        "default_eval_metric": "",
    },
}

VALID_PROBLEM_TYPES = list(PROBLEM_TYPE_REGISTRY.keys())
CURRENTLY_SUPPORTED_TYPES = [k for k, v in PROBLEM_TYPE_REGISTRY.items() if v["currently_supported"]]

PRESETS = ["best_quality", "high_quality", "good_quality", "medium_quality"]

AUTOGLUON_REQUIREMENTS = {
    "tabular": "autogluon.tabular",
    "multimodal": "autogluon.multimodal",
    "timeseries": "autogluon.timeseries",
}

_MODALITY_MAP = {
    "binary": "tabular",
    "multiclass": "tabular",
    "regression": "tabular",
    "timeseries": "timeseries",
    "custom": "tabular",
}


def determine_modality(problem_type: str) -> str:
    return _MODALITY_MAP.get(problem_type, "tabular")
