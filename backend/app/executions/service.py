"""Execution orchestration service."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.engine.runtime_context import RuntimeContext
from app.executions.workflow_executor import WorkflowExecutor
from app.models.execution import Execution
from app.models.workflow import Workflow

logger = logging.getLogger(__name__)


class ExecutionService:
    @staticmethod
    async def run_workflow(
        db: AsyncSession,
        workflow: Workflow,
        trigger_data: dict[str, Any] | None = None,
        user_id: int | None = None,
    ) -> Execution:
        nodes = json.loads(workflow.nodes or "[]")
        connections = json.loads(workflow.connections or "[]")

        execution = Execution(
            workflow_id=workflow.id,
            status="running",
            trigger_data=json.dumps(trigger_data or {}),
        )
        db.add(execution)
        await db.flush()

        context = RuntimeContext(
            json=trigger_data or {},
            execution_id=execution.id,
            workflow_id=workflow.id,
            user_id=user_id,
        )

        executor = WorkflowExecutor(
            nodes, connections, context, node_timeout=settings.DEFAULT_NODE_TIMEOUT
        )
        result = await executor.execute()

        execution.status = "success" if result["status"] == "success" else "error"
        execution.result = json.dumps(result)
        execution.error = result.get("error")
        execution.finished_at = datetime.now(timezone.utc)
        await db.flush()
        return execution
