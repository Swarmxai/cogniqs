from fastapi import APIRouter

from app.engine.node_registry import get_all_node_descriptions, get_node_categories

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("")
async def list_nodes() -> dict:
    return {
        "nodes": get_all_node_descriptions(),
        "categories": get_node_categories(),
        "count": len(get_all_node_descriptions()),
    }
