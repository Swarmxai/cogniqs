"""Shared helpers for LLM sub-node configuration and secret resolution."""

from __future__ import annotations

from typing import Any

from app.engine.node_base import NodeProperty, NodePropertyOption


def cred_data(context: dict[str, Any]) -> dict[str, Any]:
    return context.get("credentials") or {}


def pick(*values: Any, default: Any = "") -> Any:
    for value in values:
        if value is not None and value != "":
            return value
    return default


def resolve_api_key(parameters: dict[str, Any], context: dict[str, Any], env_value: str = "") -> str:
    cred = cred_data(context)
    return str(
        pick(
            parameters.get("apiKey"),
            parameters.get("api_key"),
            cred.get("apiKey"),
            cred.get("api_key"),
            cred.get("value"),
            env_value,
            default="",
        )
    )


def temperature_max_props() -> list[NodeProperty]:
    return [
        NodeProperty(
            "Temperature",
            "temperature",
            "number",
            default=0.7,
            description="Sampling temperature (0–2).",
            type_options={"minValue": 0, "maxValue": 2, "step": 0.1},
        ),
        NodeProperty(
            "Max Tokens",
            "maxTokens",
            "number",
            default=4096,
            description="Maximum tokens to generate.",
            type_options={"minValue": 1, "maxValue": 128000},
        ),
    ]


def api_key_prop(
    *,
    placeholder: str = "Leave empty to use Credential Vault or server .env",
) -> NodeProperty:
    return NodeProperty(
        "API Key",
        "apiKey",
        "password",
        default="",
        placeholder=placeholder,
        description="Optional override. Prefer Credential Vault for production.",
    )


def azure_credentials() -> list[dict[str, Any]]:
    return [
        {
            "name": "azureOpenAiApiKey",
            "displayName": "Azure OpenAI",
            "required": False,
            "types": ["azure_openai", "azure"],
        },
    ]


def provider_credentials(*types: str) -> list[dict[str, Any]]:
    label = types[0].replace("_", " ").title() if types else "API"
    return [{"name": "apiKey", "displayName": f"{label} credential", "required": False, "types": list(types)}]
