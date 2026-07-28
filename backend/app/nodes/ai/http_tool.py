from typing import Any

import httpx

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class HTTPToolNode(BaseNode):
    description = NodeDescription(
        display_name="HTTP Tool",
        name="http_tool",
        category="Tools",
        icon="globe",
        color="#f59e0b",
        description="Expose an HTTP request as a callable tool for AI agents.",
        inputs=[],
        outputs=["ai_tool"],
        is_ai_subnode=True,
        ai_output_type="ai_tool",
        properties=[
            NodeProperty("Tool Name", "toolName", "string", required=True, default="http_request"),
            NodeProperty(
                "Description",
                "description",
                "string",
                default="Make HTTP requests to external APIs",
                type_options={"rows": 2},
            ),
            NodeProperty("URL", "urlTemplate", "string", default="https://api.example.com", required=True),
            NodeProperty("Method", "method", "options", default="GET", options=[
                NodePropertyOption("GET", "GET"),
                NodePropertyOption("POST", "POST"),
                NodePropertyOption("PUT", "PUT"),
                NodePropertyOption("PATCH", "PATCH"),
                NodePropertyOption("DELETE", "DELETE"),
            ]),
            NodeProperty(
                "Headers (JSON)",
                "headers",
                "json",
                default="{}",
                description='Optional headers object, e.g. {"Authorization": "Bearer ..."}',
            ),
            NodeProperty(
                "Timeout (seconds)",
                "timeout",
                "number",
                default=30,
                type_options={"minValue": 1, "maxValue": 300},
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        import json

        name = parameters.get("toolName", "http_request")
        url = parameters.get("urlTemplate", "")
        method = parameters.get("method", "GET").upper()
        timeout = float(parameters.get("timeout", 30))
        headers = parameters.get("headers", "{}")
        if isinstance(headers, str):
            try:
                headers = json.loads(headers or "{}")
            except json.JSONDecodeError:
                headers = {}

        async def handler(args: dict) -> dict:
            target_url = args.get("url", url)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.request(
                    method,
                    target_url,
                    params=args.get("params"),
                    headers=headers,
                    json=args.get("body"),
                )
                return {"status": resp.status_code, "body": resp.text[:5000]}

        schema = {
            "type": "function",
            "function": {
                "name": name,
                "description": parameters.get("description", "Make HTTP requests"),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "Request URL override"},
                        "params": {"type": "object", "description": "Query parameters"},
                        "body": {"type": "object", "description": "JSON request body"},
                    },
                },
            },
        }
        return {"tool": {"name": name, "schema": schema, "handler": handler}}
