from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class CodeNode(BaseNode):
    description = NodeDescription(
        display_name="Code",
        name="code_node",
        category="Logic",
        icon="code",
        color="#64748b",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Python Code", "code", "code", default="return items[0] if items else {}"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        code = parameters.get("code", "return items[0] if items else {}")
        items = [context.get("json", {})]
        safe_globals = {"__builtins__": {"len": len, "str": str, "int": int, "float": float, "bool": bool, "list": list, "dict": dict}}
        local_vars: dict[str, Any] = {"items": items}
        exec(compile(code, "<node>", "exec"), safe_globals, local_vars)  # noqa: S102
        if "result" in local_vars:
            return local_vars["result"] if isinstance(local_vars["result"], dict) else {"result": local_vars["result"]}
        return context.get("json", {})
