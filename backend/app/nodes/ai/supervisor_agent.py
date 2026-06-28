"""Supervisor agent — routes work across multiple agent cores."""

from __future__ import annotations

import json
from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty
from app.engine.node_registry import register_node
from app.services.llm_service import LLMService


@register_node
class SupervisorAgentNode(BaseNode):
    description = NodeDescription(
        display_name="Supervisor Agent",
        name="supervisor_agent",
        category="AI Agents",
        icon="bot",
        color="#6366f1",
        description="Orchestrate sub-agents and pick the best response",
        inputs=["main", "ai_languageModel"],
        outputs=["main"],
        properties=[
            NodeProperty("Supervisor Prompt", "supervisorPrompt", "string",
                         default="You coordinate specialist agents. Route the user request and synthesize a final answer.",
                         type_options={"rows": 4}),
            NodeProperty("Agents (JSON)", "agents", "json",
                         default='[{"name":"researcher","role":"find facts"},{"name":"writer","role":"draft response"}]',
                         type_options={"rows": 5}),
            NodeProperty("User Message", "userMessage", "string", default="{{ $json.message }}"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        model_cfg = context.get("ai_language_model")
        if isinstance(model_cfg, dict) and "model" in model_cfg:
            model_cfg = model_cfg["model"]
        if not model_cfg:
            raise ValueError("Supervisor Agent requires a Chat Model")

        user_msg = parameters.get("userMessage") or context.get("json", {}).get("message", "")
        agents_raw = parameters.get("agents", "[]")
        if isinstance(agents_raw, str):
            try:
                agents = json.loads(agents_raw)
            except json.JSONDecodeError:
                agents = []
        else:
            agents = agents_raw

        system = parameters.get("supervisorPrompt", "")
        roster = json.dumps(agents, indent=2)
        messages = [
            {"role": "system", "content": f"{system}\n\nAvailable agents:\n{roster}"},
            {"role": "user", "content": str(user_msg)},
        ]
        result = await LLMService.chat(model_cfg, messages)
        return {"response": result["content"], "agents": agents, "usage": result.get("usage", {})}
