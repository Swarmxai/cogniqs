from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService


@register_node
class BasicLLMChainNode(BaseNode):
    description = NodeDescription(
        display_name="Basic LLM Chain",
        name="basic_llm_chain",
        category="AI Chains",
        icon="link",
        color="#6366f1",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty(
                "Prompt Template",
                "prompt",
                "string",
                default="{{ $json.message }}",
                description="User message or expression.",
                type_options={"rows": 4},
            ),
            NodeProperty(
                "System Message",
                "systemMessage",
                "string",
                default="",
                description="Optional system instructions.",
                type_options={"rows": 3},
            ),
            NodeProperty(
                "Temperature Override",
                "temperature",
                "number",
                default=0,
                description="0 = use model default.",
                type_options={"minValue": 0, "maxValue": 2, "step": 0.1},
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Basic LLM Chain requires a Chat Model connection")

        prompt = parameters.get("prompt") or str(context.get("json", {}))
        messages = []
        system = parameters.get("systemMessage", "")
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        result = await LLMService.chat(model_cfg, messages)
        return {"response": result["content"], "usage": result.get("usage", {})}
