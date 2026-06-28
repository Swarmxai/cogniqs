"""Additional AI chain nodes."""

from __future__ import annotations

import json
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService
from app.services.vector_store import query_collection


@register_node
class QAChainNode(BaseNode):
    description = NodeDescription(
        display_name="QA Chain",
        name="qa_chain",
        category="AI Chains",
        icon="search",
        color="#7c6cff",
        description="Answer questions using context text or a vector collection",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Question", "question", "string", default="{{ $json.message }}"),
            NodeProperty("Context Field", "contextField", "string", default="context"),
            NodeProperty("Collection Name", "collectionName", "string", default=""),
            NodeProperty("Top K", "topK", "number", default=4, type_options={"minValue": 1, "maxValue": 20}),
            NodeProperty(
                "Response Format",
                "responseFormat",
                "options",
                default="text",
                options=[NodePropertyOption("Text", "text"), NodePropertyOption("JSON", "json")],
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("QA Chain requires a Chat Model connection")

        payload = context.get("json") or {}
        question = parameters.get("question") or payload.get("message") or payload.get("question", "")
        if not question:
            raise ValueError("Question is required")

        context_text = ""
        sources: list[str] = []
        ctx_field = parameters.get("contextField", "context")
        inline = payload.get(ctx_field) or payload.get("context")
        if inline:
            context_text = inline if isinstance(inline, str) else json.dumps(inline)
            sources = [context_text[:200]]

        collection = parameters.get("collectionName") or payload.get("collection_name")
        if not context_text and collection:
            embed_cfg = {"provider": "openai", "model": "text-embedding-3-small"}
            query_emb = (await LLMService.embed([str(question)], embed_cfg))[0]
            docs = query_collection(collection, query_emb, n_results=int(parameters.get("topK", 4)))
            sources = [d["content"][:200] for d in docs]
            context_text = "\n\n".join(d["content"] for d in docs)

        if not context_text:
            raise ValueError("Provide context text or a collection name")

        system = "Answer using only the provided context."
        if parameters.get("responseFormat") == "json":
            system += " Respond in valid JSON."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {question}"},
        ]
        result = await LLMService.chat(model_cfg, messages)
        return {"answer": result["content"], "response": result["content"], "sources": sources, "usage": result.get("usage", {})}


@register_node
class SummarizationChainNode(BaseNode):
    description = NodeDescription(
        display_name="Summarization Chain",
        name="summarization_chain",
        category="AI Chains",
        icon="file-text",
        color="#7c6cff",
        description="Summarize long documents with an LLM",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Input Field", "inputField", "string", default="text"),
            NodeProperty(
                "Strategy",
                "strategy",
                "options",
                default="stuff",
                options=[
                    NodePropertyOption("Single pass", "stuff"),
                    NodePropertyOption("Bullet points", "bullets"),
                    NodePropertyOption("Executive brief", "executive"),
                ],
            ),
            NodeProperty("Max Length", "maxLength", "number", default=500),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Summarization Chain requires a Chat Model connection")

        payload = context.get("json") or {}
        field = parameters.get("inputField", "text")
        text = str(payload.get(field) or payload.get("document") or "")
        if not text:
            raise ValueError("No text to summarize")

        strategy = parameters.get("strategy", "stuff")
        max_len = int(parameters.get("maxLength", 500))
        style = {
            "stuff": "Write a concise summary",
            "bullets": "Summarize as bullet points",
            "executive": "Write an executive brief for leadership",
        }.get(strategy, "Summarize")

        messages = [
            {"role": "system", "content": f"{style}. Max ~{max_len} words."},
            {"role": "user", "content": text[:50000]},
        ]
        result = await LLMService.chat(model_cfg, messages)
        return {
            "summary": result["content"],
            "original_length": len(text),
            "strategy": strategy,
            "usage": result.get("usage", {}),
        }


@register_node
class MultimodalIngestNode(BaseNode):
    description = NodeDescription(
        display_name="Multimodal Ingest",
        name="multimodal_ingest",
        category="AI Chains",
        icon="layers",
        color="#7c6cff",
        description="Ingest text and image metadata into a collection",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Collection Name", "collectionName", "string", required=True),
            NodeProperty("Text Field", "textField", "string", default="text"),
            NodeProperty("Image URL Field", "imageUrlField", "string", default="image_url"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        payload = context.get("json") or {}
        text = str(payload.get(parameters.get("textField", "text"), ""))
        image = payload.get(parameters.get("imageUrlField", "image_url"))
        collection = parameters.get("collectionName")
        doc = f"[IMAGE:{image}]\n{text}" if image else text
        embed_cfg = {"provider": "openai", "model": "text-embedding-3-small"}
        emb = (await LLMService.embed([doc], embed_cfg))[0]
        from app.services.vector_store import upsert_documents
        count = upsert_documents(collection, [doc], [emb])
        return {"collection": collection, "chunks_ingested": count, "multimodal": bool(image)}


@register_node
class MultimodalRAGQANode(BaseNode):
    description = NodeDescription(
        display_name="Multimodal RAG Q&A",
        name="multimodal_rag_qa",
        category="AI Chains",
        icon="search",
        color="#7c6cff",
        description="Q&A over multimodal collections",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Collection Name", "collectionName", "string", required=True),
            NodeProperty("Question", "question", "string", default="{{ $json.message }}"),
            NodeProperty("Top K", "topK", "number", default=5),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        params = {**parameters, "collectionName": parameters.get("collectionName")}
        chain = QAChainNode()
        return await chain.execute(node_id, params, context)
