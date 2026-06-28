from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    project_id: int | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    connections: list[dict[str, Any]] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[dict[str, Any]] | None = None
    connections: list[dict[str, Any]] | None = None
    active: bool | None = None
    project_id: int | None = None


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: str
    nodes: list[dict[str, Any]]
    connections: list[dict[str, Any]]
    active: bool
    owner_id: int
    project_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExecuteRequest(BaseModel):
    trigger_data: dict[str, Any] = Field(default_factory=dict)


class ExecuteNodeRequest(BaseModel):
    node_id: str
    trigger_data: dict[str, Any] = Field(default_factory=dict)


class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    trigger_data: dict[str, Any]
    result: dict[str, Any]
    error: str | None
    started_at: datetime
    finished_at: datetime | None

    model_config = {"from_attributes": True}
