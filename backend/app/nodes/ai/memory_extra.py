"""Extended memory sub-nodes."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.services.memory_service import MemoryStore


@register_node
class ConversationMemoryNode(BaseNode):
    description = NodeDescription(
        display_name="Conversation Memory",
        name="conversation_memory",
        category="Memory",
        icon="message-square",
        color="#ec4899",
        inputs=[], outputs=["ai_memory"],
        is_ai_subnode=True, ai_output_type="ai_memory",
        properties=[
            NodeProperty(
                "Retrieval Policy",
                "retrievalPolicy",
                "options",
                default="window",
                options=[
                    NodePropertyOption("Window", "window"),
                    NodePropertyOption("Full history", "full"),
                ],
            ),
            NodeProperty("Session ID Field", "sessionIdField", "string", default="session_id"),
            NodeProperty("Window Size", "windowSize", "number", default=20, type_options={"minValue": 1, "maxValue": 200}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("sessionIdField", "session_id")
        session_id = context.get("json", {}).get(field) or "default"
        max_msgs = int(parameters.get("windowSize", 20))
        policy = parameters.get("retrievalPolicy", "window")
        cfg = MemoryStore.to_config(session_id, max_msgs if policy == "window" else 10_000)
        cfg["policy"] = policy
        return {"memory": cfg}


@register_node
class MemoryTokenBufferNode(BaseNode):
    description = NodeDescription(
        display_name="Token Buffer Memory",
        name="memory_token_buffer",
        category="Memory",
        icon="database",
        color="#ec4899",
        inputs=[], outputs=["ai_memory"],
        is_ai_subnode=True, ai_output_type="ai_memory",
        properties=[
            NodeProperty("Session ID Field", "sessionIdField", "string", default="session_id"),
            NodeProperty("Max Tokens", "maxTokens", "number", default=2000, type_options={"minValue": 256, "maxValue": 32000}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("sessionIdField", "session_id")
        session_id = context.get("json", {}).get(field) or "default"
        max_tokens = int(parameters.get("maxTokens", 2000))
        cfg = MemoryStore.to_config(session_id, 50)
        cfg["max_tokens"] = max_tokens
        cfg["type"] = "token_buffer"
        return {"memory": cfg}
