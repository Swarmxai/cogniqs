from typing import Any

import httpx

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class HTTPToolNode(BaseNode):
    description = NodeDescription(
        display_name="HTTP Tool",
        name="http_tool",
        category="Tools",
        icon="globe",
        color="#f59e0b",
        inputs=[],
        outputs=["ai_tool"],
        is_ai_subnode=True,
        ai_output_type="ai_tool",
        properties=[
            NodeProperty("Tool Name", "toolName", "string", required=True),
            NodeProperty("Description", "description", "string", default="Make HTTP requests"),
            NodeProperty("URL Template", "urlTemplate", "string", default="https://api.example.com"),
            NodeProperty("Method", "method", "string", default="GET"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        name = parameters.get("toolName", "http_request")
        url = parameters.get("urlTemplate", "")
        method = parameters.get("method", "GET").upper()

        async def handler(args: dict) -> dict:
            target_url = args.get("url", url)
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.request(method, target_url, params=args.get("params"))
                return {"status": resp.status_code, "body": resp.text[:5000]}

        schema = {
            "type": "function",
            "function": {
                "name": name,
                "description": parameters.get("description", "Make HTTP requests"),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "Request URL"},
                        "params": {"type": "object", "description": "Query parameters"},
                    },
                },
            },
        }
        return {"tool": {"name": name, "schema": schema, "handler": handler}}
