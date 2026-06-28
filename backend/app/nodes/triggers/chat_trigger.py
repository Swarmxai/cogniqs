from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class ChatTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Chat Trigger",
        name="chat_trigger",
        category="Triggers",
        icon="message-circle",
        color="#10b981",
        description="Start from a chat message with session support",
        outputs=["main"],
        properties=[
            NodeProperty(
                "Welcome Message",
                "welcomeMessage",
                "string",
                default="Hello! How can I help?",
                type_options={"rows": 2},
            ),
            NodeProperty(
                "Session ID Field",
                "sessionIdField",
                "string",
                default="session_id",
                description="JSON field that identifies the chat session.",
            ),
            NodeProperty(
                "Public",
                "isPublic",
                "boolean",
                default=False,
                description="Allow unauthenticated chat access when enabled.",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        data = context.get("json") or {}
        return {
            "message": data.get("message", ""),
            "session_id": data.get("session_id", ""),
            "history": data.get("history", []),
            "welcome_message": parameters.get("welcomeMessage", ""),
        }
