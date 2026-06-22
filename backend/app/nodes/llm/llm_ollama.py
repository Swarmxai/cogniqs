from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class OllamaNode(BaseNode):
    description = NodeDescription(
        display_name="Ollama",
        name="llm_ollama",
        category="Chat Models",
        icon="server",
        color="#000000",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "string", default="llama3.2"),
            NodeProperty("Base URL", "baseUrl", "string", default=settings.OLLAMA_BASE_URL),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "ollama",
            "model": parameters.get("model", "llama3.2"),
            "baseUrl": parameters.get("baseUrl", settings.OLLAMA_BASE_URL),
        }}
