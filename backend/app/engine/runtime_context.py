"""Runtime context for workflow execution."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class NodeRunData:
    node_id: str
    node_type: str
    status: str = "pending"
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int = 0
    input_data: dict[str, Any] = field(default_factory=dict)
    output_data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def mark_started(self) -> None:
        self.status = "running"
        self.started_at = datetime.now(timezone.utc)

    def mark_success(self, output: dict[str, Any]) -> None:
        self.status = "success"
        self.output_data = output
        self.finished_at = datetime.now(timezone.utc)
        if self.started_at:
            self.duration_ms = int((self.finished_at - self.started_at).total_seconds() * 1000)

    def mark_error(self, error: str) -> None:
        self.status = "error"
        self.error = error
        self.finished_at = datetime.now(timezone.utc)
        if self.started_at:
            self.duration_ms = int((self.finished_at - self.started_at).total_seconds() * 1000)

    def mark_skipped(self) -> None:
        self.status = "skipped"
        self.finished_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict[str, Any]:
        return {
            "nodeId": self.node_id,
            "nodeType": self.node_type,
            "status": self.status,
            "durationMs": self.duration_ms,
            "inputData": self.input_data,
            "outputData": self.output_data,
            "error": self.error,
        }


@dataclass
class RuntimeContext:
    json: dict[str, Any] = field(default_factory=dict)
    node_outputs: dict[str, dict[str, Any]] = field(default_factory=dict)
    credentials: dict[str, dict[str, Any]] = field(default_factory=dict)
    env: dict[str, str] = field(default_factory=dict)
    ai_language_model: Any = None
    ai_memory: Any = None
    ai_tools: list[Any] = field(default_factory=list)
    ai_embeddings: Any = None
    execution_id: int | None = None
    workflow_id: int | None = None
    user_id: int | None = None
    cancelled: bool = False
    node_run_data: dict[str, NodeRunData] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "json": self.json,
            "node_outputs": self.node_outputs,
            "credentials": self.credentials,
            "env": self.env,
            "ai_language_model": self.ai_language_model,
            "ai_memory": self.ai_memory,
            "ai_tools": self.ai_tools,
            "ai_embeddings": self.ai_embeddings,
            "execution_id": self.execution_id,
            "workflow_id": self.workflow_id,
            "user_id": self.user_id,
        }

    def set_node_output(self, node_id: str, output: dict[str, Any]) -> None:
        self.node_outputs[node_id] = output
        self.json = output

    def reset_ai_bindings(self) -> None:
        self.ai_language_model = None
        self.ai_memory = None
        self.ai_tools = []
        self.ai_embeddings = None
