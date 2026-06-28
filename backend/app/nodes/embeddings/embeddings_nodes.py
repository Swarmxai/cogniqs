"""Embeddings AI sub-nodes — emit embeddings config consumed by RAG/vector nodes."""

from __future__ import annotations

from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.nodes.llm.llm_helpers import api_key_prop, provider_credentials, resolve_api_key


@register_node
class OpenAIEmbeddingsNode(BaseNode):
    description = NodeDescription(
        display_name="OpenAI Embeddings",
        name="embeddings_openai",
        category="Embeddings",
        icon="openai",
        color="#10a37f",
        inputs=[],
        outputs=["ai_embeddings"],
        is_ai_subnode=True,
        ai_output_type="ai_embeddings",
        credentials=provider_credentials("openai"),
        properties=[
            NodeProperty("Model", "model", "options", default="text-embedding-3-small", options=[
                NodePropertyOption("text-embedding-3-small", "text-embedding-3-small"),
                NodePropertyOption("text-embedding-3-large", "text-embedding-3-large"),
                NodePropertyOption("text-embedding-ada-002", "text-embedding-ada-002"),
            ]),
            api_key_prop(),
            NodeProperty(
                "Dimensions",
                "dimensions",
                "number",
                default=0,
                description="Optional output dimensions (0 = model default).",
                type_options={"minValue": 0, "maxValue": 3072},
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        dims = int(parameters.get("dimensions") or 0)
        cfg: dict[str, Any] = {
            "provider": "openai",
            "model": parameters.get("model", "text-embedding-3-small"),
            "apiKey": resolve_api_key(parameters, context, settings.OPENAI_API_KEY),
        }
        if dims > 0:
            cfg["dimensions"] = dims
        return {"embeddings": cfg}


@register_node
class OllamaEmbeddingsNode(BaseNode):
    description = NodeDescription(
        display_name="Ollama Embeddings",
        name="embeddings_ollama",
        category="Embeddings",
        icon="ollama",
        color="#0ea5e9",
        inputs=[],
        outputs=["ai_embeddings"],
        is_ai_subnode=True,
        ai_output_type="ai_embeddings",
        properties=[
            NodeProperty("Model", "model", "string", default="nomic-embed-text"),
            NodeProperty("Base URL", "baseUrl", "string", default="http://localhost:11434"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"embeddings": {
            "provider": "ollama",
            "model": parameters.get("model", "nomic-embed-text"),
            "baseUrl": parameters.get("baseUrl", "http://localhost:11434"),
        }}


@register_node
class AzureOpenAIEmbeddingsNode(BaseNode):
    description = NodeDescription(
        display_name="Azure OpenAI Embeddings",
        name="embeddings_azure",
        category="Embeddings",
        icon="azure",
        color="#0078d4",
        inputs=[],
        outputs=["ai_embeddings"],
        is_ai_subnode=True,
        ai_output_type="ai_embeddings",
        credentials=provider_credentials("azure_openai", "azure"),
        properties=[
            NodeProperty("Deployment", "deployment", "string", default="text-embedding-3-small"),
            NodeProperty("Endpoint", "endpoint", "string", default=""),
            NodeProperty("API Version", "apiVersion", "string", default="2024-02-01"),
            api_key_prop(),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        from app.config import settings
        from app.nodes.llm.llm_helpers import cred_data, pick, resolve_api_key
        cred = cred_data(context)
        return {"embeddings": {
            "provider": "azure",
            "model": pick(parameters.get("deployment"), cred.get("deployment"), "text-embedding-3-small"),
            "endpoint": pick(parameters.get("endpoint"), cred.get("endpoint"), settings.AZURE_OPENAI_ENDPOINT),
            "apiVersion": pick(parameters.get("apiVersion"), cred.get("apiVersion"), settings.AZURE_OPENAI_API_VERSION),
            "apiKey": resolve_api_key(parameters, context, settings.AZURE_OPENAI_API_KEY),
        }}
