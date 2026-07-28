from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import api_key_prop, cred_data, pick, provider_credentials, resolve_api_key, temperature_max_props


@register_node
class OpenAINode(BaseNode):
    description = NodeDescription(
        display_name="OpenAI",
        name="llm_openai",
        category="Chat Models",
        icon="openai",
        color="#412991",
        description="OpenAI GPT chat models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=provider_credentials("openai"),
        properties=[
            NodeProperty(
                "Base URL",
                "baseUrl",
                "string",
                default="https://api.openai.com/v1",
                placeholder="https://api.openai.com/v1",
                description="API base URL. Use default for OpenAI or a compatible proxy.",
            ),
            api_key_prop(placeholder="sk-... Leave empty to use Credential Vault or OPENAI_API_KEY"),
            NodeProperty(
                "API Version",
                "apiVersion",
                "string",
                default="",
                placeholder="Optional — e.g. 2024-02-01 for Azure-compatible gateways",
            ),
            NodeProperty("Model", "model", "options", default="gpt-4o-mini", options=[
                NodePropertyOption("GPT-4o Mini", "gpt-4o-mini"),
                NodePropertyOption("GPT-4o", "gpt-4o"),
                NodePropertyOption("GPT-4 Turbo", "gpt-4-turbo"),
                NodePropertyOption("GPT-3.5 Turbo", "gpt-3.5-turbo"),
            ]),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "openai",
            "baseUrl": pick(parameters.get("baseUrl"), cred_data(context).get("baseUrl"), "https://api.openai.com/v1").rstrip("/"),
            "apiKey": resolve_api_key(parameters, context, settings.OPENAI_API_KEY),
            "organization": pick(parameters.get("organization"), cred_data(context).get("organization"), default=""),
            "apiVersion": parameters.get("apiVersion") or "",
            "model": parameters.get("model", "gpt-4o-mini"),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}
