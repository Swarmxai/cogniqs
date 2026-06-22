from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class IfNode(BaseNode):
    description = NodeDescription(
        display_name="IF",
        name="if_node",
        category="Logic",
        icon="git-branch",
        color="#64748b",
        inputs=["main"],
        outputs=["main-true", "main-false"],
        properties=[
            NodeProperty("Field", "field", "string", default=""),
            NodeProperty("Operator", "operator", "string", default="equals"),
            NodeProperty("Value", "value", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        data = context.get("json", {})
        field = parameters.get("field", "")
        op = parameters.get("operator", "equals")
        expected = parameters.get("value", "")
        actual = data.get(field) if field else data
        result = _compare(actual, expected, op)
        return {**data, "conditionResult": result, "activeOutput": "main-true" if result else "main-false"}


def _compare(actual: Any, expected: str, op: str) -> bool:
    if op == "equals":
        return str(actual) == str(expected)
    if op == "notEquals":
        return str(actual) != str(expected)
    if op == "contains":
        return str(expected) in str(actual)
    if op == "isEmpty":
        return not actual
    return bool(actual)
