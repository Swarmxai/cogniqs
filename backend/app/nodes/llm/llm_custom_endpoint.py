from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import api_key_prop, pick, resolve_api_key, temperature_max_props


@register_node
class LLMCustomEndpointNode(BaseNode):
    description = NodeDescription(
        display_name="Custom LLM Endpoint",
        name="llm_custom_endpoint",
        category="Chat Models",
        icon="server",
        color="#6366f1",
        description="OpenAI-compatible custom or self-hosted endpoint",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Base URL", "baseUrl", "string", required=True, placeholder="https://your-gateway.example.com/v1"),
            NodeProperty("Model", "model", "string", required=True, placeholder="my-model-v1"),
            api_key_prop(placeholder="Leave empty to use CUSTOM_LLM_API_KEY or Credential Vault"),
            NodeProperty("API Version", "apiVersion", "string", default=""),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "openai",
            "baseUrl": pick(parameters.get("baseUrl"), "").rstrip("/"),
            "model": parameters.get("model", ""),
            "apiKey": resolve_api_key(parameters, context, getattr(settings, "CUSTOM_LLM_API_KEY", "") or settings.OPENAI_API_KEY),
            "apiVersion": parameters.get("apiVersion") or "",
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}
