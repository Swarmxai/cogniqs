"""Lazy import with optional automatic pip installation.

Heavy ML dependencies (AutoGluon, torch, etc.) are not installed by default.
They are installed on first use when AUTO_INSTALL_ML is enabled.
"""

from __future__ import annotations

import importlib
import logging
import subprocess
import sys

from app.config import settings

logger = logging.getLogger(__name__)

_PIP_NAME_MAP: dict[str, str] = {
    "sklearn": "scikit-learn",
    "autogluon.tabular": "autogluon.tabular[all]",
    "autogluon.multimodal": "autogluon.multimodal",
    "autogluon.timeseries": "autogluon.timeseries[all]",
    "PIL": "Pillow",
    "yaml": "pyyaml",
}

_attempted: set[str] = set()


def _pip_install(pip_name: str) -> bool:
    if pip_name in _attempted:
        return False
    _attempted.add(pip_name)
    logger.info("Installing %s ...", pip_name)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", pip_name])
        return True
    except subprocess.CalledProcessError as exc:
        logger.error("Failed to install %s: %s", pip_name, exc)
        return False


def lazy_import(module_name: str, *, pip_name: str | None = None, auto_install: bool | None = None):
    """Import a module, optionally installing it first."""
    try:
        return importlib.import_module(module_name)
    except ImportError:
        if auto_install is None:
            auto_install = settings.AUTO_INSTALL_ML
        if not auto_install:
            raise
        pip = pip_name or _PIP_NAME_MAP.get(module_name, module_name)
        if _pip_install(pip):
            importlib.invalidate_caches()
            return importlib.import_module(module_name)
        raise


def is_available(module_name: str) -> bool:
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False
