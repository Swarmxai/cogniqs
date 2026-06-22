"""Node implementations — auto-loaded via engine.yaml."""

from pathlib import Path

from app.engine.node_registry import load_nodes_from_yaml

_CONFIG = Path(__file__).resolve().parent.parent / "engine" / "config" / "engine.yaml"
load_nodes_from_yaml(str(_CONFIG))
