"""Node registry — decorator + YAML loading."""

from __future__ import annotations

import importlib
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.engine.node_base import BaseNode

logger = logging.getLogger(__name__)

_registry: dict[str, type["BaseNode"]] = {}
_node_configs: dict[str, dict[str, Any]] = {}


def register_node(node_class: type["BaseNode"]) -> type["BaseNode"]:
    _registry[node_class.description.name] = node_class
    return node_class


def load_nodes_from_yaml(yaml_path: str) -> None:
    import yaml

    config_path = Path(yaml_path)
    if not config_path.exists():
        logger.warning("Node config not found: %s", yaml_path)
        return

    with open(config_path) as f:
        config = yaml.safe_load(f) or {}

    loaded = 0
    for label, node_def in (config.get("nodes") or {}).items():
        try:
            import_path = node_def.get("import_path", "")
            if not import_path:
                continue
            module_path, cls_name = import_path.rsplit(".", 1)
            module = importlib.import_module(module_path)
            cls: type["BaseNode"] = getattr(module, cls_name)
            type_name = cls.description.name
            _registry[type_name] = cls
            _node_configs[type_name] = node_def.get("config", {})
            loaded += 1
        except Exception as exc:
            logger.warning("Failed to load node '%s': %s", label, exc)

    logger.info("Node registry: %d types loaded", loaded)


def get_node_class(type_name: str) -> type["BaseNode"] | None:
    return _registry.get(type_name)


def get_all_node_descriptions() -> list[dict[str, Any]]:
    return [cls.description.to_dict() for cls in _registry.values()]


def get_node_categories() -> dict[str, list[dict[str, Any]]]:
    categories: dict[str, list[dict[str, Any]]] = {}
    for cls in _registry.values():
        desc = cls.description.to_dict()
        cat = desc.get("category", "General")
        categories.setdefault(cat, []).append(desc)
    return categories


def registry_count() -> int:
    return len(_registry)
