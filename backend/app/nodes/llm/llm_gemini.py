from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import api_key_prop, provider_credentials, resolve_api_key, temperature_max_props


@register_node
class GeminiNode(BaseNode):
    description = NodeDescription(
        display_name="Google Gemini",
        name="llm_gemini",
        category="Chat Models",
        icon="google",
        color="#4285f4",
        description="Google Gemini chat models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=provider_credentials("google", "gemini"),
        properties=[
            api_key_prop(placeholder="Leave empty to use Credential Vault or GOOGLE_API_KEY"),
            NodeProperty("Model", "model", "options", default="gemini-1.5-flash", options=[
                NodePropertyOption("Gemini 1.5 Flash", "gemini-1.5-flash"),
                NodePropertyOption("Gemini 1.5 Pro", "gemini-1.5-pro"),
                NodePropertyOption("Gemini 2.0 Flash", "gemini-2.0-flash"),
            ]),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "gemini",
            "model": parameters.get("model", "gemini-1.5-flash"),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
            "apiKey": resolve_api_key(parameters, context, settings.GOOGLE_API_KEY),
        }}
