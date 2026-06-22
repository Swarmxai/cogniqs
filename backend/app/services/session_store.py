"""Session store — Redis when available, in-memory fallback."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_redis_client = None
_memory: dict[str, dict[str, Any]] = {}
_streams: dict[str, asyncio.Queue] = {}


async def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await _redis_client.ping()
        logger.info("Redis session store connected")
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable, using in-memory sessions: %s", exc)
        return None


def _key(session_id: str, suffix: str = "history") -> str:
    return f"cogniqs:session:{session_id}:{suffix}"


async def get_history(session_id: str, max_messages: int = 20) -> list[dict[str, str]]:
    r = await _get_redis()
    if r:
        raw = await r.get(_key(session_id))
        if raw:
            return json.loads(raw)[-max_messages:]
        return []
    return _memory.get(session_id, {}).get("history", [])[-max_messages:]


async def add_message(session_id: str, role: str, content: str) -> None:
    history = await get_history(session_id, max_messages=100)
    history.append({"role": role, "content": content})
    r = await _get_redis()
    if r:
        await r.setex(_key(session_id), settings.SESSION_TTL_SECONDS, json.dumps(history))
    else:
        _memory.setdefault(session_id, {})["history"] = history


async def clear_session(session_id: str) -> None:
    r = await _get_redis()
    if r:
        await r.delete(_key(session_id))
    _memory.pop(session_id, None)


def get_stream_queue(session_id: str) -> asyncio.Queue:
    if session_id not in _streams:
        _streams[session_id] = asyncio.Queue()
    return _streams[session_id]


async def push_stream_token(session_id: str, token: str) -> None:
    q = get_stream_queue(session_id)
    await q.put({"type": "token", "content": token})


async def push_stream_done(session_id: str, full_response: str = "") -> None:
    q = get_stream_queue(session_id)
    await q.put({"type": "done", "content": full_response})


async def push_stream_error(session_id: str, error: str) -> None:
    q = get_stream_queue(session_id)
    await q.put({"type": "error", "content": error})


def cleanup_stream(session_id: str) -> None:
    _streams.pop(session_id, None)
