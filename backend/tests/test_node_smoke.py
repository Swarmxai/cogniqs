"""Offline smoke tests for every registered node that can run without live APIs."""

from __future__ import annotations

import asyncio

import pytest

import app.nodes  # noqa: F401
from app.engine.node_registry import get_all_node_descriptions, get_node_class

# Nodes that intentionally require live credentials / heavy ML / external services
SKIP = {
    "llm_openai", "llm_anthropic", "llm_gemini", "llm_groq", "llm_mistral",
    "llm_deepseek", "llm_azure", "llm_ollama", "llm_custom_endpoint",
    "embeddings_openai", "embeddings_azure", "embeddings_ollama",
    "email_send", "email_read", "slack_send_message", "telegram_send_message",
    "vision_ocr", "database_query", "http_request", "http_tool",
    "model_training", "model_deployment", "model_inference", "execute_workflow",
    # Require LLM / dataset wiring — validated by their own dedicated tests
    "ai_agent", "supervisor_agent", "basic_llm_chain", "qa_chain",
    "summarization_chain", "information_extractor", "text_classifier",
    "sentiment_analysis", "rag_document_qa", "multimodal_rag_qa",
    "anomaly_detection", "clustering_suite", "data_preprocessing", "dataset_config",
    "dataset_merge", "drift_monitor", "eda_report", "feature_transform",
    "fft_analysis", "market_basket", "model_evaluation",
    "time_series_forecast", "time_series_studio",
    # Intentionally raises
    "stop_and_error_node",
}

DEFAULTS = {
    "manual_trigger": ({}, {"json": {"hello": "world"}}),
    "chat_trigger": ({}, {"json": {"message": "hi"}}),
    "schedule_trigger": ({"cron": "0 * * * *"}, {"json": {}}),
    "webhook_trigger": ({}, {"json": {"body": {"a": 1}}}),
    "api_trigger": ({}, {"json": {}}),
    "error_trigger": ({}, {"json": {"error": "x"}}),
    "slack_trigger": ({}, {"json": {"text": "hi"}}),
    "telegram_trigger": ({}, {"json": {"text": "hi"}}),
    "set_node": ({"fields": '{"x": 1}'}, {"json": {}}),
    "filter_node": ({"field": "a", "operator": "equals", "value": "1"}, {"json": {"items": [{"a": "1"}, {"a": "2"}]}}),
    "limit_node": ({"limit": 1}, {"json": {"items": [1, 2, 3]}}),
    "sort_node": ({"field": "a"}, {"json": {"items": [{"a": 2}, {"a": 1}]}}),
    "remove_duplicates_node": ({"field": "a"}, {"json": {"items": [{"a": 1}, {"a": 1}]}}),
    "aggregate_node": ({}, {"json": {"items": [{"a": 1}]}}),
    "if_node": ({"condition": "true"}, {"json": {}}),
    "switch_node": ({"value": "a", "cases": [{"value": "a"}]}, {"json": {}}),
    "merge_node": ({}, {"json": {}}),
    "noop_node": ({}, {"json": {"keep": True}}),
    "wait_node": ({"seconds": 0}, {"json": {}}),
    "code_node": ({"code": "result = {'ok': True}"}, {"json": {}}),
    "loop_node": ({}, {"json": {"items": [1, 2]}}),
    "human_approval": ({"message": "ok?"}, {"json": {}}),
    "respond_webhook": ({"response": "ok"}, {"json": {}}),
    "tool_calculator": ({"expression": "2+2"}, {"json": {}}),
    "tool_wikipedia": ({"query": "Python"}, {"json": {}}),
    "tool_code": ({"code": "result = 1"}, {"json": {}}),
    "memory_buffer": ({}, {"json": {}}),
    "memory_token_buffer": ({}, {"json": {}}),
    "conversation_memory": ({}, {"json": {}}),
    "output_parser_list": ({}, {"json": {"text": "a,b,c"}}),
    "output_parser_structured": ({"schema": "{}"}, {"json": {}}),
    "vector_store_in_memory": ({}, {"json": {}}),
    "vector_store_chromadb": ({"collection": "test_smoke"}, {"json": {}}),
    "retriever_vector_store": ({}, {"json": {}}),
    "document_loader": ({"text": "hello"}, {"json": {}}),
    "text_splitter": ({"chunk_size": 10}, {"json": {"text": "abcdefghijklmnop"}}),
    "document_ingest": ({"collectionName": "smoke_docs", "documentText": "hello world from smoke test"}, {"json": {}}),
    "multimodal_ingest": ({"collectionName": "smoke_mm"}, {"json": {"text": "caption", "image_url": "https://example.com/a.png"}}),
}


def _offline_nodes():
    names = sorted(d["name"] for d in get_all_node_descriptions())
    return [n for n in names if n not in SKIP]


@pytest.mark.parametrize("name", _offline_nodes())
@pytest.mark.asyncio
async def test_offline_node_executes(name: str):
    cls = get_node_class(name)
    assert cls is not None, f"{name} not registered"

    params, ctx = DEFAULTS.get(name, ({}, {"json": {}}))
    params = dict(params)
    for prop in cls.description.properties:
        if prop.name not in params and prop.default not in (None, ""):
            params[prop.name] = prop.default

    node = cls()
    out = await asyncio.wait_for(node.execute(f"smoke-{name}", params, ctx), timeout=15)
    assert out is not None
    if isinstance(out, dict):
        assert out.get("status") != "error" or not out.get("error"), out.get("error")
