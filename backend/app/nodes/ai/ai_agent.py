import json
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService


@register_node
class AIAgentNode(BaseNode):
    description = NodeDescription(
        display_name="AI Agent",
        name="ai_agent",
        category="AI Agents",
        icon="bot",
        color="#8b5cf6",
        description="Autonomous agent with LLM, tools, and memory",
        inputs=["main", "ai_languageModel", "ai_tool", "ai_memory"],
        outputs=["main"],
        properties=[
            NodeProperty(
                "System Prompt",
                "systemPrompt",
                "string",
                default="You are a helpful AI assistant.",
                description="Instructions that define agent behavior.",
                type_options={"rows": 5},
            ),
            NodeProperty(
                "User Message",
                "userMessage",
                "string",
                default="{{ $json.message }}",
                description="Expression or static text for the user turn.",
                type_options={"rows": 3},
            ),
            NodeProperty(
                "Max Iterations",
                "maxIterations",
                "number",
                default=10,
                description="Maximum tool-calling loops before stopping.",
                type_options={"minValue": 1, "maxValue": 50},
            ),
            NodeProperty(
                "Return Intermediate Steps",
                "returnIntermediateSteps",
                "boolean",
                default=False,
                description="Include tool call trace in the output.",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("AI Agent requires a Chat Model connection")

        system = parameters.get("systemPrompt", "You are a helpful AI assistant.")
        user_msg = parameters.get("userMessage") or context.get("json", {}).get("message", "")
        if not user_msg:
            user_msg = json.dumps(context.get("json", {}))

        messages: list[dict[str, str]] = [{"role": "system", "content": system}]
        memory = context.get("ai_memory")
        if memory and isinstance(memory, dict):
            history_fn = memory.get("get_history")
            if callable(history_fn):
                messages.extend(history_fn())
        messages.append({"role": "user", "content": str(user_msg)})

        tools = context.get("ai_tools") or []
        openai_tools = []
        for t in tools:
            if isinstance(t, dict) and t.get("schema"):
                openai_tools.append(t["schema"])

        max_iter = int(parameters.get("maxIterations", 10))
        final_content = ""
        last_result: dict[str, Any] = {}
        steps: list[dict[str, Any]] = []

        for _ in range(max_iter):
            last_result = await LLMService.chat(model_cfg, messages, tools=openai_tools or None)
            content = last_result.get("content", "")
            tool_calls = last_result.get("tool_calls")

            if not tool_calls:
                final_content = content
                break

            messages.append({"role": "assistant", "content": content or "", "tool_calls": tool_calls})
            for tc in tool_calls:
                fn = tc.get("function", {})
                tool_name = fn.get("name", "")
                tool_args = json.loads(fn.get("arguments", "{}"))
                tool_result = await _run_tool(tools, tool_name, tool_args)
                steps.append({"tool": tool_name, "args": tool_args, "result": tool_result})
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.get("id", ""),
                    "content": json.dumps(tool_result),
                })
        else:
            final_content = messages[-1].get("content", "") if messages else ""

        session_id = context.get("json", {}).get("session_id")
        if memory and isinstance(memory, dict) and session_id:
            add_fn = memory.get("add_message")
            if callable(add_fn):
                add_fn("user", str(user_msg))
                add_fn("assistant", final_content)

        out: dict[str, Any] = {
            "response": final_content,
            "message": final_content,
            "usage": last_result.get("usage", {}),
        }
        if parameters.get("returnIntermediateSteps"):
            out["steps"] = steps
        return out


async def _run_tool(tools: list, name: str, args: dict) -> Any:
    for t in tools:
        if isinstance(t, dict) and t.get("name") == name:
            handler = t.get("handler")
            if callable(handler):
                return await handler(args)
    return {"error": f"Tool '{name}' not found"}
