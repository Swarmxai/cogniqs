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
        description="Execute inline Python against the current item payload and return the result.",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Python Code", "code", "code", default="return items[0] if items else {}"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        code = parameters.get("code") or "return items[0] if items else {}"
        items = [context.get("json", {})]
        safe_globals = {
            "__builtins__": {
                "len": len, "str": str, "int": int, "float": float, "bool": bool,
                "list": list, "dict": dict, "locals": locals,
            }
        }
        # Wrap user code in a function so `return` works; fall back to the
        # legacy `result = ...` contract when nothing is returned.
        body = "\n".join("    " + line for line in code.splitlines()) or "    pass"
        wrapped = f"def __user_code(items):\n{body}\n    return locals().get('result')"
        namespace: dict[str, Any] = {}
        exec(compile(wrapped, "<node>", "exec"), safe_globals, namespace)  # noqa: S102
        value = namespace["__user_code"](items)
        if value is None:
            return context.get("json", {})
        return value if isinstance(value, dict) else {"result": value}
