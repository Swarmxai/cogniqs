from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


def _llm_props(default_model: str, models: list[tuple[str, str]]) -> list[NodeProperty]:
    return [
        NodeProperty("Model", "model", "options", default=default_model, options=[
            NodePropertyOption(label, value) for label, value in models
        ]),
        NodeProperty("Temperature", "temperature", "number", default=0.7),
        NodeProperty("Max Tokens", "maxTokens", "number", default=2048),
    ]


@register_node
class OpenAINode(BaseNode):
    description = NodeDescription(
        display_name="OpenAI",
        name="llm_openai",
        category="Chat Models",
        icon="sparkles",
        color="#412991",
        description="OpenAI GPT models",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=_llm_props("gpt-4o-mini", [
            ("GPT-4o Mini", "gpt-4o-mini"),
            ("GPT-4o", "gpt-4o"),
            ("GPT-4 Turbo", "gpt-4-turbo"),
        ]),
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "openai",
            "model": parameters.get("model", "gpt-4o-mini"),
            "temperature": float(parameters.get("temperature", 0.7)),
            "maxTokens": int(parameters.get("maxTokens", 2048)),
            "apiKey": settings.OPENAI_API_KEY,
        }}
