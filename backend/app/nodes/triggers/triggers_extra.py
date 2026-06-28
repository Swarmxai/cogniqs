"""Additional workflow triggers."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class ErrorTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Error Trigger",
        name="error_trigger",
        category="Triggers",
        icon="alert-triangle",
        color="#ef4444",
        description="Starts when another workflow run fails",
        outputs=["main"],
        properties=[
            NodeProperty("Include Stack Trace", "includeStack", "boolean", default=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"error_triggered": True, "payload": context.get("json") or {}}


@register_node
class APITriggerNode(BaseNode):
    description = NodeDescription(
        display_name="API Trigger",
        name="api_trigger",
        category="Triggers",
        icon="zap",
        color="#6366f1",
        description="Expose a REST entrypoint for this workflow",
        outputs=["main"],
        properties=[
            NodeProperty("HTTP Method", "method", "options", default="POST", options=[
                NodePropertyOption("POST", "POST"),
                NodePropertyOption("GET", "GET"),
                NodePropertyOption("PUT", "PUT"),
            ]),
            NodeProperty("Path", "path", "string", default="/run"),
            NodeProperty("Auth Required", "authRequired", "boolean", default=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"api_triggered": True, "body": context.get("json") or {}}


@register_node
class SlackTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Slack Trigger",
        name="slack_trigger",
        category="Triggers",
        icon="slack",
        color="#4A154B",
        description="Start when Slack sends an event",
        outputs=["main"],
        properties=[
            NodeProperty("Event Type", "eventType", "options", default="message", options=[
                NodePropertyOption("Message", "message"),
                NodePropertyOption("App mention", "app_mention"),
                NodePropertyOption("Reaction", "reaction_added"),
            ]),
            NodeProperty("Channel Filter", "channel", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"slack_event": context.get("json") or {}, "event_type": parameters.get("eventType", "message")}


@register_node
class TelegramTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Telegram Trigger",
        name="telegram_trigger",
        category="Triggers",
        icon="telegram",
        color="#0088cc",
        description="Start when Telegram bot receives a message",
        outputs=["main"],
        properties=[
            NodeProperty("Allowed Chat IDs", "chatIds", "string", default="", description="Comma-separated; empty = all"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"telegram_update": context.get("json") or {}}
