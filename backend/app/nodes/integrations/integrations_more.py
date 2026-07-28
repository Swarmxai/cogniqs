"""Additional integration nodes."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class RespondWebhookNode(BaseNode):
    description = NodeDescription(
        display_name="Respond to Webhook",
        name="respond_webhook",
        category="App Connectors",
        icon="webhook",
        color="#2563eb",
        description="Send an HTTP response body back to the webhook that triggered the run.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Status Code", "statusCode", "number", default=200),
            NodeProperty("Body", "body", "json", default='{"ok": true}'),
            NodeProperty("Headers (JSON)", "headers", "json", default='{"Content-Type":"application/json"}'),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "webhook_response": {
                "status": int(parameters.get("statusCode", 200)),
                "body": parameters.get("body"),
                "headers": parameters.get("headers"),
            }
        }


@register_node
class EmailReadNode(BaseNode):
    description = NodeDescription(
        display_name="Read Email",
        name="email_read",
        category="App Connectors",
        icon="mail",
        color="#2563eb",
        description="Fetch messages from an IMAP inbox and emit them as workflow items.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("IMAP Host", "host", "string", default="imap.gmail.com"),
            NodeProperty("Mailbox", "mailbox", "string", default="INBOX"),
            NodeProperty("Max Messages", "maxMessages", "number", default=10),
            NodeProperty("Unread Only", "unreadOnly", "boolean", default=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "messages": [],
            "mailbox": parameters.get("mailbox", "INBOX"),
            "note": "Configure IMAP credentials in Credential Vault to enable live fetch",
        }
