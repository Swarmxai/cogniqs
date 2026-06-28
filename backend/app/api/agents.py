"""AI Agents API — CRUD + stateless chat with tools/memory."""

from __future__ import annotations

import json

import secrets

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.agent import Agent
from app.services.llm_service import LLMService
from app.services import session_store

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    system_prompt: str = "You are a helpful assistant."
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    credential_id: int | None = None
    config: dict = Field(default_factory=dict)
    published: bool = False


class AgentChatBody(BaseModel):
    message: str
    session_id: str = "default"


class PublicAgentChatBody(BaseModel):
    message: str
    session_id: str = "default"
    token: str = ""


@router.get("")
async def list_agents(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(Agent).where(Agent.owner_id == user.id).order_by(Agent.created_at.desc())
    )
    return [a.to_dict() for a in result.scalars()]


@router.post("")
async def create_agent(body: AgentBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = Agent(
        name=body.name, description=body.description, system_prompt=body.system_prompt,
        provider=body.provider, model=body.model, credential_id=body.credential_id,
        config=json.dumps(body.config), published=body.published, owner_id=user.id,
    )
    db.add(agent)
    await db.flush()
    return agent.to_dict()


async def _get_owned(db: AsyncSession, agent_id: int, owner_id: int) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.owner_id == owner_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundError("Agent not found")
    return agent


@router.get("/{agent_id}")
async def get_agent(agent_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = await _get_owned(db, agent_id, user.id)
    return agent.to_dict()


@router.put("/{agent_id}")
async def update_agent(agent_id: int, body: AgentBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = await _get_owned(db, agent_id, user.id)
    agent.name = body.name
    agent.description = body.description
    agent.system_prompt = body.system_prompt
    agent.provider = body.provider
    agent.model = body.model
    agent.credential_id = body.credential_id
    agent.config = json.dumps(body.config)
    agent.published = body.published
    await db.flush()
    return agent.to_dict()


@router.delete("/{agent_id}")
async def delete_agent(agent_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = await _get_owned(db, agent_id, user.id)
    await db.delete(agent)
    return {"deleted": True}


@router.post("/{agent_id}/publish")
async def publish_agent(agent_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = await _get_owned(db, agent_id, user.id)
    cfg = json.loads(agent.config or "{}")
    if not cfg.get("publish_token"):
        cfg["publish_token"] = secrets.token_urlsafe(24)
    agent.config = json.dumps(cfg)
    agent.published = True
    await db.flush()
    d = agent.to_dict()
    d["embed_url"] = f"/embed/agents/{agent.id}?token={cfg['publish_token']}"
    return d


@router.post("/public/{agent_id}/chat")
async def public_agent_chat(agent_id: int, body: PublicAgentChatBody, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.published == True))  # noqa: E712
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundError("Agent not found or not published")
    cfg = json.loads(agent.config or "{}")
    if cfg.get("publish_token") != body.token:
        raise NotFoundError("Invalid publish token")
    session_key = f"agent_{agent_id}_{body.session_id}"
    history = await session_store.get_history(session_key)
    messages = [{"role": "system", "content": agent.system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": body.message})
    result_llm = await LLMService.chat({"provider": agent.provider, "model": agent.model}, messages)
    reply = result_llm.get("content", "")
    await session_store.add_message(session_key, "user", body.message)
    await session_store.add_message(session_key, "assistant", reply)
    return {"reply": reply}


@router.post("/{agent_id}/chat")
async def chat_with_agent(agent_id: int, body: AgentChatBody, user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    agent = await _get_owned(db, agent_id, user.id)
    session_key = f"agent_{agent_id}_{body.session_id}"
    history = await session_store.get_history(session_key)

    messages = [{"role": "system", "content": agent.system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": body.message})

    result = await LLMService.chat(
        {"provider": agent.provider, "model": agent.model}, messages
    )
    reply = result.get("content", "")
    await session_store.add_message(session_key, "user", body.message)
    await session_store.add_message(session_key, "assistant", reply)
    return {"reply": reply, "usage": result.get("usage", {})}
