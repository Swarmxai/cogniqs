from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService
from app.services.vector_store import query_collection, upsert_documents


def _chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += chunk_size - overlap
    return chunks or [text]


@register_node
class DocumentIngestNode(BaseNode):
    description = NodeDescription(
        display_name="Document Ingest",
        name="document_ingest",
        category="RAG",
        icon="file-text",
        color="#059669",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Collection Name", "collectionName", "string", required=True),
            NodeProperty(
                "Document Text",
                "documentText",
                "string",
                default="{{ $json.document }}",
                type_options={"rows": 6},
            ),
            NodeProperty("Chunk Size", "chunkSize", "number", default=1000, type_options={"minValue": 200, "maxValue": 8000}),
            NodeProperty("Chunk Overlap", "chunkOverlap", "number", default=200, type_options={"minValue": 0, "maxValue": 2000}),
            NodeProperty(
                "Embedding Model",
                "embeddingModel",
                "string",
                default="text-embedding-3-small",
                description="OpenAI embedding model used for indexing.",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        collection = parameters.get("collectionName") or context.get("json", {}).get("collection_name")
        if not collection:
            raise ValueError("Collection name is required")

        text = parameters.get("documentText") or context.get("json", {}).get("document", "")
        if not text:
            raise ValueError("No document text provided")

        chunks = _chunk_text(
            str(text),
            int(parameters.get("chunkSize", 1000)),
            int(parameters.get("chunkOverlap", 200)),
        )
        embed_cfg = {"provider": "openai", "model": parameters.get("embeddingModel", "text-embedding-3-small")}
        embeddings = await LLMService.embed(chunks, embed_cfg)
        count = upsert_documents(collection, chunks, embeddings)
        return {"collection": collection, "chunks_ingested": count, "status": "indexed"}
