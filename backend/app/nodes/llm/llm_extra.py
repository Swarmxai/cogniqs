from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class AzureOpenAINode(BaseNode):
    description = NodeDescription(
        display_name="Azure OpenAI",
        name="llm_azure",
        category="Chat Models",
        icon="cloud",
        color="#0078d4",
        inputs=[], outputs=["ai_languageModel"],
        is_ai_subnode=True, ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Deployment", "model", "string", default=settings.AZURE_OPENAI_DEPLOYMENT),
            NodeProperty("Endpoint", "endpoint", "string", default=settings.AZURE_OPENAI_ENDPOINT),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "azure",
            "model": parameters.get("model", settings.AZURE_OPENAI_DEPLOYMENT),
            "endpoint": parameters.get("endpoint", settings.AZURE_OPENAI_ENDPOINT),
            "apiKey": settings.AZURE_OPENAI_API_KEY,
            "apiVersion": settings.AZURE_OPENAI_API_VERSION,
        }}


@register_node
class MistralNode(BaseNode):
    description = NodeDescription(
        display_name="Mistral AI",
        name="llm_mistral",
        category="Chat Models",
        icon="wind",
        color="#ff7000",
        inputs=[], outputs=["ai_languageModel"],
        is_ai_subnode=True, ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "options", default="mistral-small-latest", options=[
                NodePropertyOption("Mistral Small", "mistral-small-latest"),
                NodePropertyOption("Mistral Large", "mistral-large-latest"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "mistral",
            "model": parameters.get("model", "mistral-small-latest"),
            "apiKey": settings.MISTRAL_API_KEY,
        }}


@register_node
class DeepSeekNode(BaseNode):
    description = NodeDescription(
        display_name="DeepSeek",
        name="llm_deepseek",
        category="Chat Models",
        icon="cpu",
        color="#4d6bfe",
        inputs=[], outputs=["ai_languageModel"],
        is_ai_subnode=True, ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "options", default="deepseek-chat", options=[
                NodePropertyOption("DeepSeek Chat", "deepseek-chat"),
                NodePropertyOption("DeepSeek Reasoner", "deepseek-reasoner"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "deepseek",
            "model": parameters.get("model", "deepseek-chat"),
            "apiKey": settings.DEEPSEEK_API_KEY,
        }}
