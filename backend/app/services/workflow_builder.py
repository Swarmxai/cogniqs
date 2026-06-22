"""Natural-language workflow builder."""

from __future__ import annotations

import json
import re
from typing import Any

from app.engine.node_registry import get_all_node_descriptions
from app.services.llm_service import LLMService
from app.config import settings


def _uid(prefix: str, n: int) -> str:
    return f"{prefix}_{n}"


def _rule_based_build(description: str) -> dict[str, Any]:
    """Keyword-based fallback when no LLM key is configured."""
    desc = description.lower()
    nodes: list[dict] = []
    connections: list[dict] = []

    trigger = _uid("trigger", 1)
    nodes.append({
        "id": trigger, "type": "chat_trigger" if "chat" in desc else "manual_trigger",
        "position": {"x": 80, "y": 180},
        "data": {"type": "chat_trigger" if "chat" in desc else "manual_trigger", "parameters": {}},
    })

    llm_id = _uid("llm", 1)
    llm_type = "llm_anthropic" if "claude" in desc or "anthropic" in desc else (
        "llm_gemini" if "gemini" in desc else (
            "llm_ollama" if "ollama" in desc or "local" in desc else "llm_openai"
        )
    )
    nodes.append({
        "id": llm_id, "type": llm_type,
        "position": {"x": 300, "y": 410},
        "data": {"type": llm_type, "parameters": {}},
    })

    if "rag" in desc or "document" in desc or "pdf" in desc:
        agent_id = _uid("rag", 1)
        nodes.append({
            "id": agent_id, "type": "rag_document_qa",
            "position": {"x": 380, "y": 180},
            "data": {"type": "rag_document_qa", "parameters": {"collectionName": "docs"}},
        })
        connections.extend([
            {"source": trigger, "target": agent_id, "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": llm_id, "target": agent_id, "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
        ])
        name = "RAG Document Q&A"
    elif "agent" in desc or "tool" in desc:
        mem_id = _uid("mem", 1)
        agent_id = _uid("agent", 1)
        nodes.append({
            "id": mem_id, "type": "memory_buffer",
            "position": {"x": 470, "y": 410},
            "data": {"type": "memory_buffer", "parameters": {}},
        })
        nodes.append({
            "id": agent_id, "type": "ai_agent",
            "position": {"x": 380, "y": 180},
            "data": {"type": "ai_agent", "parameters": {"systemPrompt": "You are a helpful assistant."}},
        })
        connections.extend([
            {"source": trigger, "target": agent_id, "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": llm_id, "target": agent_id, "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
            {"source": mem_id, "target": agent_id, "sourceHandle": "ai_memory-out", "targetHandle": "ai_memory-in"},
        ])
        name = "AI Agent with Memory"
    else:
        chain_id = _uid("chain", 1)
        nodes.append({
            "id": chain_id, "type": "basic_llm_chain",
            "position": {"x": 380, "y": 180},
            "data": {"type": "basic_llm_chain", "parameters": {"prompt": "{{ $json.message }}"}},
        })
        connections.extend([
            {"source": trigger, "target": chain_id, "sourceHandle": "main-out", "targetHandle": "main-in"},
            {"source": llm_id, "target": chain_id, "sourceHandle": "ai_languageModel-out", "targetHandle": "ai_languageModel-in"},
        ])
        name = "Basic LLM Chain"

    return {"name": name, "description": description, "nodes": nodes, "connections": connections}


async def build_workflow_from_text(description: str) -> dict[str, Any]:
    if settings.OPENAI_API_KEY:
        try:
            return await _llm_build(description)
        except Exception:
            pass
    return _rule_based_build(description)


async def _llm_build(description: str) -> dict[str, Any]:
    catalogue = get_all_node_descriptions()
    node_names = [n["name"] for n in catalogue]
    prompt = f"""You are a workflow builder. Given a user description, output ONLY valid JSON with keys:
name, description, nodes (array with id, type, position {{x,y}}, data {{type, parameters}}), connections (array with source, target, sourceHandle, targetHandle).

Available node types: {', '.join(node_names)}

AI sub-nodes use handles like ai_languageModel-out -> ai_languageModel-in.
Main flow uses main-out -> main-in.

User request: {description}"""

    result = await LLMService.chat(
        {"provider": "openai", "model": "gpt-4o-mini", "apiKey": settings.OPENAI_API_KEY},
        [{"role": "user", "content": prompt}],
    )
    text = result.get("content", "")
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return _rule_based_build(description)
    parsed = json.loads(match.group())
    if "nodes" not in parsed:
        return _rule_based_build(description)
    return parsed
