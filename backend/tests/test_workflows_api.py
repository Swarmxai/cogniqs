"""Full workflow CRUD and execution API tests."""

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


async def _auth_client():
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    reg = await client.post("/api/auth/register", json={
        "email": "wf-crud@example.com",
        "password": "password123",
    })
    token = reg.json()["access_token"]
    return client, {"Authorization": f"Bearer {token}"}


WORKFLOW_PAYLOAD = {
    "name": "CRUD Flow",
    "nodes": [
        {
            "id": "t1",
            "type": "manual_trigger",
            "position": {"x": 0, "y": 0},
            "data": {"type": "manual_trigger", "parameters": {}},
        },
        {
            "id": "s1",
            "type": "set_node",
            "position": {"x": 200, "y": 0},
            "disabled": True,
            "data": {"type": "set_node", "parameters": {"fields": '{"done": true}'}},
        },
    ],
    "connections": [
        {"source": "t1", "target": "s1", "sourceHandle": "main-out", "targetHandle": "main-in"},
    ],
}


@pytest.mark.asyncio
async def test_workflow_full_crud():
    client, headers = await _auth_client()

    create = await client.post("/api/workflows", json=WORKFLOW_PAYLOAD, headers=headers)
    assert create.status_code == 200
    wf_id = create.json()["id"]
    assert create.json()["name"] == "CRUD Flow"

    get_one = await client.get(f"/api/workflows/{wf_id}", headers=headers)
    assert get_one.status_code == 200
    assert len(get_one.json()["nodes"]) == 2

    listed = await client.get("/api/workflows", headers=headers)
    assert listed.status_code == 200
    assert any(w["id"] == wf_id for w in listed.json())

    update = await client.put(f"/api/workflows/{wf_id}", json={
        "name": "Renamed Flow",
        "nodes": WORKFLOW_PAYLOAD["nodes"] + [{
            "id": "note1",
            "type": "sticky_note",
            "position": {"x": 50, "y": 50},
            "text": "hello",
            "color": "#fef3c7",
        }],
        "connections": WORKFLOW_PAYLOAD["connections"],
    }, headers=headers)
    assert update.status_code == 200
    assert update.json()["name"] == "Renamed Flow"
    assert any(n["type"] == "sticky_note" for n in update.json()["nodes"])

    deleted = await client.delete(f"/api/workflows/{wf_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True

    missing = await client.get(f"/api/workflows/{wf_id}", headers=headers)
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_workflow_execute_skips_disabled_node():
    client, headers = await _auth_client()

    create = await client.post("/api/workflows", json=WORKFLOW_PAYLOAD, headers=headers)
    wf_id = create.json()["id"]

    execute = await client.post(
        f"/api/workflows/{wf_id}/execute",
        json={"trigger_data": {}},
        headers=headers,
    )
    assert execute.status_code == 200
    body = execute.json()
    assert body["status"] == "success"
    outputs = body["result"]["nodeOutputs"]
    assert outputs["s1"]["status"] == "skipped"


@pytest.mark.asyncio
async def test_workflow_not_found_for_other_user():
    client_a, headers_a = await _auth_client()
    create = await client_a.post("/api/workflows", json=WORKFLOW_PAYLOAD, headers=headers_a)
    wf_id = create.json()["id"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client_b:
        reg = await client_b.post("/api/auth/register", json={
            "email": "other@example.com",
            "password": "password123",
        })
        headers_b = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        resp = await client_b.get(f"/api/workflows/{wf_id}", headers=headers_b)
        assert resp.status_code == 404

    await client_a.aclose()
