from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import pick, temperature_max_props


@register_node
class OllamaNode(BaseNode):
    description = NodeDescription(
        display_name="Ollama",
        name="llm_ollama",
        category="Chat Models",
        icon="ollama",
        color="#000000",
        description="Run open models locally via Ollama",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty(
                "Base URL",
                "baseUrl",
                "string",
                default=settings.OLLAMA_BASE_URL,
                placeholder="http://localhost:11434",
                description="Ollama server URL",
            ),
            NodeProperty(
                "Model",
                "model",
                "string",
                default="llama3.2",
                placeholder="llama3.2, mistral, qwen2.5, …",
            ),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "ollama",
            "model": parameters.get("model", "llama3.2"),
            "baseUrl": pick(parameters.get("baseUrl"), settings.OLLAMA_BASE_URL),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}
