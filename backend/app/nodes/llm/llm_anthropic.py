from typing import Any

from app.config import settings
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class AnthropicNode(BaseNode):
    description = NodeDescription(
        display_name="Anthropic",
        name="llm_anthropic",
        category="Chat Models",
        icon="brain",
        color="#cc785c",
        description="Claude models by Anthropic",
        inputs=[],
        outputs=["ai_languageModel"],
        is_ai_subnode=True,
        ai_output_type="ai_languageModel",
        properties=[
            NodeProperty("Model", "model", "options", default="claude-3-5-sonnet-20241022", options=[
                NodePropertyOption("Claude 3.5 Sonnet", "claude-3-5-sonnet-20241022"),
                NodePropertyOption("Claude 3 Haiku", "claude-3-haiku-20240307"),
            ]),
            NodeProperty("Temperature", "temperature", "number", default=0.7),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {"model": {
            "provider": "anthropic",
            "model": parameters.get("model", "claude-3-5-sonnet-20241022"),
            "temperature": float(parameters.get("temperature", 0.7)),
            "apiKey": settings.ANTHROPIC_API_KEY,
        }}
