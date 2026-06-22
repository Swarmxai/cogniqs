import pytest

from app.services.workflow_builder import _rule_based_build


def test_rule_based_chat_agent():
    result = _rule_based_build("Create a chat agent with memory and OpenAI")
    assert "ai_agent" in [n["type"] for n in result["nodes"]]
    assert "memory_buffer" in [n["type"] for n in result["nodes"]]
    assert len(result["connections"]) >= 2


def test_rule_based_rag():
    result = _rule_based_build("Build a RAG pipeline for PDF documents")
    assert "rag_document_qa" in [n["type"] for n in result["nodes"]]


@pytest.mark.asyncio
async def test_templates_endpoint():
    from httpx import ASGITransport, AsyncClient
    import app.nodes  # noqa: F401
    from app.main import app
    from app.database import Base, engine, async_session_factory
    from app.services.template_seeder import seed_templates

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed_templates(session)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "tpl@example.com", "password": "password123",
        })
        token = reg.json()["access_token"]
        templates = await client.get("/api/templates", headers={"Authorization": f"Bearer {token}"})
    assert templates.status_code == 200
    assert len(templates.json()) >= 1
