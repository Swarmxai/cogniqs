import pytest

from app.engine.expression_evaluator import evaluate_expressions


def test_evaluate_json_expression():
    ctx = {"json": {"message": "hello", "count": 5}}
    assert evaluate_expressions("{{ $json.message }}", ctx) == "hello"
    assert evaluate_expressions("{{ $json.count }}", ctx) == 5


def test_evaluate_node_expression():
    ctx = {
        "json": {},
        "node_outputs": {"node-1": {"response": "world"}},
    }
    assert evaluate_expressions("{{ $node.node-1.response }}", ctx) == "world"


def test_nested_dict_evaluation():
    ctx = {"json": {"user": {"name": "Alice"}}}
    result = evaluate_expressions({"greeting": "Hi {{ $json.user.name }}"}, ctx)
    assert result["greeting"] == "Hi Alice"
