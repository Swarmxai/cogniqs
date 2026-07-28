"""Rate limiting middleware — sliding-window per-IP enforcement.

Uses in-memory tracking (no Redis dependency) with automatic cleanup.
For production clusters, swap _store for a Redis-backed implementation.
"""

import asyncio
import logging
import time
from collections import defaultdict

from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("cogniqs.ratelimit")

# ── In-memory sliding window store ───────────────────────────────────────────

_store: dict[str, list[float]] = defaultdict(list)
_store_lock = asyncio.Lock()
_CLEANUP_INTERVAL = 120  # seconds
_last_cleanup = 0.0

# Paths exempt from rate limiting
_EXEMPT_PATHS = frozenset({
    "/health",
    "/openapi.json",
    "/api/docs",
    "/api/redoc",
    # Auth endpoints — blocking these behind a shared proxy IP locks out ALL users
    "/api/auth/login",
    "/api/auth/login/mfa",
    "/api/auth/register",
    "/api/auth/me",
})

# Path prefixes exempt from rate limiting (WebSocket connections)
_EXEMPT_PREFIXES = (
    "/ws/",
    "/api/ws/",
)


def _client_ip(request: Request) -> str:
    """Extract client IP, respecting X-Forwarded-For behind reverse proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware:
    """Sliding-window rate limiter.

    - Per-IP tracking with configurable window and max requests.
    - Returns 429 Too Many Requests with Retry-After header.
    - Automatic cleanup of stale entries.
    """

    def __init__(self, app, *, requests_per_minute: int = 600):
        self.app = app
        self.max_requests = requests_per_minute
        self.window_seconds = 60.0

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if path in _EXEMPT_PATHS or any(path.startswith(p) for p in _EXEMPT_PREFIXES):
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        client_ip = _client_ip(request)
        now = time.monotonic()

        async with _store_lock:
            global _last_cleanup
            if now - _last_cleanup > _CLEANUP_INTERVAL:
                cutoff = now - self.window_seconds * 2
                stale_keys = [k for k, v in _store.items() if not v or v[-1] < cutoff]
                for k in stale_keys:
                    del _store[k]
                _last_cleanup = now

            # Sliding window: drop timestamps outside window
            timestamps = _store[client_ip]
            window_start = now - self.window_seconds
            while timestamps and timestamps[0] < window_start:
                timestamps.pop(0)

            if len(timestamps) >= self.max_requests:
                retry_after = int(timestamps[0] + self.window_seconds - now) + 1
                logger.warning("Rate limit exceeded: ip=%s count=%d", client_ip, len(timestamps))
                response = JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded. Please retry later.",
                        "retry_after_seconds": retry_after,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )
                await response(scope, receive, send)
                return

            timestamps.append(now)
            remaining = self.max_requests - len(timestamps)

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-ratelimit-limit", str(self.max_requests).encode()))
                headers.append((b"x-ratelimit-remaining", str(remaining).encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)
