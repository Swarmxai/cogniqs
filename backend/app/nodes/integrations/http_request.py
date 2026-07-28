from typing import Any

import httpx

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class HTTPRequestNode(BaseNode):
    description = NodeDescription(
        display_name="HTTP Request",
        name="http_request",
        category="Integrations",
        icon="globe",
        color="#f97316",
        description="Call any HTTP/REST endpoint and pass the response downstream.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Method", "method", "string", default="GET"),
            NodeProperty("URL", "url", "string", default="https://httpbin.org/get"),
            NodeProperty("Headers JSON", "headers", "json", default="{}"),
            NodeProperty("Body", "body", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        import json
        method = parameters.get("method", "GET").upper()
        url = parameters.get("url", "")
        headers = parameters.get("headers", "{}")
        if isinstance(headers, str):
            headers = json.loads(headers)
        body = parameters.get("body", "")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(method, url, headers=headers, content=body or None)
        return {
            "statusCode": resp.status_code,
            "headers": dict(resp.headers),
            "body": resp.text,
        }
