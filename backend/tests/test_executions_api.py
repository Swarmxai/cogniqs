"""Execution list API tests."""

import pytest
from httpx import ASGITransport, AsyncClient

import app.nodes  # noqa: F401
from app.main import app
from app.database import Base, engine


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


async def _register(client, email):
    reg = await client.post("/api/auth/register", json={
        "email": email,
        "password": "password123",
    })
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


SIMPLE_FLOW = {
    "name": "Exec Flow",
    "nodes": [
        {"id": "t1", "type": "manual_trigger", "position": {"x": 0, "y": 0},
         "data": {"type": "manual_trigger", "parameters": {}}},
    ],
    "connections": [],
}


@pytest.mark.asyncio
async def test_executions_list_and_filter_by_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await _register(client, "exec@example.com")

        wf_a = (await client.post("/api/workflows", json=SIMPLE_FLOW, headers=headers)).json()["id"]
        wf_b = (await client.post("/api/workflows", json={**SIMPLE_FLOW, "name": "B"}, headers=headers)).json()["id"]

        await client.post(f"/api/workflows/{wf_a}/execute", json={"trigger_data": {}}, headers=headers)
        await client.post(f"/api/workflows/{wf_b}/execute", json={"trigger_data": {}}, headers=headers)

        all_execs = await client.get("/api/executions", headers=headers)
        assert all_execs.status_code == 200
        assert len(all_execs.json()) >= 2

        filtered = await client.get(f"/api/executions?workflow_id={wf_a}", headers=headers)
        assert filtered.status_code == 200
        rows = filtered.json()
        assert len(rows) >= 1
        assert all(ex["workflow_id"] == wf_a for ex in rows)


@pytest.mark.asyncio
async def test_executions_empty_for_unknown_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = await _register(client, "exec2@example.com")
        resp = await client.get("/api/executions?workflow_id=99999", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []
