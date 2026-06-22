"""Async SQLAlchemy engine and session management."""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _build_engine() -> AsyncEngine:
    connect_args: dict = {}
    if settings.is_sqlite:
        connect_args["check_same_thread"] = False
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
        connect_args=connect_args,
        pool_pre_ping=True,
    )


engine = _build_engine()
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialised.")


async def close_db() -> None:
    await engine.dispose()
