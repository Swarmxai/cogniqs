"""NLP nodes powered by connected LLMs."""

from __future__ import annotations

import json
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService


async def _llm_json(model_cfg: dict, system: str, user: str) -> dict:
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    result = await LLMService.chat(model_cfg, messages)
    text = result.get("content", "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}


@register_node
class InformationExtractorNode(BaseNode):
    description = NodeDescription(
        display_name="Information Extractor",
        name="information_extractor",
        category="NLP",
        icon="scissors",
        color="#f97316",
        description="Use a chat model to extract structured fields from free-form text.",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Input Text", "inputText", "string", default="{{ $json.text }}", type_options={"rows": 4}),
            NodeProperty("Schema Hint", "schemaHint", "string", default='{"name":"","email":"","company":""}', type_options={"rows": 3}),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Information Extractor requires a Chat Model")
        text = parameters.get("inputText") or str(context.get("json", {}).get("text", ""))
        hint = parameters.get("schemaHint", "{}")
        data = await _llm_json(model_cfg, f"Extract structured JSON matching schema: {hint}", text)
        return {"extracted": data}


@register_node
class TextClassifierNode(BaseNode):
    description = NodeDescription(
        display_name="Text Classifier",
        name="text_classifier",
        category="NLP",
        icon="filter",
        color="#f97316",
        description="Classify text into one of the provided labels using a chat model.",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Input Text", "inputText", "string", default="{{ $json.text }}"),
            NodeProperty("Categories", "categories", "string", default="positive, negative, neutral"),
            NodeProperty(
                "Mode",
                "mode",
                "options",
                default="single",
                options=[NodePropertyOption("Single label", "single"), NodePropertyOption("Multi label", "multi")],
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Text Classifier requires a Chat Model")
        text = parameters.get("inputText") or str(context.get("json", {}).get("text", ""))
        cats = parameters.get("categories", "")
        data = await _llm_json(
            model_cfg,
            f"Classify text into categories [{cats}]. Return JSON with label and confidence.",
            text,
        )
        return {"classification": data}


@register_node
class SentimentAnalysisNode(BaseNode):
    description = NodeDescription(
        display_name="Sentiment Analysis",
        name="sentiment_analysis",
        category="NLP",
        icon="activity",
        color="#f97316",
        description="Classify text sentiment as positive, negative, or neutral via an LLM.",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Input Text", "inputText", "string", default="{{ $json.text }}"),
            NodeProperty("Granularity", "granularity", "options", default="document", options=[
                NodePropertyOption("Document", "document"),
                NodePropertyOption("Sentence", "sentence"),
            ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Sentiment Analysis requires a Chat Model")
        text = parameters.get("inputText") or str(context.get("json", {}).get("text", ""))
        data = await _llm_json(
            model_cfg,
            'Return JSON {"sentiment":"positive|negative|neutral","score":0-1}',
            text,
        )
        return {"sentiment": data}
