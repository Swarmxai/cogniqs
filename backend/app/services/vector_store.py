"""ChromaDB vector store wrapper."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

import chromadb

from app.config import settings

logger = logging.getLogger(__name__)

_client: chromadb.Client | None = None


def get_chroma_client() -> chromadb.Client:
    global _client
    if _client is None:
        persist_dir = Path(settings.CHROMA_PERSIST_DIR)
        persist_dir.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(persist_dir))
    return _client


def get_or_create_collection(name: str) -> Any:
    client = get_chroma_client()
    safe_name = hashlib.md5(name.encode()).hexdigest()[:16]
    return client.get_or_create_collection(name=f"cq_{safe_name}", metadata={"display_name": name})


def upsert_documents(
    collection_name: str,
    documents: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict] | None = None,
    ids: list[str] | None = None,
) -> int:
    collection = get_or_create_collection(collection_name)
    if ids is None:
        # Content-hash ids so re-ingests are stable and don't collide across runs
        ids = [f"doc_{hashlib.md5(d.encode()).hexdigest()[:12]}" for d in documents]
    # Chroma rejects empty metadata dicts — always include at least one key
    if metadatas is None:
        metadatas = [{"source": "cogniqs", "index": i} for i in range(len(documents))]
    else:
        metadatas = [
            (m if m else {"source": "cogniqs", "index": i})
            for i, m in enumerate(metadatas)
        ]
    collection.upsert(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
    return len(documents)


def query_collection(
    collection_name: str,
    query_embedding: list[float],
    n_results: int = 5,
) -> list[dict[str, Any]]:
    collection = get_or_create_collection(collection_name)
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    docs = []
    for i, doc in enumerate(results.get("documents", [[]])[0]):
        docs.append({
            "content": doc,
            "metadata": results.get("metadatas", [[]])[0][i] if results.get("metadatas") else {},
            "distance": results.get("distances", [[]])[0][i] if results.get("distances") else 0,
        })
    return docs
