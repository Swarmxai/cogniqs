from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class GroqNode(BaseNode):
    description = NodeDescription(
        display_name="Groq",
        name="llm_groq",
        category="Chat Models",
        icon="zap",
        color="#f55036",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "options", default="llama-3.3-70b-versatile", options=[
                NodePropertyOption("Llama 3.3 70B", "llama-3.3-70b-versatile"),
                NodePropertyOption("Mixtral 8x7B", "mixtral-8x7b-32768"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "groq",
            "model": parameters.get("model", "llama-3.3-70b-versatile"),
            "apiKey": settings.GROQ_API_KEY,
        }}
