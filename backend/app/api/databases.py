"""Database connection registry — stored as encrypted credentials."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.api.credentials import decrypt_credential
from app.config import settings
from app.core.deps import CurrentUser
from app.core.encryption import encrypt_value
from app.core.errors import NotFoundError, ValidationError
from app.database import get_db
from app.models.credential import Credential
import json

router = APIRouter(prefix="/databases", tags=["databases"])

DB_TYPES = frozenset({"postgresql", "mysql", "sqlite", "mssql", "database"})


class DatabaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=50)
    host: str = ""
    port: int | None = None
    database: str = ""
    user: str = ""
    password: str = ""
    connection_url: str = ""


class DatabaseResponse(BaseModel):
    id: int
    name: str
    type: str
    host: str
    port: int | None
    database: str
    user: str
    connection_url: str
    created_at: str


def _normalize_type(db_type: str) -> str:
    t = (db_type or "").strip().lower()
    if t == "database":
        return "postgresql"
    if t in DB_TYPES:
        return t
    raise ValidationError(f"Unsupported database type: {db_type}")


def _build_url(db_type: str, data: dict[str, Any]) -> str:
    if data.get("connection_url"):
        return str(data["connection_url"]).strip()

    host = data.get("host", "localhost")
    port = data.get("port")
    database = data.get("database") or data.get("dbname", "")
    user = data.get("user") or data.get("username", "")
    password = data.get("password", "")

    if db_type == "sqlite":
        path = data.get("path") or database or ":memory:"
        if path == ":memory:":
            return "sqlite+aiosqlite:///:memory:"
        return f"sqlite+aiosqlite:///{path.lstrip('/')}"

    if db_type == "postgresql":
        port = port or 5432
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}"

    if db_type == "mysql":
        port = port or 3306
        return f"mysql+aiomysql://{user}:{password}@{host}:{port}/{database}"

    if db_type == "mssql":
        port = port or 1433
        return f"mssql+aioodbc://{user}:{password}@{host}:{port}/{database}?driver=ODBC+Driver+18+for+SQL+Server"

    raise ValidationError(f"Cannot build connection URL for type: {db_type}")


def _mask_url(url: str) -> str:
    if "@" not in url:
        return url
    prefix, rest = url.split("@", 1)
    if "://" in prefix:
        scheme, creds = prefix.split("://", 1)
        if ":" in creds:
            user = creds.split(":", 1)[0]
            return f"{scheme}://{user}:****@{rest}"
    return url


def _to_response(cred: Credential, data: dict[str, Any]) -> DatabaseResponse:
    db_type = cred.type if cred.type != "database" else "postgresql"
    url = _build_url(db_type, data)
    return DatabaseResponse(
        id=cred.id,
        name=cred.name,
        type=db_type,
        host=str(data.get("host", "")),
        port=data.get("port"),
        database=str(data.get("database") or data.get("dbname") or data.get("path", "")),
        user=str(data.get("user") or data.get("username", "")),
        connection_url=_mask_url(url),
        created_at=cred.created_at.isoformat(),
    )


@router.get("", response_model=list[DatabaseResponse])
async def list_databases(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[DatabaseResponse]:
    result = await db.execute(
        select(Credential)
        .where(Credential.owner_id == user.id, Credential.type.in_(tuple(DB_TYPES)))
        .order_by(Credential.created_at.desc())
    )
    out: list[DatabaseResponse] = []
    for cred in result.scalars():
        try:
            data = decrypt_credential(cred)
            out.append(_to_response(cred, data))
        except Exception:
            continue
    return out


@router.post("", response_model=DatabaseResponse)
async def create_database(
    body: DatabaseCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> DatabaseResponse:
    db_type = _normalize_type(body.type)
    data = {
        "host": body.host,
        "port": body.port,
        "database": body.database,
        "user": body.user,
        "password": body.password,
        "connection_url": body.connection_url,
    }
    _build_url(db_type, data)

    secret = settings.ENCRYPTION_KEY or settings.SECRET_KEY
    cred = Credential(
        name=body.name,
        type=db_type,
        encrypted_data=encrypt_value(json.dumps(data), secret),
        owner_id=user.id,
    )
    db.add(cred)
    await db.flush()
    return _to_response(cred, data)


@router.post("/{database_id}/test")
async def test_database(
    database_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    cred = await _get_owned(db, database_id, user.id)
    data = decrypt_credential(cred)
    url = _build_url(cred.type if cred.type != "database" else "postgresql", data)

    started = time.perf_counter()
    engine = create_async_engine(url, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = round((time.perf_counter() - started) * 1000, 1)
        return {"ok": True, "latency_ms": latency, "message": "Connection successful"}
    except Exception as exc:
        return {"ok": False, "latency_ms": None, "message": str(exc)}
    finally:
        await engine.dispose()


@router.delete("/{database_id}")
async def delete_database(
    database_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    cred = await _get_owned(db, database_id, user.id)
    await db.delete(cred)
    return {"deleted": True}


async def _get_owned(db: AsyncSession, database_id: int, owner_id: int) -> Credential:
    result = await db.execute(
        select(Credential).where(
            Credential.id == database_id,
            Credential.owner_id == owner_id,
            Credential.type.in_(tuple(DB_TYPES)),
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise NotFoundError("Database connection not found")
    return cred
