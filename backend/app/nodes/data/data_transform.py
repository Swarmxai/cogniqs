"""Data transformation nodes: Filter, Sort, Limit, Aggregate, Remove Duplicates."""

from __future__ import annotations

import json
from typing import Any

from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node


def _items(context: dict[str, Any]) -> list[dict]:
    data = context.get("json", {})
    if isinstance(data, dict):
        items = data.get("items") or data.get("rows") or data.get("records")
        if isinstance(items, list):
            return items
        return [data]
    if isinstance(data, list):
        return data
    return []


@register_node
class FilterNode(BaseNode):
    description = NodeDescription(
        display_name="Filter",
        name="filter_node",
        category="Data",
        icon="filter",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Field", "field", "string", default=""),
            NodeProperty("Operator", "operator", "options", default="equals",
                         options=[
                             NodePropertyOption("Equals", "equals"),
                             NodePropertyOption("Not Equals", "notEquals"),
                             NodePropertyOption("Contains", "contains"),
                             NodePropertyOption("Greater Than", "gt"),
                             NodePropertyOption("Less Than", "lt"),
                         ]),
            NodeProperty("Value", "value", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("field", "")
        op = parameters.get("operator", "equals")
        value = parameters.get("value", "")
        kept = [it for it in _items(context) if _match(it.get(field), value, op)]
        return {"items": kept, "count": len(kept)}


def _match(actual, expected, op) -> bool:
    if op == "equals":
        return str(actual) == str(expected)
    if op == "notEquals":
        return str(actual) != str(expected)
    if op == "contains":
        return str(expected) in str(actual)
    try:
        if op == "gt":
            return float(actual) > float(expected)
        if op == "lt":
            return float(actual) < float(expected)
    except (ValueError, TypeError):
        return False
    return False


@register_node
class SortNode(BaseNode):
    description = NodeDescription(
        display_name="Sort",
        name="sort_node",
        category="Data",
        icon="filter",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Field", "field", "string", default=""),
            NodeProperty("Order", "order", "options", default="asc",
                         options=[NodePropertyOption("Ascending", "asc"), NodePropertyOption("Descending", "desc")]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("field", "")
        reverse = parameters.get("order") == "desc"
        items = _items(context)
        try:
            items = sorted(items, key=lambda x: x.get(field), reverse=reverse)
        except TypeError:
            items = sorted(items, key=lambda x: str(x.get(field)), reverse=reverse)
        return {"items": items, "count": len(items)}


@register_node
class LimitNode(BaseNode):
    description = NodeDescription(
        display_name="Limit",
        name="limit_node",
        category="Data",
        icon="filter",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[NodeProperty("Max Items", "max_items", "number", default=10)],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        limit = int(parameters.get("max_items") or 10)
        items = _items(context)[:limit]
        return {"items": items, "count": len(items)}


@register_node
class AggregateNode(BaseNode):
    description = NodeDescription(
        display_name="Aggregate",
        name="aggregate_node",
        category="Data",
        icon="filter",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Field", "field", "string", default=""),
            NodeProperty("Operation", "operation", "options", default="sum",
                         options=[
                             NodePropertyOption("Sum", "sum"),
                             NodePropertyOption("Average", "avg"),
                             NodePropertyOption("Min", "min"),
                             NodePropertyOption("Max", "max"),
                             NodePropertyOption("Count", "count"),
                         ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("field", "")
        op = parameters.get("operation", "sum")
        items = _items(context)
        values = [float(it.get(field)) for it in items if _is_num(it.get(field))]
        result: Any
        if op == "count":
            result = len(items)
        elif not values:
            result = 0
        elif op == "sum":
            result = sum(values)
        elif op == "avg":
            result = sum(values) / len(values)
        elif op == "min":
            result = min(values)
        elif op == "max":
            result = max(values)
        else:
            result = 0
        return {"result": result, "operation": op, "field": field}


def _is_num(v) -> bool:
    try:
        float(v)
        return True
    except (ValueError, TypeError):
        return False


@register_node
class RemoveDuplicatesNode(BaseNode):
    description = NodeDescription(
        display_name="Remove Duplicates",
        name="remove_duplicates_node",
        category="Data",
        icon="filter",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[NodeProperty("Field", "field", "string", default="")],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("field", "")
        seen = set()
        result = []
        for it in _items(context):
            key = it.get(field) if field else json.dumps(it, sort_keys=True, default=str)
            if key not in seen:
                seen.add(key)
                result.append(it)
        return {"items": result, "count": len(result)}
