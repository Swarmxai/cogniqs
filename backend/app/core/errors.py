"""Structured application errors."""

from __future__ import annotations

from typing import Any


class ApplicationError(Exception):
    status_code: int = 400
    code: str = "application_error"

    def __init__(self, message: str, *, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"message": self.message, "code": self.code}
        if self.details:
            payload["details"] = self.details
        return payload


class NotFoundError(ApplicationError):
    status_code = 404
    code = "not_found"


class UnauthorizedError(ApplicationError):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(ApplicationError):
    status_code = 403
    code = "forbidden"


class ValidationError(ApplicationError):
    status_code = 422
    code = "validation_error"
