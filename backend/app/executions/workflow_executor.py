"""Workflow execution engine."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict, deque
from typing import Any

from app.engine.expression_evaluator import evaluate_expressions
from app.engine.node_registry import get_node_class
from app.engine.runtime_context import NodeRunData, RuntimeContext

logger = logging.getLogger(__name__)

AI_HANDLES = (
    "ai_languageModel", "ai_tool", "ai_memory", "ai_embeddings", "ai_outputParser",
    "ai_vectorStore", "ai_retriever",
)


class WorkflowExecutor:
    def __init__(
        self,
        nodes: list[dict[str, Any]],
        connections: list[dict[str, Any]],
        context: RuntimeContext,
        *,
        node_timeout: int = 300,
        credential_cache: dict[str, dict[str, Any]] | None = None,
        database_cache: dict[str, str] | None = None,
    ):
        self.nodes = {n["id"]: n for n in nodes}
        self.connections = connections
        self.context = context
        self.node_timeout = node_timeout
        self.credential_cache = credential_cache or {}
        self.database_cache = database_cache or {}

    async def execute(self) -> dict[str, Any]:
        adj, in_degree = self._build_graph()
        topo_order = self._topological_sort(adj, in_degree)
        if not topo_order:
            return {"status": "error", "error": "No executable nodes (possible cycle)"}

        results: dict[str, Any] = {}
        skipped: set[str] = set()

        for node_id in topo_order:
            if self.context.cancelled or node_id in skipped:
                continue

            node_def = self.nodes.get(node_id)
            if not node_def:
                continue

            if self._is_disabled(node_def):
                node_type = node_def.get("type") or node_def.get("data", {}).get("type", "")
                run_data = NodeRunData(node_id=node_id, node_type=node_type)
                run_data.mark_skipped()
                self.context.node_run_data[node_id] = run_data
                results[node_id] = run_data.to_dict()
                continue

            node_type = node_def.get("type") or node_def.get("data", {}).get("type", "")
            run_data = NodeRunData(node_id=node_id, node_type=node_type)
            self.context.node_run_data[node_id] = run_data

            parameters = node_def.get("data", {}).get("parameters", node_def.get("parameters", {}))
            resolved = evaluate_expressions(parameters, self.context.to_dict())
            self.context.reset_ai_bindings()
            self._bind_ai_connections(node_id)

            exec_context = self.context.to_dict()
            cred_id = resolved.get("_credentialId")
            if cred_id is not None and str(cred_id) in self.credential_cache:
                exec_context["credentials"] = self.credential_cache[str(cred_id)]
            db_id = resolved.get("database_id")
            if db_id is not None and str(db_id) in self.database_cache:
                exec_context["_database_urls"] = {str(db_id): self.database_cache[str(db_id)]}

            node_cls = get_node_class(node_type)
            if not node_cls:
                run_data.mark_error(f"Unknown node type: {node_type}")
                results[node_id] = run_data.to_dict()
                continue

            run_data.mark_started()
            run_data.input_data = resolved
            try:
                output = await asyncio.wait_for(
                    node_cls().execute(node_id, resolved, exec_context),
                    timeout=self.node_timeout,
                )
                run_data.mark_success(output)
                self.context.set_node_output(node_id, output)
                results[node_id] = run_data.to_dict()
                skipped.update(self._handle_branching(node_id, output))
            except asyncio.TimeoutError:
                run_data.mark_error(f"Timed out after {self.node_timeout}s")
                results[node_id] = run_data.to_dict()
                return {"status": "error", "error": f"Node '{node_id}' timed out", "nodeOutputs": results}
            except Exception as exc:
                run_data.mark_error(str(exc))
                results[node_id] = run_data.to_dict()
                logger.exception("Node %s failed", node_id)
                return {"status": "error", "error": str(exc), "errorNodeId": node_id, "nodeOutputs": results}

        return {"status": "success", "nodeOutputs": results, "finalOutput": self.context.json}

    async def execute_single_node(self, node_id: str) -> dict[str, Any]:
        """Run one node in isolation (for editor 'test step')."""
        node_def = self.nodes.get(node_id)
        if not node_def:
            return {"status": "error", "error": f"Node '{node_id}' not found", "nodeOutputs": {}}
        if self._is_disabled(node_def):
            return {"status": "error", "error": "Node is disabled", "nodeOutputs": {}}

        node_type = node_def.get("type") or node_def.get("data", {}).get("type", "")
        run_data = NodeRunData(node_id=node_id, node_type=node_type)
        self.context.node_run_data[node_id] = run_data

        parameters = node_def.get("data", {}).get("parameters", node_def.get("parameters", {}))
        resolved = evaluate_expressions(parameters, self.context.to_dict())
        self.context.reset_ai_bindings()
        self._bind_ai_connections(node_id)

        exec_context = self.context.to_dict()
        cred_id = resolved.get("_credentialId")
        if cred_id is not None and str(cred_id) in self.credential_cache:
            exec_context["credentials"] = self.credential_cache[str(cred_id)]
        db_id = resolved.get("database_id")
        if db_id is not None and str(db_id) in self.database_cache:
            exec_context["_database_urls"] = {str(db_id): self.database_cache[str(db_id)]}

        node_cls = get_node_class(node_type)
        if not node_cls:
            run_data.mark_error(f"Unknown node type: {node_type}")
            return {"status": "error", "error": run_data.error, "nodeOutputs": {node_id: run_data.to_dict()}}

        run_data.mark_started()
        run_data.input_data = resolved
        try:
            output = await asyncio.wait_for(
                node_cls().execute(node_id, resolved, exec_context),
                timeout=self.node_timeout,
            )
            run_data.mark_success(output)
            self.context.set_node_output(node_id, output)
            return {"status": "success", "nodeOutputs": {node_id: run_data.to_dict()}, "finalOutput": output}
        except asyncio.TimeoutError:
            run_data.mark_error(f"Timed out after {self.node_timeout}s")
            return {"status": "error", "error": run_data.error, "nodeOutputs": {node_id: run_data.to_dict()}}
        except Exception as exc:
            run_data.mark_error(str(exc))
            return {"status": "error", "error": str(exc), "nodeOutputs": {node_id: run_data.to_dict()}}

    @staticmethod
    def _is_disabled(node_def: dict[str, Any]) -> bool:
        return bool(node_def.get("disabled") or node_def.get("data", {}).get("disabled"))

    def _build_graph(self) -> tuple[dict[str, list[str]], dict[str, int]]:
        adj: dict[str, list[str]] = defaultdict(list)
        in_degree: dict[str, int] = {nid: 0 for nid in self.nodes}
        for conn in self.connections:
            sh = conn.get("sourceHandle", "main-out")
            th = conn.get("targetHandle", "main-in")
            if any(h in sh for h in AI_HANDLES) or any(h in th for h in AI_HANDLES):
                continue
            if "main" in sh or sh.startswith("output"):
                adj[conn["source"]].append(conn["target"])
                in_degree[conn["target"]] = in_degree.get(conn["target"], 0) + 1
        return adj, in_degree

    def _topological_sort(self, adj: dict, in_degree: dict) -> list[str]:
        queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
        order: list[str] = []
        while queue:
            nid = queue.popleft()
            order.append(nid)
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        return order

    def _bind_ai_connections(self, node_id: str) -> None:
        for conn in self.connections:
            if conn.get("target") != node_id:
                continue
            th = conn.get("targetHandle", "")
            src_out = self.context.node_outputs.get(conn["source"], {})
            if "ai_languageModel" in th:
                self.context.ai_language_model = src_out.get("model") or src_out
            elif "ai_memory" in th:
                self.context.ai_memory = src_out.get("memory") or src_out
            elif "ai_tool" in th:
                tool = src_out.get("tool") or src_out
                if tool:
                    self.context.ai_tools.append(tool)
            elif "ai_embeddings" in th:
                self.context.ai_embeddings = src_out.get("embeddings") or src_out
            elif "ai_vectorStore" in th:
                self.context.ai_vector_store = src_out.get("vectorStore") or src_out
            elif "ai_retriever" in th:
                self.context.ai_retriever = src_out.get("retriever") or src_out
            elif "ai_outputParser" in th:
                self.context.ai_output_parser = src_out.get("outputParser") or src_out

    def _handle_branching(self, node_id: str, output: dict) -> set[str]:
        skipped: set[str] = set()
        active = output.get("activeOutput")
        if active is None:
            return skipped
        for conn in self.connections:
            if conn.get("source") != node_id:
                continue
            if conn.get("sourceHandle") != active:
                target = conn.get("target", "")
                skipped.add(target)
                skipped.update(self._downstream(target))
        return skipped

    def _downstream(self, node_id: str) -> set[str]:
        result: set[str] = set()
        queue = deque([node_id])
        while queue:
            cur = queue.popleft()
            for conn in self.connections:
                if conn.get("source") == cur:
                    t = conn.get("target", "")
                    if t not in result:
                        result.add(t)
                        queue.append(t)
        return result
