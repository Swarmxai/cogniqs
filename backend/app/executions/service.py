"""Execution orchestration service."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.engine.runtime_context import RuntimeContext
from app.executions.workflow_executor import WorkflowExecutor
from app.models.credential import Credential
from app.models.execution import Execution
from app.models.workflow import Workflow
from app.api.credentials import decrypt_credential

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

        cred_cache = await _load_credentials_for_nodes(db, nodes, user_id)
        db_cache = await _load_databases_for_nodes(db, nodes, user_id)

        executor = WorkflowExecutor(
            nodes, connections, context, node_timeout=settings.DEFAULT_NODE_TIMEOUT,
            credential_cache=cred_cache, database_cache=db_cache,
        )
        result = await executor.execute()

        execution.status = "success" if result["status"] == "success" else "error"
        execution.result = json.dumps(result)
        execution.error = result.get("error")
        execution.finished_at = datetime.now(timezone.utc)
        await db.flush()

        if user_id:
            from app.services.notifications import notify_user
            ok = execution.status == "success"
            await notify_user(
                db,
                user_id,
                title=f"Workflow {'completed' if ok else 'failed'}",
                message=workflow.name,
                ntype="success" if ok else "error",
                link=f"/executions",
            )

        return execution


    @staticmethod
    async def run_single_node(
        db: AsyncSession,
        workflow: Workflow,
        node_id: str,
        trigger_data: dict[str, Any] | None = None,
        user_id: int | None = None,
    ) -> Execution:
        nodes = json.loads(workflow.nodes or "[]")
        connections = json.loads(workflow.connections or "[]")

        execution = Execution(
            workflow_id=workflow.id,
            status="running",
            trigger_data=json.dumps({**(trigger_data or {}), "_single_node": node_id}),
        )
        db.add(execution)
        await db.flush()

        context = RuntimeContext(
            json=trigger_data or {},
            execution_id=execution.id,
            workflow_id=workflow.id,
            user_id=user_id,
        )
        cred_cache = await _load_credentials_for_nodes(db, nodes, user_id)
        db_cache = await _load_databases_for_nodes(db, nodes, user_id)
        executor = WorkflowExecutor(
            nodes, connections, context,
            node_timeout=settings.DEFAULT_NODE_TIMEOUT,
            credential_cache=cred_cache,
            database_cache=db_cache,
        )
        result = await executor.execute_single_node(node_id)

        execution.status = "success" if result["status"] == "success" else "error"
        execution.result = json.dumps(result)
        execution.error = result.get("error")
        execution.finished_at = datetime.now(timezone.utc)
        await db.flush()
        return execution


async def _load_credentials_for_nodes(
    db: AsyncSession,
    nodes: list[dict[str, Any]],
    user_id: int | None,
) -> dict[str, dict[str, Any]]:
    if not user_id:
        return {}
    cred_ids = {
        str(n.get("data", {}).get("parameters", n.get("parameters", {})).get("_credentialId"))
        for n in nodes
    }
    cred_ids.discard("None")
    cred_ids.discard("")
    if not cred_ids:
        return {}
    result = await db.execute(
        select(Credential).where(
            Credential.id.in_([int(cid) for cid in cred_ids]),
            Credential.owner_id == user_id,
        )
    )
    cache: dict[str, dict[str, Any]] = {}
    for cred in result.scalars():
        cache[str(cred.id)] = decrypt_credential(cred)
    return cache


async def _load_databases_for_nodes(
    db: AsyncSession,
    nodes: list[dict[str, Any]],
    user_id: int | None,
) -> dict[str, str]:
    if not user_id:
        return {}
    from app.api.databases import _build_url, decrypt_credential
    db_ids = set()
    for n in nodes:
        params = n.get("data", {}).get("parameters", n.get("parameters", {}))
        did = params.get("database_id")
        if did:
            db_ids.add(int(did))
    if not db_ids:
        return {}
    result = await db.execute(
        select(Credential).where(
            Credential.id.in_(list(db_ids)),
            Credential.owner_id == user_id,
        )
    )
    cache: dict[str, str] = {}
    for cred in result.scalars():
        try:
            data = decrypt_credential(cred)
            db_type = cred.type if cred.type != "database" else "postgresql"
            cache[str(cred.id)] = _build_url(db_type, data)
        except Exception:
            continue
    return cache
