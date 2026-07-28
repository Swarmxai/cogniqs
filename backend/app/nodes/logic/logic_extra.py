"""Additional logic nodes: Switch, Merge, Wait, NoOp, Stop & Error."""

from __future__ import annotations

import asyncio
from typing import Any

from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node


@register_node
class SwitchNode(BaseNode):
    description = NodeDescription(
        display_name="Switch",
        name="switch_node",
        category="Logic",
        icon="git-branch",
        description="Route items to one of several outputs by comparing a field against configured values",
        color="#64748b",
        inputs=["main"],
        outputs=["main-0", "main-1", "main-2", "main-default"],
        properties=[
            NodeProperty("Field", "field", "string", default=""),
            NodeProperty("Value 0", "value_0", "string", default=""),
            NodeProperty("Value 1", "value_1", "string", default=""),
            NodeProperty("Value 2", "value_2", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        data = context.get("json", {})
        field = parameters.get("field", "")
        actual = str(data.get(field) if field else data)
        for i in range(3):
            if actual == str(parameters.get(f"value_{i}", "\x00none")):
                return {**data, "activeOutput": f"main-{i}"}
        return {**data, "activeOutput": "main-default"}


@register_node
class MergeNode(BaseNode):
    description = NodeDescription(
        display_name="Merge",
        name="merge_node",
        category="Logic",
        icon="git-branch",
        description="Combine the outputs of multiple branches into a single object or an appended list",
        color="#64748b",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Mode", "mode", "options", default="combine",
                         options=[
                             NodePropertyOption("Combine", "combine"),
                             NodePropertyOption("Append", "append"),
                         ]),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        outputs = context.get("node_outputs", {})
        merged: dict[str, Any] = {}
        items: list[Any] = []
        for out in outputs.values():
            if isinstance(out, dict):
                merged.update(out)
                items.append(out)
        if parameters.get("mode") == "append":
            return {"items": items}
        return merged


@register_node
class WaitNode(BaseNode):
    description = NodeDescription(
        display_name="Wait",
        name="wait_node",
        category="Logic",
        icon="clock",
        description="Pause workflow execution for a configurable number of seconds before continuing",
        color="#64748b",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Seconds", "seconds", "number", default=1),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        seconds = min(float(parameters.get("seconds") or 1), 60)
        await asyncio.sleep(seconds)
        return {**context.get("json", {}), "waited": seconds}


@register_node
class NoOpNode(BaseNode):
    description = NodeDescription(
        display_name="No Operation",
        name="noop_node",
        category="Logic",
        icon="box",
        description="Pass data through unchanged, useful as a placeholder or to tidy up connections",
        color="#64748b",
        inputs=["main"],
        outputs=["main"],
        properties=[],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return context.get("json", {})


@register_node
class StopAndErrorNode(BaseNode):
    description = NodeDescription(
        display_name="Stop and Error",
        name="stop_and_error_node",
        category="Logic",
        icon="alert-triangle",
        description="Stop the workflow immediately and fail with a custom error message",
        color="#ef4444",
        inputs=["main"],
        outputs=[],
        properties=[
            NodeProperty("Error Message", "message", "string", default="Workflow stopped"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        raise ValueError(parameters.get("message", "Workflow stopped"))
