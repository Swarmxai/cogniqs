import json
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class SetNode(BaseNode):
    description = NodeDescription(
        display_name="Set",
        name="set_node",
        category="Data",
        icon="edit",
        color="#0ea5e9",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Fields JSON", "fields", "json", default='{"key": "value"}'),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        data = dict(context.get("json", {}))
        fields = parameters.get("fields", "{}")
        if isinstance(fields, str):
            fields = json.loads(fields)
        data.update(fields)
        return data
