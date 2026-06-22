from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class ManualTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Manual Trigger",
        name="manual_trigger",
        category="Triggers",
        icon="play",
        color="#10b981",
        description="Start workflow manually with custom input data",
        outputs=["main"],
        properties=[
            NodeProperty("Input JSON", "inputJson", "json", default="{}", description="Default trigger payload"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        import json
        trigger = context.get("json") or {}
        default = parameters.get("inputJson", "{}")
        if isinstance(default, str):
            try:
                default = json.loads(default)
            except json.JSONDecodeError:
                default = {}
        merged = {**default, **trigger}
        return merged
