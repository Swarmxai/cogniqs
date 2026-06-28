"""Loop control node."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class LoopNode(BaseNode):
    description = NodeDescription(
        display_name="Loop Over Items",
        name="loop_node",
        category="Control Flow",
        icon="repeat",
        color="#a855f7",
        description="Iterate over an array field and process each item",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Items Field", "itemsField", "string", default="items"),
            NodeProperty("Batch Size", "batchSize", "number", default=1, type_options={"minValue": 1, "maxValue": 100}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        payload = context.get("json") or {}
        field = parameters.get("itemsField", "items")
        items = payload.get(field, [])
        if not isinstance(items, list):
            items = [items]
        batch = int(parameters.get("batchSize", 1))
        return {"items": items, "count": len(items), "batch_size": batch, "loop": True}
