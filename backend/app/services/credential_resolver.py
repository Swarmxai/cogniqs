"""Resolve Credential Vault entries into LLM provider configuration."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.credentials import decrypt_credential
from app.core.errors import NotFoundError, ValidationError
from app.models.credential import Credential

# Agent UI provider → acceptable vault credential types
AGENT_PROVIDER_CRED_TYPES: dict[str, set[str]] = {
    "openai": {"openai", "custom"},
    "anthropic": {"anthropic", "custom"},
    "gemini": {"google", "google_gemini", "custom"},
    "groq": {"groq", "custom"},
    "mistral": {"mistral", "custom"},
    "deepseek": {"deepseek", "custom"},
    "ollama": {"ollama", "self_hosted", "custom"},
    "azure": {"azure_openai", "custom"},
}

# Vault type → LLMService provider id (when they differ)
CRED_TYPE_TO_LLM_PROVIDER: dict[str, str] = {
    "google": "gemini",
    "google_gemini": "gemini",
    "azure_openai": "azure",
    "self_hosted": "ollama",
    "ollama": "ollama",
}


def resolve_api_key(cred_data: dict[str, Any]) -> str:
    return str(
        cred_data.get("apiKey")
        or cred_data.get("api_key")
        or cred_data.get("value")
        or ""
    ).strip()


def validate_credential_for_provider(agent_provider: str, cred_type: str) -> None:
    allowed = AGENT_PROVIDER_CRED_TYPES.get(agent_provider, {agent_provider, "custom"})
    if cred_type not in allowed:
        raise ValidationError(
            f"Credential type '{cred_type}' is not compatible with provider '{agent_provider}'. "
            f"Use one of: {', '.join(sorted(allowed))}."
        )


def build_llm_model_config(
    agent_provider: str,
    model: str,
    cred_data: dict[str, Any] | None = None,
    *,
    cred_type: str | None = None,
) -> dict[str, Any]:
    """Build the dict passed to LLMService.chat from agent settings + optional vault data."""
    provider = agent_provider
    if cred_type:
        provider = CRED_TYPE_TO_LLM_PROVIDER.get(cred_type, agent_provider)
        if cred_type == "azure_openai":
            provider = "azure"

    cfg: dict[str, Any] = {"provider": provider, "model": model}

    if not cred_data:
        return cfg

    api_key = resolve_api_key(cred_data)
    if api_key:
        cfg["apiKey"] = api_key

    if cred_data.get("organization"):
        cfg["organization"] = cred_data["organization"]

    if cred_data.get("baseUrl"):
        cfg["baseUrl"] = cred_data["baseUrl"].rstrip("/")

    if provider == "ollama" or cred_type in ("self_hosted", "ollama"):
        provider = "ollama"
        cfg["provider"] = "ollama"
        if cred_data.get("model") and not model:
            cfg["model"] = cred_data["model"]

    if provider == "azure" or cred_type == "azure_openai":
        if cred_data.get("endpoint"):
            cfg["endpoint"] = cred_data["endpoint"]
        if cred_data.get("deployment"):
            cfg["model"] = cred_data["deployment"]
        if cred_data.get("apiVersion"):
            cfg["apiVersion"] = cred_data["apiVersion"]

    return cfg


async def load_owned_credential(
    db: AsyncSession,
    credential_id: int,
    owner_id: int,
) -> tuple[Credential, dict[str, Any]]:
    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.owner_id == owner_id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise NotFoundError("Credential not found")
    return cred, decrypt_credential(cred)


async def model_config_for_agent(
    db: AsyncSession,
    *,
    provider: str,
    model: str,
    credential_id: int | None,
    owner_id: int,
) -> dict[str, Any]:
    if credential_id is None:
        return build_llm_model_config(provider, model)

    cred, data = await load_owned_credential(db, credential_id, owner_id)
    validate_credential_for_provider(provider, cred.type)
    return build_llm_model_config(provider, model, data, cred_type=cred.type)
