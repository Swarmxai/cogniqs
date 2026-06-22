"""Dataset ORM — uploaded/imported dataset metadata."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    dataset_type: Mapped[str] = mapped_column(String(64), default="tabular")
    file_path: Mapped[str] = mapped_column(Text, default="{}")
    dataset_metadata: Mapped[str] = mapped_column(Text, default="{}")
    target_column: Mapped[str | None] = mapped_column(String(255), nullable=True)
    folder: Mapped[str] = mapped_column(String(255), default="")
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def get_metadata(self) -> dict[str, Any]:
        try:
            return json.loads(self.dataset_metadata or "{}")
        except json.JSONDecodeError:
            return {}

    def set_metadata(self, meta: dict) -> None:
        self.dataset_metadata = json.dumps(meta, default=str)

    def get_file_path(self) -> dict[str, Any]:
        try:
            return json.loads(self.file_path or "{}")
        except json.JSONDecodeError:
            return {}

    def set_file_path(self, fp: dict) -> None:
        self.file_path = json.dumps(fp, default=str)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "file_name": self.file_name,
            "owner_id": self.owner_id,
            "dataset_type": self.dataset_type,
            "file_path": self.get_file_path(),
            "dataset_metadata": self.get_metadata(),
            "target_column": self.target_column,
            "folder": self.folder,
            "version": self.version,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
