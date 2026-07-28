"""Additional AI agent tool sub-nodes."""

from __future__ import annotations

import ast
import math
import operator
from typing import Any

import httpx

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node

_SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def _safe_eval(expr: str) -> float:
    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp):
            return _SAFE_OPS[type(node.op)](_eval(node.left), _eval(node.right))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return _SAFE_OPS[ast.USub](_eval(node.operand))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in math.__dict__:
            args = [_eval(a) for a in node.args]
            return math.__dict__[node.func.id](*args)
        raise ValueError("Unsupported expression")

    return float(_eval(ast.parse(expr, mode="eval")))


def _tool_schema(name: str, description: str, props: dict) -> dict:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {"type": "object", "properties": props, "required": list(props.keys())},
        },
    }


@register_node
class ToolCalculatorNode(BaseNode):
    description = NodeDescription(
        display_name="Calculator Tool",
        name="tool_calculator",
        category="Tools",
        icon="calculator",
        color="#f59e0b",
        description="Let agents evaluate arithmetic expressions safely.",
        inputs=[], outputs=["ai_tool"],
        is_ai_subnode=True, ai_output_type="ai_tool",
        properties=[
            NodeProperty("Tool Name", "toolName", "string", default="calculator"),
            NodeProperty("Description", "description", "string", default="Evaluate math expressions", type_options={"rows": 2}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        name = parameters.get("toolName", "calculator")

        async def handler(args: dict) -> dict:
            try:
                result = _safe_eval(str(args.get("expression", "0")))
                return {"result": result}
            except Exception as exc:
                return {"error": str(exc)}

        return {
            "tool": {
                "name": name,
                "schema": _tool_schema(name, parameters.get("description", ""), {
                    "expression": {"type": "string", "description": "Math expression e.g. (2+3)*4"},
                }),
                "handler": handler,
            }
        }


@register_node
class ToolCodeNode(BaseNode):
    description = NodeDescription(
        display_name="Code Tool",
        name="tool_code",
        category="Tools",
        icon="code",
        color="#10b981",
        description="Let agents run short sandboxed Python snippets as a tool.",
        inputs=[], outputs=["ai_tool"],
        is_ai_subnode=True, ai_output_type="ai_tool",
        properties=[
            NodeProperty("Tool Name", "toolName", "string", default="run_code"),
            NodeProperty("Description", "description", "string", default="Run Python code snippets", type_options={"rows": 2}),
            NodeProperty("Default Code", "code", "code", default="result = {'ok': True}", type_options={"rows": 8}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        name = parameters.get("toolName", "run_code")
        default_code = parameters.get("code", "result = {'ok': True}")

        async def handler(args: dict) -> dict:
            code = args.get("code") or default_code
            local_vars: dict[str, Any] = {}
            try:
                exec(code, {"__builtins__": {}}, local_vars)  # noqa: S102
                return {"result": local_vars.get("result", local_vars)}
            except Exception as exc:
                return {"error": str(exc)}

        return {
            "tool": {
                "name": name,
                "schema": _tool_schema(name, parameters.get("description", ""), {
                    "code": {"type": "string", "description": "Python code to execute; set `result` variable"},
                }),
                "handler": handler,
            }
        }


@register_node
class ToolWikipediaNode(BaseNode):
    description = NodeDescription(
        display_name="Wikipedia Tool",
        name="tool_wikipedia",
        category="Tools",
        icon="book-open",
        color="#3b82f6",
        description="Let agents look up Wikipedia summaries for a query.",
        inputs=[], outputs=["ai_tool"],
        is_ai_subnode=True, ai_output_type="ai_tool",
        properties=[
            NodeProperty("Tool Name", "toolName", "string", default="wikipedia"),
            NodeProperty("Description", "description", "string", default="Search Wikipedia for factual information"),
            NodeProperty("Max Results", "maxResults", "number", default=3, type_options={"minValue": 1, "maxValue": 10}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        name = parameters.get("toolName", "wikipedia")
        max_results = int(parameters.get("maxResults", 3))

        async def handler(args: dict) -> dict:
            query = str(args.get("query", "")).strip()
            if not query:
                return {"error": "query required"}
            url = "https://en.wikipedia.org/w/api.php"
            params = {"action": "query", "list": "search", "srsearch": query, "format": "json", "srlimit": max_results}
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            hits = data.get("query", {}).get("search", [])
            return {"results": [{"title": h.get("title"), "snippet": h.get("snippet")} for h in hits]}

        return {
            "tool": {
                "name": name,
                "schema": _tool_schema(name, parameters.get("description", ""), {
                    "query": {"type": "string", "description": "Search query"},
                }),
                "handler": handler,
            }
        }
