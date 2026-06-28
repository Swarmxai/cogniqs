"""Messaging & data integration nodes: Slack, Telegram, Email, Database, Sub-workflow."""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.engine.node_base import (
    BaseNode,
    NodeDescription,
    NodeProperty,
    NodePropertyOption,
)
from app.engine.node_registry import register_node


@register_node
class SlackSendMessageNode(BaseNode):
    description = NodeDescription(
        display_name="Slack: Send Message",
        name="slack_send_message",
        category="Integrations",
        icon="message-circle",
        color="#4a154b",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Webhook URL", "webhook_url", "string", default="", required=True),
            NodeProperty("Message", "text", "string", default="Hello from Cogniqs"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        url = parameters.get("webhook_url", "")
        text = parameters.get("text", "")
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json={"text": text})
        return {"sent": resp.status_code == 200, "status": resp.status_code}


@register_node
class TelegramSendMessageNode(BaseNode):
    description = NodeDescription(
        display_name="Telegram: Send Message",
        name="telegram_send_message",
        category="Integrations",
        icon="message-circle",
        color="#229ed9",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Bot Token", "bot_token", "string", default="", required=True),
            NodeProperty("Chat ID", "chat_id", "string", default="", required=True),
            NodeProperty("Message", "text", "string", default="Hello from Cogniqs"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        token = parameters.get("bot_token", "")
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json={
                "chat_id": parameters.get("chat_id"),
                "text": parameters.get("text", ""),
            })
        return {"sent": resp.status_code == 200, "status": resp.status_code, "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}}


@register_node
class EmailSendNode(BaseNode):
    description = NodeDescription(
        display_name="Send Email (SMTP)",
        name="email_send",
        category="Integrations",
        icon="message-circle",
        color="#ea4335",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("SMTP Host", "host", "string", default="smtp.gmail.com"),
            NodeProperty("SMTP Port", "port", "number", default=587),
            NodeProperty("Username", "username", "string", default=""),
            NodeProperty("Password", "password", "string", default=""),
            NodeProperty("From", "from_addr", "string", default=""),
            NodeProperty("To", "to_addr", "string", default=""),
            NodeProperty("Subject", "subject", "string", default=""),
            NodeProperty("Body", "body", "string", default=""),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(parameters.get("body", ""))
        msg["Subject"] = parameters.get("subject", "")
        msg["From"] = parameters.get("from_addr") or parameters.get("username", "")
        msg["To"] = parameters.get("to_addr", "")

        def _send():
            with smtplib.SMTP(parameters.get("host", ""), int(parameters.get("port") or 587)) as server:
                server.starttls()
                if parameters.get("username"):
                    server.login(parameters.get("username"), parameters.get("password", ""))
                server.send_message(msg)

        import asyncio
        await asyncio.get_event_loop().run_in_executor(None, _send)
        return {"sent": True, "to": parameters.get("to_addr")}


@register_node
class DatabaseQueryNode(BaseNode):
    description = NodeDescription(
        display_name="Database Query",
        name="database_query",
        category="Integrations",
        icon="database",
        color="#336791",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Saved connection", "database_id", "number", default=None,
                         description="Pick from Databases page, or enter URL below."),
            NodeProperty("Connection URL", "connection_url", "string", default="",
                         placeholder="postgresql+asyncpg://user:pass@host/db", required=True),
            NodeProperty("Query", "query", "code", default="SELECT 1"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text

        url = parameters.get("connection_url", "")
        db_id = parameters.get("database_id") or parameters.get("_databaseId")
        if db_id and context.get("_database_urls"):
            url = context["_database_urls"].get(str(db_id), url)

        engine = create_async_engine(url)
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text(parameters.get("query", "SELECT 1")))
                if result.returns_rows:
                    rows = [dict(r._mapping) for r in result.fetchall()]
                    return {"rows": rows, "count": len(rows)}
                await conn.commit()
                return {"rows": [], "count": 0, "rowcount": result.rowcount}
        finally:
            await engine.dispose()


@register_node
class ExecuteWorkflowNode(BaseNode):
    description = NodeDescription(
        display_name="Execute Sub-Workflow",
        name="execute_workflow",
        category="Integrations",
        icon="box",
        color="#6366f1",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty("Workflow ID", "workflow_id", "number", required=True),
            NodeProperty("Input JSON", "input", "json", default="{}"),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        from sqlalchemy import select
        from app.database import async_session_factory
        from app.models.workflow import Workflow
        from app.engine.runtime_context import RuntimeContext
        from app.executions.workflow_executor import WorkflowExecutor

        wf_id = int(parameters.get("workflow_id"))
        inp = parameters.get("input", {})
        if isinstance(inp, str) and inp.strip():
            inp = json.loads(inp)

        async with async_session_factory() as db:
            result = await db.execute(select(Workflow).where(Workflow.id == wf_id))
            wf = result.scalar_one_or_none()
            if not wf:
                raise ValueError(f"Workflow {wf_id} not found")
            nodes = json.loads(wf.nodes) if isinstance(wf.nodes, str) else wf.nodes
            connections = json.loads(wf.connections) if isinstance(wf.connections, str) else wf.connections

        ctx = RuntimeContext(json=inp or {}, user_id=context.get("user_id"))
        executor = WorkflowExecutor(nodes, connections, ctx)
        sub_result = await executor.execute()
        return {"sub_workflow_id": wf_id, "result": sub_result.get("finalOutput", {}), "status": sub_result.get("status")}
