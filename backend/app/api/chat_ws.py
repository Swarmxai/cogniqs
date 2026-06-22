"""WebSocket streaming chat."""

from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.security import decode_token
from app.database import async_session_factory
from app.executions.service import ExecutionService
from app.models.workflow import Workflow
from app.services.session_store import (
    add_message,
    cleanup_stream,
    get_history,
    get_stream_queue,
    push_stream_done,
    push_stream_error,
)

router = APIRouter(tags=["websocket"])


async def _auth_ws(websocket: WebSocket) -> int | None:
    token = websocket.query_params.get("token") or websocket.headers.get("authorization", "").replace("Bearer ", "")
    if not token:
        return None
    try:
        payload = decode_token(token)
        return int(payload["sub"])
    except (ValueError, KeyError):
        return None


@router.websocket("/ws/chat/{workflow_id}")
async def chat_stream(websocket: WebSocket, workflow_id: int):
    await websocket.accept()
    user_id = await _auth_ws(websocket)
    if not user_id:
        await websocket.send_json({"type": "error", "content": "Unauthorized"})
        await websocket.close()
        return

    session_id = websocket.query_params.get("session_id", "default")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            message = data.get("message", "")
            session_id = data.get("session_id", session_id)

            await add_message(session_id, "user", message)
            history = await get_history(session_id)

            async with async_session_factory() as db:
                result = await db.execute(
                    select(Workflow).where(Workflow.id == workflow_id, Workflow.owner_id == user_id)
                )
                wf = result.scalar_one_or_none()
                if not wf:
                    await websocket.send_json({"type": "error", "content": "Workflow not found"})
                    continue

                trigger_data = {"message": message, "session_id": session_id, "history": history}
                execution = await ExecutionService.run_workflow(db, wf, trigger_data, user_id)
                await db.commit()

            result_data = json.loads(execution.result or "{}")
            final = result_data.get("finalOutput", {})
            response = final.get("response") or final.get("message") or final.get("answer", "")

            # Simulate streaming by chunking the response
            chunk_size = 8
            for i in range(0, len(response), chunk_size):
                chunk = response[i : i + chunk_size]
                await websocket.send_json({"type": "token", "content": chunk})

            await add_message(session_id, "assistant", response)
            await websocket.send_json({"type": "done", "content": response, "execution_id": execution.id})

    except WebSocketDisconnect:
        pass
    finally:
        cleanup_stream(session_id)
