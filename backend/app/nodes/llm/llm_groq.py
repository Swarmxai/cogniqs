from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import api_key_prop, provider_credentials, resolve_api_key, temperature_max_props


@register_node
class GroqNode(BaseNode):
    description = NodeDescription(
        display_name="Groq",
        name="llm_groq",
        category="Chat Models",
        icon="groq",
        color="#f55036",
        description="Groq fast inference for open models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=provider_credentials("groq"),
        properties=[
            api_key_prop(placeholder="Leave empty to use Credential Vault or GROQ_API_KEY"),
            NodeProperty("Model", "model", "options", default="llama-3.3-70b-versatile", options=[
                NodePropertyOption("Llama 3.3 70B", "llama-3.3-70b-versatile"),
                NodePropertyOption("Mixtral 8x7B", "mixtral-8x7b-32768"),
                NodePropertyOption("Gemma 2 9B", "gemma2-9b-it"),
            ]),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "groq",
            "model": parameters.get("model", "llama-3.3-70b-versatile"),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
            "apiKey": resolve_api_key(parameters, context, settings.GROQ_API_KEY),
        }}
