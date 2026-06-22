"""Vector store admin API — list/inspect/delete ChromaDB collections."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.config import settings
from app.core.deps import CurrentUser
from app.core.errors import NotFoundError

router = APIRouter(prefix="/vectors", tags=["vectors"])


def _client():
    try:
        import chromadb
    except ImportError:
        return None
    return chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)


@router.get("")
async def list_collections(user: CurrentUser) -> list[dict]:
    client = _client()
    if not client:
        return []
    collections = client.list_collections()
    return [{"name": c.name, "count": c.count()} for c in collections]


@router.get("/{collection_name}")
async def get_collection(collection_name: str, user: CurrentUser, limit: int = 20) -> dict:
    client = _client()
    if not client:
        raise NotFoundError("Vector store not available")
    try:
        col = client.get_collection(collection_name)
    except Exception as exc:
        raise NotFoundError("Collection not found") from exc
    data = col.peek(limit=limit)
    return {
        "name": collection_name,
        "count": col.count(),
        "documents": data.get("documents", []),
        "ids": data.get("ids", []),
    }


@router.delete("/{collection_name}")
async def delete_collection(collection_name: str, user: CurrentUser) -> dict:
    client = _client()
    if not client:
        raise NotFoundError("Vector store not available")
    client.delete_collection(collection_name)
    return {"deleted": True}
