"""In-memory conversation memory with optional persistence hook."""

from __future__ import annotations

from typing import Any


class MemoryStore:
    _sessions: dict[str, list[dict[str, str]]] = {}

    @classmethod
    def get_history(cls, session_id: str, max_messages: int = 20) -> list[dict[str, str]]:
        return cls._sessions.get(session_id, [])[-max_messages:]

    @classmethod
    def add_message(cls, session_id: str, role: str, content: str) -> None:
        cls._sessions.setdefault(session_id, []).append({"role": role, "content": content})

    @classmethod
    def clear(cls, session_id: str) -> None:
        cls._sessions.pop(session_id, None)

    @classmethod
    def to_config(cls, session_id: str, max_messages: int = 20) -> dict[str, Any]:
        return {
            "type": "buffer",
            "session_id": session_id,
            "max_messages": max_messages,
            "get_history": lambda: cls.get_history(session_id, max_messages),
            "add_message": lambda role, content: cls.add_message(session_id, role, content),
        }
