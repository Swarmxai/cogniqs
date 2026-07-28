"""Tests for the global sliding-window rate limit middleware."""

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse
from starlette.routing import Route

import app.core.rate_limit as rl
from app.core.rate_limit import RateLimitMiddleware


@pytest.fixture(autouse=True)
def clean_store():
    rl._store.clear()
    yield
    rl._store.clear()


def _make_app(limit: int) -> Starlette:
    async def ok(request):
        return PlainTextResponse("ok")

    routes = [
        Route("/api/things", ok),
        Route("/api/auth/login", ok, methods=["GET", "POST"]),
        Route("/health", ok),
    ]
    starlette_app = Starlette(routes=routes)
    return RateLimitMiddleware(starlette_app, requests_per_minute=limit)


async def test_requests_within_limit_pass_and_carry_headers():
    transport = ASGITransport(app=_make_app(5))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/things")
        assert resp.status_code == 200
        assert resp.headers["x-ratelimit-limit"] == "5"
        assert int(resp.headers["x-ratelimit-remaining"]) == 4


async def test_exceeding_limit_returns_429_with_retry_after():
    transport = ASGITransport(app=_make_app(3))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for _ in range(3):
            assert (await client.get("/api/things")).status_code == 200
        resp = await client.get("/api/things")
        assert resp.status_code == 429
        assert "retry-after" in resp.headers
        assert resp.json()["retry_after_seconds"] >= 1


async def test_auth_and_health_exempt_from_limit():
    transport = ASGITransport(app=_make_app(1))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        assert (await client.get("/api/things")).status_code == 200
        # Limit is exhausted, but exempt paths still work
        for _ in range(5):
            assert (await client.post("/api/auth/login")).status_code == 200
            assert (await client.get("/health")).status_code == 200
        # Non-exempt path is now blocked
        assert (await client.get("/api/things")).status_code == 429
