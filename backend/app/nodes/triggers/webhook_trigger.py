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
                NodePropertyOption("PUT", "PUT"),
                NodePropertyOption("PATCH", "PATCH"),
            ]),
            NodeProperty(
                "Path",
                "path",
                "string",
                default="",
                placeholder="/hooks/my-workflow",
                description="Optional path suffix for this webhook (appended to workflow URL).",
            ),
            NodeProperty(
                "Response Code",
                "responseCode",
                "number",
                default=200,
                description="HTTP status returned to the caller.",
                type_options={"minValue": 100, "maxValue": 599},
            ),
            NodeProperty(
                "Response Body",
                "responseBody",
                "string",
                default='{"ok": true}',
                description="JSON or text returned to the webhook caller.",
                type_options={"rows": 3},
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return context.get("json") or {}
