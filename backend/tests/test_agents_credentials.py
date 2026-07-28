"""Tests for agent credential vault integration."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

import app.nodes  # noqa: F401
from app.main import app
from app.services.credential_resolver import build_llm_model_config, validate_credential_for_provider


@pytest.fixture(autouse=True)
async def setup_db():
    from app.database import Base, engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def auth_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post(
            "/api/auth/register",
            json={"email": "cred@test.com", "password": "password123", "name": "Cred Tester"},
        )
        token = reg.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"
        yield client


def test_build_llm_config_openai_with_organization():
    cfg = build_llm_model_config(
        "openai",
        "gpt-4o-mini",
        {"apiKey": "sk-test", "organization": "org-abc"},
        cred_type="openai",
    )
    assert cfg["organization"] == "org-abc"
    cfg = build_llm_model_config(
        "openai",
        "gpt-4o-mini",
        {"apiKey": "sk-test"},
        cred_type="openai",
    )
    assert cfg["provider"] == "openai"
    assert cfg["apiKey"] == "sk-test"
    assert cfg["model"] == "gpt-4o-mini"


def test_build_llm_config_azure_credential():
    cfg = build_llm_model_config(
        "azure",
        "gpt-4o-mini",
        {
            "apiKey": "az-key",
            "endpoint": "https://my.openai.azure.com",
            "deployment": "gpt-4o-mini-deploy",
            "apiVersion": "2024-02-01",
        },
        cred_type="azure_openai",
    )
    assert cfg["provider"] == "azure"
    assert cfg["endpoint"] == "https://my.openai.azure.com"
    assert cfg["model"] == "gpt-4o-mini-deploy"
    assert cfg["apiVersion"] == "2024-02-01"


def test_validate_credential_rejects_mismatch():
    with pytest.raises(Exception) as exc:
        validate_credential_for_provider("openai", "anthropic")
    assert "not compatible" in str(exc.value)


@pytest.mark.asyncio
async def test_agent_chat_uses_vault_credential(auth_client):
    cred = await auth_client.post(
        "/api/credentials",
        json={"name": "OpenAI Dev", "type": "openai", "data": {"apiKey": "sk-from-vault"}},
    )
    assert cred.status_code == 200
    cred_id = cred.json()["id"]

    agent = await auth_client.post(
        "/api/agents",
        json={
            "name": "Vault Agent",
            "provider": "openai",
            "model": "gpt-4o-mini",
            "credential_id": cred_id,
        },
    )
    assert agent.status_code == 200
    agent_id = agent.json()["id"]

    with patch("app.api.agents.LLMService.chat", new=AsyncMock(return_value={"content": "ok", "usage": {}})) as mock_chat:
        resp = await auth_client.post(
            f"/api/agents/{agent_id}/chat",
            json={"message": "hi", "session_id": "t1"},
        )

    assert resp.status_code == 200
    assert resp.json()["reply"] == "ok"
    model_cfg = mock_chat.await_args[0][0]
    assert model_cfg["apiKey"] == "sk-from-vault"


@pytest.mark.asyncio
async def test_agent_rejects_wrong_credential_type(auth_client):
    cred = await auth_client.post(
        "/api/credentials",
        json={"name": "Anthropic Key", "type": "anthropic", "data": {"apiKey": "sk-ant"}},
    )
    cred_id = cred.json()["id"]

    agent = await auth_client.post(
        "/api/agents",
        json={
            "name": "Bad Match",
            "provider": "openai",
            "model": "gpt-4o-mini",
            "credential_id": cred_id,
        },
    )
    assert agent.status_code == 422
