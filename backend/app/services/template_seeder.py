"""Seed built-in workflow templates."""

from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow_template import WorkflowTemplate

TEMPLATES = [
    {
        "name": "Chat AI Agent",
        "description": "Conversational agent with OpenAI and memory buffer",
        "category": "AI Agents",
        "tags": "chat,agent,openai",
        "icon": "bot",
        "featured": True,
        "nodes": [
            {"id": "t1", "type": "chat_trigger", "position": {"x": 80, "y": 180}, "data": {"type": "chat_trigger", "parameters": {}}},
            {"id": "a1", "type": "ai_agent", "position": {"x": 380, "y": 180}, "data": {"type": "ai_agent", "parameters": {"systemPrompt": "You are a helpful assistant."}}},
            {"id": "llm1", "type": "llm_openai", "position": {"x": 300, "y": 410}, "data": {"type": "llm_openai", "parameters": {"model": "gpt-4o-mini"}}},
            {"id": "mem1", "type": "memory_buffer", "position": {"x": 470, "y": 410}, "data": {"type": "memory_buffer", "parameters": {}}},
        ],
        "connections": [
            {"source": "t1", "target": "a1", "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": "llm1", "target": "a1", "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
            {"source": "mem1", "target": "a1", "sourceHandle": "ai_memory-out", "targetHandle": "ai_memory-in"},
        ],
    },
    {
        "name": "RAG Document Q&A",
        "description": "Ingest documents and answer questions with retrieval",
        "category": "RAG",
        "tags": "rag,document,qa",
        "icon": "search",
        "featured": True,
        "nodes": [
            {"id": "t1", "type": "manual_trigger", "position": {"x": 80, "y": 100}, "data": {"type": "manual_trigger", "parameters": {}}},
            {"id": "llm1", "type": "llm_openai", "position": {"x": 80, "y": 220}, "data": {"type": "llm_openai", "parameters": {}}},
            {"id": "ing1", "type": "document_ingest", "position": {"x": 320, "y": 80}, "data": {"type": "document_ingest", "parameters": {"collectionName": "docs"}}},
            {"id": "rag1", "type": "rag_document_qa", "position": {"x": 320, "y": 200}, "data": {"type": "rag_document_qa", "parameters": {"collectionName": "docs"}}},
        ],
        "connections": [
            {"source": "t1", "target": "ing1", "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": "ing1", "target": "rag1", "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": "llm1", "target": "rag1", "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
        ],
    },
    {
        "name": "Basic LLM Chain",
        "description": "Simple prompt → LLM → response pipeline",
        "category": "AI Chains",
        "tags": "llm,chain,simple",
        "icon": "link",
        "featured": False,
        "nodes": [
            {"id": "t1", "type": "manual_trigger", "position": {"x": 100, "y": 100}, "data": {"type": "manual_trigger", "parameters": {}}},
            {"id": "llm1", "type": "llm_openai", "position": {"x": 100, "y": 220}, "data": {"type": "llm_openai", "parameters": {}}},
            {"id": "c1", "type": "basic_llm_chain", "position": {"x": 340, "y": 100}, "data": {"type": "basic_llm_chain", "parameters": {"prompt": "{{ $json.message }}"}}},
        ],
        "connections": [
            {"source": "t1", "target": "c1", "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": "llm1", "target": "c1", "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
        ],
    },
    {
        "name": "Webhook + HTTP",
        "description": "Receive webhook and forward to external API",
        "category": "Integrations",
        "tags": "webhook,http,integration",
        "icon": "globe",
        "featured": False,
        "nodes": [
            {"id": "t1", "type": "webhook_trigger", "position": {"x": 100, "y": 100}, "data": {"type": "webhook_trigger", "parameters": {}}},
            {"id": "h1", "type": "http_request", "position": {"x": 340, "y": 100}, "data": {"type": "http_request", "parameters": {"method": "POST", "url": "https://httpbin.org/post"}}},
        ],
        "connections": [
            {"source": "t1", "target": "h1", "sourceHandle": "main-out", "targetHandle": "main-in"},
        ],
    },
]


async def seed_templates(db: AsyncSession) -> None:
    result = await db.execute(select(WorkflowTemplate).limit(1))
    if result.scalar_one_or_none():
        return
    for tpl in TEMPLATES:
        db.add(WorkflowTemplate(
            name=tpl["name"],
            description=tpl["description"],
            category=tpl["category"],
            tags=tpl["tags"],
            icon=tpl["icon"],
            featured=tpl.get("featured", False),
            nodes=json.dumps(tpl["nodes"]),
            connections=json.dumps(tpl["connections"]),
        ))
