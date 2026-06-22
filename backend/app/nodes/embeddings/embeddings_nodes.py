"""Embeddings AI sub-nodes — emit embeddings config consumed by RAG/vector nodes."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class OpenAIEmbeddingsNode(BaseNode):
    description = NodeDescription(
        display_name="OpenAI Embeddings",
        name="embeddings_openai",
        category="Embeddings",
        icon="sparkles",
        color="#10a37f",
        inputs=[],
        outputs=["ai_embeddings"],
        is_ai_subnode=True,
        ai_output_type="ai_embeddings",
        properties=[
            NodeProperty("Model", "model", "string", default="text-embedding-3-small"),
            NodeProperty("Credential ID", "credential_id", "number"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"embeddings": {"provider": "openai", "model": parameters.get("model", "text-embedding-3-small"),
                               "credential_id": parameters.get("credential_id")}}


@register_node
class OllamaEmbeddingsNode(BaseNode):
    description = NodeDescription(
        display_name="Ollama Embeddings",
        name="embeddings_ollama",
        category="Embeddings",
        icon="server",
        color="#0ea5e9",
        inputs=[],
        outputs=["ai_embeddings"],
        is_ai_subnode=True,
        ai_output_type="ai_embeddings",
        properties=[
            NodeProperty("Model", "model", "string", default="nomic-embed-text"),
            NodeProperty("Base URL", "base_url", "string", default="http://localhost:11434"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"embeddings": {"provider": "ollama", "model": parameters.get("model", "nomic-embed-text"),
                               "base_url": parameters.get("base_url")}}
