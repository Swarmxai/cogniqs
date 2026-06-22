import pytest

import app.nodes  # noqa: F401 — load node registry
from app.engine.runtime_context import RuntimeContext
from app.executions.workflow_executor import WorkflowExecutor


@pytest.mark.asyncio
async def test_simple_workflow_execution():
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {"type": "manual_trigger", "parameters": {"inputJson": '{"x": 1}'}}},
        {"id": "s1", "type": "set_node", "data": {"type": "set_node", "parameters": {"fields": '{"y": 2}'}}},
    ]
    connections = [
        {"source": "t1", "target": "s1", "sourceHandle": "main-out", "targetHandle": "main-in"},
    ]
    ctx = RuntimeContext(json={})
    executor = WorkflowExecutor(nodes, connections, ctx)
    result = await executor.execute()
    assert result["status"] == "success"
    assert result["finalOutput"]["x"] == 1
    assert result["finalOutput"]["y"] == 2


@pytest.mark.asyncio
async def test_if_branching():
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {"type": "manual_trigger", "parameters": {}}},
        {"id": "if1", "type": "if_node", "data": {"type": "if_node", "parameters": {"field": "flag", "operator": "equals", "value": "yes"}}},
        {"id": "s1", "type": "set_node", "data": {"type": "set_node", "parameters": {"fields": '{"branch": "true"}'}}},
        {"id": "s2", "type": "set_node", "data": {"type": "set_node", "parameters": {"fields": '{"branch": "false"}'}}},
    ]
    connections = [
        {"source": "t1", "target": "if1", "sourceHandle": "main-out", "targetHandle": "main-in"},
        {"source": "if1", "target": "s1", "sourceHandle": "main-true", "targetHandle": "main-in"},
        {"source": "if1", "target": "s2", "sourceHandle": "main-false", "targetHandle": "main-in"},
    ]
    ctx = RuntimeContext(json={"flag": "yes"})
    result = await WorkflowExecutor(nodes, connections, ctx).execute()
    assert result["status"] == "success"
    assert result["finalOutput"]["branch"] == "true"


@pytest.mark.asyncio
async def test_disabled_node_is_skipped():
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {"type": "manual_trigger", "parameters": {}}},
        {
            "id": "s1",
            "type": "set_node",
            "disabled": True,
            "data": {"type": "set_node", "parameters": {"fields": '{"skipped": true}'}},
        },
        {"id": "s2", "type": "set_node", "data": {"type": "set_node", "parameters": {"fields": '{"ran": true}'}}},
    ]
    connections = [
        {"source": "t1", "target": "s1", "sourceHandle": "main-out", "targetHandle": "main-in"},
        {"source": "s1", "target": "s2", "sourceHandle": "main-out", "targetHandle": "main-in"},
    ]
    ctx = RuntimeContext(json={})
    result = await WorkflowExecutor(nodes, connections, ctx).execute()
    assert result["status"] == "success"
    assert result["nodeOutputs"]["s1"]["status"] == "skipped"
    assert result["nodeOutputs"]["s2"]["status"] == "success"
    assert result["finalOutput"].get("ran") is True
    assert "skipped" not in result["finalOutput"]
