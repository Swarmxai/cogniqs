"""Document processing nodes for RAG ingest pipelines."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


def _chunk_text(text: str, chunk_size: int, overlap: int, separator: str | None = None) -> list[str]:
    if separator:
        parts = text.split(separator)
        chunks: list[str] = []
        buf = ""
        for part in parts:
            if len(buf) + len(part) <= chunk_size:
                buf = f"{buf}{separator}{part}" if buf else part
            else:
                if buf:
                    chunks.append(buf)
                buf = part
        if buf:
            chunks.append(buf)
        return chunks or [text]

    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += max(chunk_size - overlap, 1)
    return chunks or [text]


@register_node
class TextSplitterNode(BaseNode):
    description = NodeDescription(
        display_name="Text Splitter",
        name="text_splitter",
        category="Data Shaping",
        icon="scissors",
        color="#f59e0b",
        description="Split long text into overlapping chunks for embeddings and RAG.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Text Field", "textField", "string", default="text"),
            NodeProperty("Method", "method", "options", default="character", options=[
                NodePropertyOption("By character count", "character"),
                NodePropertyOption("By separator", "separator"),
            ]),
            NodeProperty("Chunk Size", "chunkSize", "number", default=1000, type_options={"minValue": 100, "maxValue": 10000}),
            NodeProperty("Chunk Overlap", "chunkOverlap", "number", default=200),
            NodeProperty("Separator", "separator", "string", default="\\n\\n", display_options={"show": {"method": ["separator"]}}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        payload = context.get("json") or {}
        text = str(payload.get(parameters.get("textField", "text"), ""))
        sep = parameters.get("separator", "\n\n") if parameters.get("method") == "separator" else None
        if sep == "\\n\\n":
            sep = "\n\n"
        chunks = _chunk_text(text, int(parameters.get("chunkSize", 1000)), int(parameters.get("chunkOverlap", 200)), sep)
        return {"chunks": chunks, "chunk_count": len(chunks)}


@register_node
class DocumentLoaderNode(BaseNode):
    description = NodeDescription(
        display_name="Document Loader",
        name="document_loader",
        category="Data Shaping",
        icon="file-text",
        color="#f59e0b",
        description="Load text or file content into the workflow payload for downstream steps.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Source Type", "sourceType", "options", default="text", options=[
                NodePropertyOption("Inline text", "text"),
                NodePropertyOption("File path", "file"),
                NodePropertyOption("URL", "url"),
            ]),
            NodeProperty("Text / Path / URL", "source", "string", default="{{ $json.document }}", type_options={"rows": 3}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        payload = context.get("json") or {}
        source_type = parameters.get("sourceType", "text")
        source = parameters.get("source") or payload.get("document", "")
        content = ""
        if source_type == "file":
            path = Path(str(source))
            content = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
        elif source_type == "url":
            import httpx
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(str(source))
                resp.raise_for_status()
                content = resp.text[:500_000]
        else:
            content = str(source)
        return {"content": content, "length": len(content)}
