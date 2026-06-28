"""Vector store admin API — list, ingest, search ChromaDB collections."""

from __future__ import annotations

import re
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel, Field

from app.config import settings
from app.core.deps import CurrentUser
from app.core.errors import ApplicationError, NotFoundError
from app.services.vector_store import get_chroma_client, get_or_create_collection

router = APIRouter(prefix="/vectors", tags=["vectors"])


class CreateCollectionBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class IngestBody(BaseModel):
    texts: list[str] = Field(min_length=1)
    chunk_size: int = Field(default=800, ge=100, le=4000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchBody(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


def _client():
    try:
        return get_chroma_client()
    except Exception:
        return None


def _display_name(col) -> str:
    meta = col.metadata or {}
    return meta.get("display_name") or col.name


def _chunk_text(text: str, chunk_size: int) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            break_at = text.rfind("\n", start, end)
            if break_at > start + chunk_size // 2:
                end = break_at + 1
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]


@router.get("")
async def list_collections(user: CurrentUser) -> list[dict]:
    client = _client()
    if not client:
        return []
    return [{"name": _display_name(c), "count": c.count(), "id": c.name} for c in client.list_collections()]


@router.post("")
async def create_collection(body: CreateCollectionBody, user: CurrentUser) -> dict:
    col = get_or_create_collection(body.name)
    return {"name": body.name, "count": col.count(), "id": col.name}


@router.get("/{collection_name}")
async def get_collection(collection_name: str, user: CurrentUser, limit: int = 20) -> dict:
    client = _client()
    if not client:
        raise NotFoundError("Vector store not available")
    col = _resolve_collection(client, collection_name)
    data = col.peek(limit=limit)
    return {
        "name": _display_name(col),
        "count": col.count(),
        "documents": data.get("documents", []),
        "ids": data.get("ids", []),
    }


@router.post("/{collection_name}/ingest-file")
async def ingest_file(collection_name: str, user: CurrentUser, file: UploadFile = File(...)) -> dict:
    client = _client()
    if not client:
        err = ApplicationError("Vector store not available")
        err.status_code = 503
        raise err

    raw = await file.read()
    name = (file.filename or "").lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader
        import io as _io
        reader = PdfReader(_io.BytesIO(raw))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = raw.decode("utf-8", errors="replace")

    body = IngestBody(texts=[text], chunk_size=800)
    return await ingest_documents(collection_name, body, user)


@router.post("/{collection_name}/ingest")
async def ingest_documents(collection_name: str, body: IngestBody, user: CurrentUser) -> dict:
    client = _client()
    if not client:
        err = ApplicationError("Vector store not available")
        err.status_code = 503
        raise err

    chunks: list[str] = []
    for text in body.texts:
        chunks.extend(_chunk_text(text, body.chunk_size))
    if not chunks:
        raise ApplicationError("No text to ingest")

    col = get_or_create_collection(collection_name)
    ids = [f"ing_{uuid.uuid4().hex[:12]}" for _ in chunks]
    metas = [{**body.metadata, "source": "knowledge_studio"} for _ in chunks]
    col.add(documents=chunks, ids=ids, metadatas=metas)
    return {"ingested": len(chunks), "total": col.count(), "name": collection_name}


@router.post("/{collection_name}/search")
async def search_collection(collection_name: str, body: SearchBody, user: CurrentUser) -> dict:
    client = _client()
    if not client:
        err = ApplicationError("Vector store not available")
        err.status_code = 503
        raise err

    col = get_or_create_collection(collection_name)
    if col.count() == 0:
        return {"results": [], "query": body.query}

    results = col.query(query_texts=[body.query], n_results=min(body.top_k, col.count()))
    hits = []
    docs = results.get("documents", [[]])[0]
    dists = results.get("distances", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    for i, doc in enumerate(docs):
        hits.append({
            "content": doc,
            "distance": dists[i] if i < len(dists) else None,
            "metadata": metas[i] if i < len(metas) else {},
            "score": round(max(0, 1 - (dists[i] if i < len(dists) else 1)), 3),
        })
    return {"results": hits, "query": body.query}


@router.delete("/{collection_name}")
async def delete_collection(collection_name: str, user: CurrentUser) -> dict:
    client = _client()
    if not client:
        raise NotFoundError("Vector store not available")
    col = _resolve_collection(client, collection_name)
    client.delete_collection(col.name)
    return {"deleted": True}


def _resolve_collection(client, name: str):
    safe = re.sub(r"[^a-zA-Z0-9_-]", "_", name)[:64]
    hashed = get_or_create_collection(name).name
    try:
        return client.get_collection(hashed)
    except Exception:
        pass
    for c in client.list_collections():
        if _display_name(c) == name or c.name == name or c.name == safe:
            return c
    raise NotFoundError("Collection not found")
