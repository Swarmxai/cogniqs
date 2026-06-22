"""Unified LLM calling service — single entry point for all providers."""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

COST_PER_1K = {
    "gpt-4o": {"prompt": 0.005, "completion": 0.015},
    "gpt-4o-mini": {"prompt": 0.00015, "completion": 0.0006},
    "claude-3-5-sonnet": {"prompt": 0.003, "completion": 0.015},
    "gemini-1.5-flash": {"prompt": 0.000075, "completion": 0.0003},
}


class LLMService:
    """Provider-agnostic LLM client."""

    @staticmethod
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def chat(
        model_config: dict[str, Any],
        messages: list[dict[str, str]],
        *,
        tools: list[dict] | None = None,
        stream: bool = False,
    ) -> dict[str, Any]:
        provider = model_config.get("provider", "openai")
        handler = {
            "openai": LLMService._call_openai,
            "anthropic": LLMService._call_anthropic,
            "gemini": LLMService._call_gemini,
            "ollama": LLMService._call_ollama,
            "groq": LLMService._call_groq,
            "azure": LLMService._call_azure,
            "mistral": LLMService._call_mistral,
            "deepseek": LLMService._call_deepseek,
        }.get(provider)
        if not handler:
            raise ValueError(f"Unsupported provider: {provider}")
        return await handler(model_config, messages, tools=tools, stream=stream)

    @staticmethod
    async def _call_openai(
        cfg: dict, messages: list, *, tools=None, stream=False
    ) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.OPENAI_API_KEY
        model = cfg.get("model", "gpt-4o-mini")
        payload: dict[str, Any] = {"model": model, "messages": messages}
        if tools:
            payload["tools"] = tools
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]["message"]
        usage = data.get("usage", {})
        return {
            "content": choice.get("content", ""),
            "tool_calls": choice.get("tool_calls"),
            "usage": {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
            "model": model,
            "provider": "openai",
        }

    @staticmethod
    async def _call_anthropic(
        cfg: dict, messages: list, *, tools=None, stream=False
    ) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.ANTHROPIC_API_KEY
        model = cfg.get("model", "claude-3-5-sonnet-20241022")
        system = ""
        api_messages = []
        for m in messages:
            if m["role"] == "system":
                system = m["content"]
            else:
                api_messages.append(m)
        payload: dict[str, Any] = {"model": model, "max_tokens": 4096, "messages": api_messages}
        if system:
            payload["system"] = system
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        content = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
        usage = data.get("usage", {})
        return {
            "content": content,
            "usage": {
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            },
            "model": model,
            "provider": "anthropic",
        }

    @staticmethod
    async def _call_gemini(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.GOOGLE_API_KEY
        model = cfg.get("model", "gemini-1.5-flash")
        contents = [{"role": "user" if m["role"] != "assistant" else "model", "parts": [{"text": m["content"]}]} for m in messages if m["role"] != "system"]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, json={"contents": contents})
            resp.raise_for_status()
            data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"content": text, "usage": {}, "model": model, "provider": "gemini"}

    @staticmethod
    async def _call_ollama(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        base = cfg.get("baseUrl") or settings.OLLAMA_BASE_URL
        model = cfg.get("model", "llama3.2")
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(f"{base}/api/chat", json={"model": model, "messages": messages, "stream": False})
            resp.raise_for_status()
            data = resp.json()
        return {"content": data["message"]["content"], "usage": {}, "model": model, "provider": "ollama"}

    @staticmethod
    async def _call_groq(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.GROQ_API_KEY
        model = cfg.get("model", "llama-3.3-70b-versatile")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]["message"]
        usage = data.get("usage", {})
        return {
            "content": choice.get("content", ""),
            "usage": usage,
            "model": model,
            "provider": "groq",
        }

    @staticmethod
    async def _call_azure(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.AZURE_OPENAI_API_KEY
        endpoint = (cfg.get("endpoint") or settings.AZURE_OPENAI_ENDPOINT).rstrip("/")
        deployment = cfg.get("model", settings.AZURE_OPENAI_DEPLOYMENT)
        version = cfg.get("apiVersion", settings.AZURE_OPENAI_API_VERSION)
        url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={version}"
        payload: dict[str, Any] = {"messages": messages}
        if tools:
            payload["tools"] = tools
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                url,
                headers={"api-key": api_key, "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]["message"]
        return {"content": choice.get("content", ""), "usage": data.get("usage", {}), "model": deployment, "provider": "azure"}

    @staticmethod
    async def _call_mistral(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.MISTRAL_API_KEY
        model = cfg.get("model", "mistral-small-latest")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]["message"]
        return {"content": choice.get("content", ""), "usage": data.get("usage", {}), "model": model, "provider": "mistral"}

    @staticmethod
    async def _call_deepseek(cfg: dict, messages: list, *, tools=None, stream=False) -> dict[str, Any]:
        api_key = cfg.get("apiKey") or settings.DEEPSEEK_API_KEY
        model = cfg.get("model", "deepseek-chat")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]["message"]
        return {"content": choice.get("content", ""), "usage": data.get("usage", {}), "model": model, "provider": "deepseek"}

    @staticmethod
    async def stream_chat(model_config: dict[str, Any], messages: list[dict[str, str]]):
        """Yield token strings from OpenAI-compatible streaming APIs."""
        provider = model_config.get("provider", "openai")
        if provider in ("openai", "groq", "azure", "deepseek", "mistral"):
            async for token in LLMService._stream_openai_compat(model_config, messages, provider):
                yield token
        else:
            result = await LLMService.chat(model_config, messages)
            yield result.get("content", "")

    @staticmethod
    async def _stream_openai_compat(cfg: dict, messages: list, provider: str):
        urls_keys = {
            "openai": ("https://api.openai.com/v1/chat/completions", cfg.get("apiKey") or settings.OPENAI_API_KEY, "Bearer"),
            "groq": ("https://api.groq.com/openai/v1/chat/completions", cfg.get("apiKey") or settings.GROQ_API_KEY, "Bearer"),
            "deepseek": ("https://api.deepseek.com/chat/completions", cfg.get("apiKey") or settings.DEEPSEEK_API_KEY, "Bearer"),
            "mistral": ("https://api.mistral.ai/v1/chat/completions", cfg.get("apiKey") or settings.MISTRAL_API_KEY, "Bearer"),
        }
        if provider == "azure":
            endpoint = (cfg.get("endpoint") or settings.AZURE_OPENAI_ENDPOINT).rstrip("/")
            deployment = cfg.get("model", settings.AZURE_OPENAI_DEPLOYMENT)
            version = cfg.get("apiVersion", settings.AZURE_OPENAI_API_VERSION)
            url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={version}"
            api_key = cfg.get("apiKey") or settings.AZURE_OPENAI_API_KEY
            headers = {"api-key": api_key, "Content-Type": "application/json"}
        else:
            url, api_key, scheme = urls_keys[provider]
            headers = {"Authorization": f"{scheme} {api_key}", "Content-Type": "application/json"}

        model = cfg.get("model", "gpt-4o-mini")
        payload = {"model": model, "messages": messages, "stream": True}
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    chunk = line[6:]
                    if chunk.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(chunk)
                        delta = data["choices"][0].get("delta", {})
                        if token := delta.get("content"):
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    @staticmethod
    def estimate_cost(model: str, usage: dict[str, int]) -> float:
        rates = COST_PER_1K.get(model, {"prompt": 0.001, "completion": 0.002})
        return (
            usage.get("prompt_tokens", 0) / 1000 * rates["prompt"]
            + usage.get("completion_tokens", 0) / 1000 * rates["completion"]
        )

    @staticmethod
    async def embed(texts: list[str], model_config: dict[str, Any]) -> list[list[float]]:
        provider = model_config.get("provider", "openai")
        if provider == "openai":
            api_key = model_config.get("apiKey") or settings.OPENAI_API_KEY
            model = model_config.get("model", "text-embedding-3-small")
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": model, "input": texts},
                )
                resp.raise_for_status()
                data = resp.json()
            return [item["embedding"] for item in data["data"]]
        raise ValueError(f"Embeddings not supported for provider: {provider}")
