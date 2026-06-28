"""AutoML API tests."""

import io

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


@pytest.mark.asyncio
async def test_automl_options():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/automl/options")
    assert resp.status_code == 200
    body = resp.json()
    assert any(p["value"] == "binary" for p in body["problem_types"])
    assert len(body["presets"]) >= 4


@pytest.mark.asyncio
async def test_automl_train_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "automl@example.com",
            "password": "password123",
        })
        headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

        bad = await client.post("/api/automl/train", headers=headers, json={
            "dataset_id": 999,
            "model_name": "test_model",
            "target_column": "target",
        })
        assert bad.status_code == 404


@pytest.mark.asyncio
async def test_automl_train_end_to_end():
    pytest.importorskip("autogluon.tabular")
    transport = ASGITransport(app=app)
    csv_content = "feature_a,feature_b,target\n1,2,0\n3,4,1\n5,6,0\n7,8,1\n9,10,0\n"

    async with AsyncClient(transport=transport, base_url="http://test", timeout=120) as client:
        reg = await client.post("/api/auth/register", json={
            "email": "automl2@example.com",
            "password": "password123",
        })
        headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

        upload = await client.post(
            "/api/datasets/upload",
            headers=headers,
            files={"file": ("sample.csv", io.BytesIO(csv_content.encode()), "text/csv")},
            data={"name": "AutoML Sample", "folder": ""},
        )
        dataset_id = upload.json()["id"]

        train = await client.post("/api/automl/train", headers=headers, json={
            "dataset_id": dataset_id,
            "model_name": "churn_predictor",
            "problem_type": "binary",
            "target_column": "target",
            "presets": "medium_quality",
            "time_limit": 60,
        })
        assert train.status_code == 200, train.text
        body = train.json()
        assert body["model"]["name"] == "churn_predictor"
        assert body["training"]["best_model"]

        listed = await client.get("/api/trained-models", headers=headers)
        assert any(m["name"] == "churn_predictor" for m in listed.json())
