"""Vector store and retriever sub-nodes for RAG pipelines."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class VectorStoreChromaDBNode(BaseNode):
    description = NodeDescription(
        display_name="ChromaDB Vector Store",
        name="vector_store_chromadb",
        category="Vector Stores",
        icon="database",
        color="#8b5cf6",
        description="Persistent vector store backed by ChromaDB",
        inputs=[],
        outputs=["ai_vectorStore"],
        is_ai_subnode=True,
        ai_output_type="ai_vectorStore",
        properties=[
            NodeProperty("Collection Name", "collectionName", "string", default="default", required=True),
            NodeProperty("Top K", "topK", "number", default=5, type_options={"minValue": 1, "maxValue": 100}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "vectorStore": {
                "type": "chromadb",
                "collection": parameters.get("collectionName", "default"),
                "topK": int(parameters.get("topK", 5)),
            }
        }


@register_node
class VectorStoreInMemoryNode(BaseNode):
    description = NodeDescription(
        display_name="In-Memory Vector Store",
        name="vector_store_in_memory",
        category="Vector Stores",
        icon="layers",
        color="#8b5cf6",
        description="Ephemeral in-process vector store for development",
        inputs=[],
        outputs=["ai_vectorStore"],
        is_ai_subnode=True,
        ai_output_type="ai_vectorStore",
        properties=[
            NodeProperty("Collection Name", "collectionName", "string", default="dev"),
            NodeProperty("Top K", "topK", "number", default=5),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "vectorStore": {
                "type": "memory",
                "collection": parameters.get("collectionName", "dev"),
                "topK": int(parameters.get("topK", 5)),
            }
        }


@register_node
class RetrieverVectorStoreNode(BaseNode):
    description = NodeDescription(
        display_name="Vector Store Retriever",
        name="retriever_vector_store",
        category="Retrievers",
        icon="search",
        color="#f59e0b",
        description="Retrieve relevant chunks from a connected vector store",
        inputs=["ai_vectorStore"],
        outputs=["ai_retriever"],
        is_ai_subnode=True,
        ai_output_type="ai_retriever",
        properties=[
            NodeProperty("Top K", "topK", "number", default=4, type_options={"minValue": 1, "maxValue": 50}),
            NodeProperty("Score Threshold", "scoreThreshold", "number", default=0.0),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        store = context.get("ai_vector_store") or {}
        return {
            "retriever": {
                "type": "vector_store",
                "store": store,
                "topK": int(parameters.get("topK", 4)),
                "scoreThreshold": float(parameters.get("scoreThreshold", 0.0)),
            }
        }
