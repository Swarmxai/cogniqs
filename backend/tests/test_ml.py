import io

import pytest


@pytest.mark.asyncio
async def test_dataset_upload_and_analysis():
    from httpx import ASGITransport, AsyncClient
    import app.nodes  # noqa: F401
    from app.main import app
    from app.database import Base, engine, async_session_factory

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    csv_content = "feature_a,feature_b,target\n1,2,0\n3,4,1\n5,6,0\n7,8,1\n9,10,0\n"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={
            "email": "ml@example.com", "password": "password123",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        upload = await client.post(
            "/api/datasets/upload",
            headers=headers,
            files={"file": ("sample.csv", io.BytesIO(csv_content.encode()), "text/csv")},
            data={"name": "Sample", "folder": ""},
        )
        assert upload.status_code == 200, upload.text
        ds = upload.json()
        assert ds["status"] == "validated"
        assert ds["dataset_metadata"]["summary"]["row_count"] == 5

        dataset_id = ds["id"]
        preview = await client.get(f"/api/datasets/{dataset_id}/preview", headers=headers)
        assert preview.status_code == 200
        assert len(preview.json()["rows"]) == 5

        schema = await client.get(f"/api/datasets/{dataset_id}/schema", headers=headers)
        assert schema.status_code == 200
        assert len(schema.json()["columns"]) == 3

        listed = await client.get("/api/datasets", headers=headers)
        assert listed.status_code == 200
        assert len(listed.json()) == 1


@pytest.mark.asyncio
async def test_eda_and_clustering_nodes():
    import tempfile
    import os
    import app.nodes  # noqa: F401
    from app.nodes.analysis.eda_report import EDAReportNode
    from app.nodes.analysis.analytics_advanced import ClusteringNode

    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
        f.write("x,y\n1,2\n2,4\n3,6\n10,20\n11,22\n12,24\n")
        path = f.name

    try:
        ctx = {"json": {"train_path": path}, "user_id": 1}
        eda = await EDAReportNode().execute("n1", {}, ctx)
        assert eda["output_type"] == "eda_report"
        assert eda["row_count"] == 6

        clustering = await ClusteringNode().execute("n2", {"algorithm": "kmeans", "n_clusters": 2}, ctx)
        assert clustering["output_type"] == "clustering_result"
        assert clustering["n_clusters"] == 2
    finally:
        os.unlink(path)


@pytest.mark.asyncio
async def test_projects_agents_usage_apis():
    from httpx import ASGITransport, AsyncClient
    import app.nodes  # noqa: F401
    from app.main import app
    from app.database import Base, engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reg = await client.post("/api/auth/register", json={"email": "p2@example.com", "password": "password123"})
        headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

        proj = await client.post("/api/projects", headers=headers, json={"name": "My Project", "description": "d"})
        assert proj.status_code == 200
        assert proj.json()["name"] == "My Project"

        agent = await client.post("/api/agents", headers=headers, json={"name": "Helper", "provider": "openai", "model": "gpt-4o-mini"})
        assert agent.status_code == 200
        agents = await client.get("/api/agents", headers=headers)
        assert len(agents.json()) == 1

        usage = await client.get("/api/usage/summary", headers=headers)
        assert usage.status_code == 200
        assert "total_tokens" in usage.json()

        notifs = await client.get("/api/notifications/unread-count", headers=headers)
        assert notifs.status_code == 200


@pytest.mark.asyncio
async def test_autogluon_hyperparameters_endpoint():
    from httpx import ASGITransport, AsyncClient
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/autogluon/hyperparameters")
    assert resp.status_code == 200
    catalog = resp.json()
    assert "tabular" in catalog and "timeseries" in catalog
    assert "GBM" in catalog["tabular"]["models"]
