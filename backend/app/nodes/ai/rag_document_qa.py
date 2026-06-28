from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService
from app.services.vector_store import query_collection


@register_node
class RAGDocumentQANode(BaseNode):
    description = NodeDescription(
        display_name="Document Q&A",
        name="rag_document_qa",
        category="RAG",
        icon="search",
        color="#059669",
        description="Answer questions using retrieved document chunks",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty(
                "Collection Name",
                "collectionName",
                "string",
                required=True,
                description="Vector collection to search.",
            ),
            NodeProperty(
                "Question",
                "question",
                "string",
                default="{{ $json.message }}",
                description="Question expression or static text.",
                type_options={"rows": 2},
            ),
            NodeProperty(
                "Top K",
                "topK",
                "number",
                default=5,
                description="Number of chunks to retrieve.",
                type_options={"minValue": 1, "maxValue": 50},
            ),
            NodeProperty(
                "System Prompt",
                "systemPrompt",
                "string",
                default="Answer based on the provided context. If unsure, say you don't know.",
                type_options={"rows": 3},
            ),
            NodeProperty(
                "Include Sources",
                "includeSources",
                "boolean",
                default=True,
                description="Return source excerpts in the output.",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Document Q&A requires a Chat Model connection")

        collection = parameters.get("collectionName") or context.get("json", {}).get("collection_name")
        question = parameters.get("question") or context.get("json", {}).get("message", "")
        if not collection or not question:
            raise ValueError("Collection name and question are required")

        embed_cfg = {"provider": "openai", "model": "text-embedding-3-small"}
        query_emb = (await LLMService.embed([str(question)], embed_cfg))[0]
        docs = query_collection(collection, query_emb, n_results=int(parameters.get("topK", 5)))
        context_text = "\n\n".join(d["content"] for d in docs)

        system = parameters.get("systemPrompt", "Answer based on the provided context.")
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {question}"},
        ]
        result = await LLMService.chat(model_cfg, messages)
        out: dict[str, Any] = {
            "answer": result["content"],
            "response": result["content"],
            "usage": result.get("usage", {}),
        }
        if parameters.get("includeSources", True):
            out["sources"] = [d["content"][:200] for d in docs]
        return out
