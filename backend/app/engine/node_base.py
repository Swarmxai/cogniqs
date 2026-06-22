"""Node type system — descriptions drive UI and execution."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class NodePropertyOption:
    def __init__(
        self,
        name: str,
        value: str,
        description: str = "",
        *,
        disabled: bool = False,
        meta: dict | None = None,
    ):
        self.name = name
        self.value = value
        self.description = description
        self.disabled = disabled
        self.meta = meta

    def to_dict(self) -> dict:
        d = {"name": self.name, "value": self.value}
        if self.description:
            d["description"] = self.description
        if self.disabled:
            d["disabled"] = True
        if self.meta:
            d["meta"] = self.meta
        return d


class NodeProperty:
    def __init__(
        self,
        display_name: str,
        name: str,
        type: str,  # noqa: A002
        default: Any = "",
        *,
        required: bool = False,
        description: str = "",
        placeholder: str = "",
        options: list[NodePropertyOption] | None = None,
        display_options: dict[str, Any] | None = None,
    ):
        self.display_name = display_name
        self.name = name
        self.type = type
        self.default = default
        self.required = required
        self.description = description
        self.placeholder = placeholder
        self.options = options or []
        self.display_options = display_options

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "displayName": self.display_name,
            "name": self.name,
            "type": self.type,
            "default": self.default,
            "required": self.required,
        }
        if self.description:
            d["description"] = self.description
        if self.placeholder:
            d["placeholder"] = self.placeholder
        if self.options:
            d["options"] = [o.to_dict() for o in self.options]
        if self.display_options:
            d["displayOptions"] = self.display_options
        return d


class NodeDescription:
    """Full node metadata for registry and frontend."""

    def __init__(
        self,
        display_name: str,
        name: str,
        *,
        category: str = "General",
        icon: str = "box",
        description: str = "",
        color: str = "#6366f1",
        inputs: list[str] | None = None,
        outputs: list[str] | None = None,
        properties: list[NodeProperty] | None = None,
        is_ai_subnode: bool = False,
        ai_output_type: str | None = None,
    ):
        self.display_name = display_name
        self.name = name
        self.category = category
        self.icon = icon
        self.description = description
        self.color = color
        self.inputs = inputs or ["main"]
        self.outputs = outputs or ["main"]
        self.properties = properties or []
        self.is_ai_subnode = is_ai_subnode
        self.ai_output_type = ai_output_type

    def to_dict(self) -> dict[str, Any]:
        return {
            "displayName": self.display_name,
            "name": self.name,
            "category": self.category,
            "icon": self.icon,
            "description": self.description,
            "color": self.color,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "properties": [p.to_dict() for p in self.properties],
            "isAiSubnode": self.is_ai_subnode,
            "aiOutputType": self.ai_output_type,
        }


class BaseNode(ABC):
    description: NodeDescription

    @abstractmethod
    async def execute(
        self,
        node_id: str,
        parameters: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the node and return output data."""
