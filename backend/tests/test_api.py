import pytest
from httpx import ASGITransport, AsyncClient

import app.nodes  # noqa: F401
from app.main import app
from app.database import init_db, async_session_factory, Base, engine


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_list_nodes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test",
        })
        assert reg.status_code == 200
        token = reg.json()["access_token"]
        nodes = await client.get("/api/nodes", headers={"Authorization": f"Bearer {token}"})
    assert nodes.status_code == 200
    assert nodes.json()["count"] >= 10


@pytest.mark.asyncio
async def test_workflow_crud_and_execute():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "wf@example.com",
            "password": "password123",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        create = await client.post("/api/workflows", json={
            "name": "Test Flow",
            "nodes": [
                {"id": "t1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "data": {"type": "manual_trigger", "parameters": {}}},
                {"id": "s1", "type": "set_node", "position": {"x": 200, "y": 0}, "data": {"type": "set_node", "parameters": {"fields": '{"done": true}'}}},
            ],
            "connections": [
                {"source": "t1", "target": "s1", "sourceHandle": "main-out", "targetHandle": "main-in"},
            ],
        }, headers=headers)
        assert create.status_code == 200
        wf_id = create.json()["id"]

        execute = await client.post(f"/api/workflows/{wf_id}/execute", json={"trigger_data": {}}, headers=headers)
        assert execute.status_code == 200
        assert execute.json()["status"] == "success"


@pytest.mark.asyncio
async def test_databases_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "db@example.com",
            "password": "password123",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        create = await client.post("/api/databases", json={
            "name": "Local SQLite",
            "type": "sqlite",
            "database": ":memory:",
        }, headers=headers)
        assert create.status_code == 200
        db_id = create.json()["id"]
        assert create.json()["type"] == "sqlite"

        listed = await client.get("/api/databases", headers=headers)
        assert listed.status_code == 200
        assert any(d["id"] == db_id for d in listed.json())

        test = await client.post(f"/api/databases/{db_id}/test", headers=headers)
        assert test.status_code == 200
        assert test.json()["ok"] is True

        deleted = await client.delete(f"/api/databases/{db_id}", headers=headers)
        assert deleted.status_code == 200
        assert deleted.json()["deleted"] is True
