"""LLM output parser sub-nodes."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node


@register_node
class StructuredOutputParserNode(BaseNode):
    description = NodeDescription(
        display_name="Structured Output Parser",
        name="output_parser_structured",
        category="Output Parsers",
        icon="code",
        color="#0ea5e9",
        description="Parse LLM output into structured JSON matching a schema.",
        inputs=[], outputs=["ai_outputParser"],
        is_ai_subnode=True, ai_output_type="ai_outputParser",
        properties=[
            NodeProperty("JSON Schema", "jsonSchema", "json", default='{"type":"object","properties":{"answer":{"type":"string"}}}'),
            NodeProperty("Strict Mode", "strict", "boolean", default=True),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "outputParser": {
                "type": "structured",
                "schema": parameters.get("jsonSchema", "{}"),
                "strict": bool(parameters.get("strict", True)),
            }
        }


@register_node
class ListOutputParserNode(BaseNode):
    description = NodeDescription(
        display_name="List Output Parser",
        name="output_parser_list",
        category="Output Parsers",
        icon="layers",
        color="#0ea5e9",
        description="Parse LLM output into a clean list of items.",
        inputs=[], outputs=["ai_outputParser"],
        is_ai_subnode=True, ai_output_type="ai_outputParser",
        properties=[
            NodeProperty("Item Key", "itemKey", "string", default="items"),
            NodeProperty("Separator", "separator", "string", default=","),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "outputParser": {
                "type": "list",
                "itemKey": parameters.get("itemKey", "items"),
                "separator": parameters.get("separator", ","),
            }
        }
