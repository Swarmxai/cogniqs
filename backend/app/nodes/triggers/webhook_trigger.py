from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class WebhookTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Webhook",
        name="webhook_trigger",
        category="Triggers",
        icon="webhook",
        color="#10b981",
        description="Receive HTTP webhook payloads",
        outputs=["main"],
        properties=[
            NodeProperty("HTTP Method", "method", "options", default="POST", options=[
                NodePropertyOption("POST", "POST"),
                NodePropertyOption("GET", "GET"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return context.get("json") or {}
