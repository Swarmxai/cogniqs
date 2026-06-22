from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class GeminiNode(BaseNode):
    description = NodeDescription(
        display_name="Google Gemini",
        name="llm_gemini",
        category="Chat Models",
        icon="gem",
        color="#4285f4",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "options", default="gemini-1.5-flash", options=[
                NodePropertyOption("Gemini 1.5 Flash", "gemini-1.5-flash"),
                NodePropertyOption("Gemini 1.5 Pro", "gemini-1.5-pro"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "gemini",
            "model": parameters.get("model", "gemini-1.5-flash"),
            "apiKey": settings.GOOGLE_API_KEY,
        }}
