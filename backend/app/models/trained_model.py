"""TrainedModel ORM — registry of models produced by training workflows."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TrainedModel(Base):
    __tablename__ = "trained_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    workflow_id: Mapped[int | None] = mapped_column(nullable=True, index=True)
    execution_id: Mapped[int | None] = mapped_column(nullable=True)
    node_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    version: Mapped[int] = mapped_column(Integer, default=1)
    framework: Mapped[str] = mapped_column(String(64), default="autogluon")
    problem_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    best_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    model_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_size_mb: Mapped[float | None] = mapped_column(Float, nullable=True)

    training_metrics: Mapped[str] = mapped_column(Text, default="{}")
    leaderboard: Mapped[str] = mapped_column(Text, default="[]")
    feature_importance: Mapped[str] = mapped_column(Text, default="{}")
    extra_metadata: Mapped[str] = mapped_column(Text, default="{}")

    status: Mapped[str] = mapped_column(String(32), default="trained")
    api_key: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @staticmethod
    def _load(val: str, fallback):
        try:
            return json.loads(val) if val else fallback
        except json.JSONDecodeError:
            return fallback

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "owner_id": self.owner_id,
            "workflow_id": self.workflow_id,
            "execution_id": self.execution_id,
            "node_id": self.node_id,
            "version": self.version,
            "framework": self.framework,
            "problem_type": self.problem_type,
            "best_model": self.best_model,
            "model_path": self.model_path,
            "model_size_mb": self.model_size_mb,
            "training_metrics": self._load(self.training_metrics, {}),
            "leaderboard": self._load(self.leaderboard, []),
            "feature_importance": self._load(self.feature_importance, {}),
            "extra_metadata": self._load(self.extra_metadata, {}),
            "status": self.status,
            "api_key": self.api_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
