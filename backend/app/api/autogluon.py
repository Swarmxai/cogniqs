"""AutoGluon hyperparameter catalog API for the training node UI."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/autogluon", tags=["autogluon"])


def _tabular() -> dict[str, Any]:
    return {
        "models": {
            "GBM": {"label": "LightGBM", "desc": "Gradient boosting (fast, powerful for tabular)", "hyperparameters": {
                "num_boost_round": {"default": 10000, "type": "number", "desc": "Boosting iterations"},
                "learning_rate": {"default": 0.05, "type": "number", "desc": "Shrinkage rate"},
                "num_leaves": {"default": 128, "type": "number", "desc": "Max leaves per tree"},
            }},
            "CAT": {"label": "CatBoost", "desc": "Gradient boosting with native categorical support", "hyperparameters": {
                "iterations": {"default": 10000, "type": "number", "desc": "Boosting iterations"},
                "learning_rate": {"default": 0.05, "type": "number", "desc": "Shrinkage rate"},
                "depth": {"default": 6, "type": "number", "desc": "Tree depth"},
            }},
            "XGB": {"label": "XGBoost", "desc": "Extreme gradient boosting", "hyperparameters": {
                "n_estimators": {"default": 10000, "type": "number", "desc": "Boosting rounds"},
                "learning_rate": {"default": 0.1, "type": "number", "desc": "Shrinkage rate"},
                "max_depth": {"default": 6, "type": "number", "desc": "Max tree depth"},
            }},
            "RF": {"label": "Random Forest", "desc": "Ensemble of decision trees", "hyperparameters": {
                "n_estimators": {"default": 300, "type": "number", "desc": "Number of trees"},
            }},
            "NN_TORCH": {"label": "Neural Net (PyTorch)", "desc": "Multi-layer perceptron", "hyperparameters": {
                "num_epochs": {"default": 1000, "type": "number", "desc": "Training epochs"},
                "learning_rate": {"default": 0.0003, "type": "number", "desc": "Learning rate"},
                "dropout_prob": {"default": 0.1, "type": "number", "desc": "Dropout probability"},
            }},
        },
        "fit_options": {
            "time_limit": {"default": None, "type": "number", "desc": "Max training seconds"},
            "presets": {"default": "medium_quality", "type": "options",
                        "options": ["best_quality", "high_quality", "good_quality", "medium_quality"],
                        "desc": "Quality preset"},
            "num_bag_folds": {"default": 0, "type": "number", "desc": "Bagging folds (0 = off)"},
        },
    }


def _timeseries() -> dict[str, Any]:
    return {
        "predictor": {
            "prediction_length": {"default": 1, "type": "number", "desc": "Forecast horizon"},
            "eval_metric": {"default": "WQL", "type": "options",
                            "options": ["WQL", "MASE", "MAPE", "RMSE", "MAE"], "desc": "Evaluation metric"},
        },
        "models": {
            "DeepAR": {"desc": "Autoregressive RNN forecaster", "hyperparameters": {
                "epochs": {"default": 100, "type": "number", "desc": "Training epochs"},
            }},
            "AutoETS": {"desc": "Exponential smoothing", "hyperparameters": {}},
            "AutoARIMA": {"desc": "Auto ARIMA", "hyperparameters": {}},
        },
    }


@router.get("/hyperparameters")
async def get_hyperparameters() -> dict[str, Any]:
    return {"tabular": _tabular(), "timeseries": _timeseries()}
