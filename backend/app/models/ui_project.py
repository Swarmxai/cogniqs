"""UI Project model — lightweight no-code app/website builder state."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _uuid() -> str:
    return uuid.uuid4().hex[:12]


class UIProject(Base):
    __tablename__ = "ui_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # JSON array of components (widgets) with props
    components: Mapped[str] = mapped_column(Text, default="[]")
    settings: Mapped[str] = mapped_column(Text, default="{}")
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_snapshot: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @staticmethod
    def _load(val, fallback):
        try:
            return json.loads(val) if val else fallback
        except json.JSONDecodeError:
            return fallback

    def to_dict(self, *, published: bool = False) -> dict[str, Any]:
        return {
            "id": self.id,
            "public_id": self.public_id,
            "name": self.name,
            "owner_id": self.owner_id,
            "components": self._load(self.published_snapshot if published else self.components, []),
            "settings": self._load(self.settings, {}),
            "published": self.published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
