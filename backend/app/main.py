"""Cogniqs API — GenAI low-code workflow platform."""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.errors import ApplicationError
from app.database import close_db, init_db
from app.api.auth import router as auth_router
from app.api.workflows import router as workflows_router
from app.api.nodes import router as nodes_router
from app.api.executions import router as executions_router
from app.api.chat import router as chat_router
from app.api.chat_ws import router as chat_ws_router
from app.api.builder import router as builder_router
from app.api.templates import router as templates_router
from app.api.credentials import router as credentials_router
from app.api.datasets import router as datasets_router
from app.api.trained_models import router as trained_models_router
from app.api.autogluon import router as autogluon_router
from app.api.automl import router as automl_router
from app.api.projects import router as projects_router
from app.api.usage import router as usage_router
from app.api.agents import router as agents_router
from app.api.notifications import router as notifications_router, audit_router
from app.api.vectors import router as vectors_router
from app.api.mfa import router as mfa_router
from app.api.ui_projects import router as ui_projects_router
from app.api.databases import router as databases_router
from app.api.webhooks import router as webhooks_router
from app.api.health import router as health_router

import app.nodes  # noqa: F401

logger = logging.getLogger("cogniqs")
logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from app.database import async_session_factory
    from app.services.seeders import ensure_demo_user
    from app.services.template_seeder import seed_templates
    async with async_session_factory() as session:
        await ensure_demo_user(session)
        await seed_templates(session)
        await session.commit()
    from app.engine.node_registry import registry_count
    from app.services.schedule_runner import start_scheduler
    logger.info("Cogniqs v%s ready — %d node types", settings.APP_VERSION, registry_count())
    start_scheduler()
    yield
    from app.services.schedule_runner import stop_scheduler
    stop_scheduler()
    await close_db()


app = FastAPI(
    title="Cogniqs API",
    description="GenAI Low-Code Workflow Automation",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def trace_requests(request: Request, call_next):
    rid = request.headers.get("x-request-id", uuid.uuid4().hex[:12])
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    response.headers["X-Response-Time-MS"] = f"{(time.perf_counter() - start) * 1000:.1f}"
    return response


@app.exception_handler(ApplicationError)
async def app_error_handler(_: Request, exc: ApplicationError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


api = APIRouter(prefix="/api")
api.include_router(auth_router)
api.include_router(workflows_router)
api.include_router(nodes_router)
api.include_router(executions_router)
api.include_router(chat_router)
api.include_router(builder_router)
api.include_router(templates_router)
api.include_router(credentials_router)
api.include_router(datasets_router)
api.include_router(trained_models_router)
api.include_router(autogluon_router)
api.include_router(automl_router)
api.include_router(projects_router)
api.include_router(usage_router)
api.include_router(agents_router)
api.include_router(notifications_router)
api.include_router(audit_router)
api.include_router(vectors_router)
api.include_router(mfa_router)
api.include_router(ui_projects_router)
api.include_router(databases_router)
api.include_router(webhooks_router)

app.include_router(health_router)
app.include_router(chat_ws_router)
app.include_router(api)


@app.get("/")
async def root() -> dict:
    return {"service": "cogniqs-api", "version": settings.APP_VERSION, "health": "/health"}
