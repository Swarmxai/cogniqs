"""Human-in-the-loop approval gate."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class HumanApprovalNode(BaseNode):
    description = NodeDescription(
        display_name="Human Approval",
        name="human_approval",
        category="Human Gate",
        icon="check-circle",
        color="#14b8a6",
        description="Pause workflow until a human approves or rejects",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Title", "title", "string", default="Approval required"),
            NodeProperty("Message", "message", "string", default="Review the payload and approve to continue.", type_options={"rows": 3}),
            NodeProperty("Channel", "channel", "options", default="manual", options=[
                NodePropertyOption("Manual (editor)", "manual"),
                NodePropertyOption("Slack", "slack"),
                NodePropertyOption("Email", "email"),
            ]),
            NodeProperty("Timeout (hours)", "timeoutHours", "number", default=24, type_options={"minValue": 1, "maxValue": 168}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        channel = parameters.get("channel", "manual")
        trigger = context.get("json") or {}
        if channel == "manual":
            approved = trigger.get("approved", False)
        else:
            approved = trigger.get("approved", False)
        return {
            "approved": approved,
            "title": parameters.get("title"),
            "channel": parameters.get("channel", "manual"),
            "payload": context.get("json") or {},
        }
