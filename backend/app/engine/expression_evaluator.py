"""Expression evaluator for {{ $json.field }} and {{ $node.id.field }}."""

from __future__ import annotations

import re
from typing import Any

_EXPR_PATTERN = re.compile(r"\{\{\s*(.+?)\s*\}\}")


def _resolve_path(obj: Any, path: str) -> Any:
    parts = path.split(".")
    current = obj
    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return None
    return current


def evaluate_expression(expr: str, context: dict[str, Any]) -> Any:
    expr = expr.strip()
    if expr.startswith("$json."):
        return _resolve_path(context.get("json", {}), expr[6:])
    if expr.startswith("$node."):
        rest = expr[6:]
        node_id, _, field = rest.partition(".")
        node_out = context.get("node_outputs", {}).get(node_id, {})
        return _resolve_path(node_out, field) if field else node_out
    return expr


def evaluate_expressions(value: Any, context: dict[str, Any]) -> Any:
    if isinstance(value, str):
        if value.startswith("{{") and value.endswith("}}"):
            inner = value[2:-2].strip()
            return evaluate_expression(inner, context)
        def replacer(match: re.Match) -> str:
            result = evaluate_expression(match.group(1), context)
            return str(result) if result is not None else ""
        return _EXPR_PATTERN.sub(replacer, value)
    if isinstance(value, dict):
        return {k: evaluate_expressions(v, context) for k, v in value.items()}
    if isinstance(value, list):
        return [evaluate_expressions(item, context) for item in value]
    return value
