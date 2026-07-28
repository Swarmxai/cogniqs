from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.services.memory_service import MemoryStore


@register_node
class MemoryBufferNode(BaseNode):
    description = NodeDescription(
        display_name="Memory Buffer",
        name="memory_buffer",
        category="Memory",
        icon="database",
        color="#ec4899",
        description="Keep a rolling buffer of recent chat turns for agent context.",
        inputs=[],
        outputs=["ai_memory"],
        is_ai_subnode=True,
        ai_output_type="ai_memory",
        properties=[
            NodeProperty(
                "Session ID Field",
                "sessionIdField",
                "string",
                default="session_id",
                description="JSON field used to group conversation history.",
            ),
            NodeProperty(
                "Window Size",
                "maxMessages",
                "number",
                default=20,
                description="Maximum messages kept in memory.",
                type_options={"minValue": 1, "maxValue": 200},
            ),
            NodeProperty(
                "Return Messages",
                "returnMessages",
                "boolean",
                default=True,
                description="Include prior turns when the agent runs.",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        field = parameters.get("sessionIdField", "session_id")
        session_id = context.get("json", {}).get(field) or "default"
        max_msgs = int(parameters.get("maxMessages", 20))
        return {"memory": MemoryStore.to_config(session_id, max_msgs)}
