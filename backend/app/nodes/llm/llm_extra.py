from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import (
    api_key_prop,
    azure_credentials,
    cred_data,
    pick,
    provider_credentials,
    resolve_api_key,
    temperature_max_props,
)


@register_node
class AzureOpenAINode(BaseNode):
    description = NodeDescription(
        display_name="Azure OpenAI",
        name="llm_azure",
        category="Chat Models",
        icon="azure",
        color="#0078d4",
        description="Azure OpenAI chat deployments",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=azure_credentials(),
        properties=[
            NodeProperty(
                "Deployment Name",
                "model",
                "string",
                default=settings.AZURE_OPENAI_DEPLOYMENT,
                placeholder="gpt-4o-mini",
                required=True,
                description="Azure deployment name (not the OpenAI model id).",
            ),
            NodeProperty(
                "Azure Endpoint",
                "endpoint",
                "string",
                default=settings.AZURE_OPENAI_ENDPOINT,
                placeholder="https://your-resource.openai.azure.com",
                required=True,
                description="Resource endpoint URL.",
            ),
            NodeProperty(
                "API Version",
                "apiVersion",
                "string",
                default=settings.AZURE_OPENAI_API_VERSION,
                placeholder="2024-02-01",
                required=True,
                description="Azure OpenAI API version.",
            ),
            api_key_prop(placeholder="Leave empty to use Credential Vault or AZURE_OPENAI_API_KEY"),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        cred = cred_data(context)
        endpoint = pick(
            parameters.get("endpoint"),
            cred.get("endpoint"),
            cred.get("azure_endpoint"),
            settings.AZURE_OPENAI_ENDPOINT,
        )
        return {"model": {
            "provider": "azure",
            "model": pick(parameters.get("model"), cred.get("deployment"), settings.AZURE_OPENAI_DEPLOYMENT),
            "endpoint": str(endpoint).rstrip("/"),
            "apiVersion": pick(parameters.get("apiVersion"), cred.get("apiVersion"), settings.AZURE_OPENAI_API_VERSION),
            "apiKey": resolve_api_key(parameters, context, settings.AZURE_OPENAI_API_KEY),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}


@register_node
class MistralNode(BaseNode):
    description = NodeDescription(
        display_name="Mistral AI",
        name="llm_mistral",
        category="Chat Models",
        icon="mistral",
        color="#ff7000",
        description="Mistral chat models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=provider_credentials("mistral"),
        properties=[
            api_key_prop(placeholder="Leave empty to use Credential Vault or MISTRAL_API_KEY"),
            NodeProperty("Model", "model", "options", default="mistral-small-latest", options=[
                NodePropertyOption("Mistral Small", "mistral-small-latest"),
                NodePropertyOption("Mistral Large", "mistral-large-latest"),
                NodePropertyOption("Codestral", "codestral-latest"),
            ]),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "mistral",
            "model": parameters.get("model", "mistral-small-latest"),
            "apiKey": resolve_api_key(parameters, context, settings.MISTRAL_API_KEY),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}


@register_node
class DeepSeekNode(BaseNode):
    description = NodeDescription(
        display_name="DeepSeek",
        name="llm_deepseek",
        category="Chat Models",
        icon="deepseek",
        color="#4d6bfe",
        description="DeepSeek chat and reasoning models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        credentials=provider_credentials("deepseek"),
        properties=[
            api_key_prop(placeholder="Leave empty to use Credential Vault or DEEPSEEK_API_KEY"),
            NodeProperty(
                "Base URL",
                "baseUrl",
                "string",
                default="https://api.deepseek.com",
                placeholder="https://api.deepseek.com",
            ),
            NodeProperty("Model", "model", "options", default="deepseek-chat", options=[
                NodePropertyOption("DeepSeek Chat", "deepseek-chat"),
                NodePropertyOption("DeepSeek Reasoner", "deepseek-reasoner"),
            ]),
            *temperature_max_props(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "deepseek",
            "model": parameters.get("model", "deepseek-chat"),
            "baseUrl": pick(parameters.get("baseUrl"), "https://api.deepseek.com").rstrip("/"),
            "apiKey": resolve_api_key(parameters, context, settings.DEEPSEEK_API_KEY),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 4096)),
        }}
