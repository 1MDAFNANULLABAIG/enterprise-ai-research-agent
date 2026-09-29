import json
import httpx
from typing import Optional, AsyncIterator
from app.llm.base import LLMProviderBase
from app.llm.fallback_provider import LocalFallbackLLMProvider
from app.core.config import settings

class GeminiLLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        self.fallback = LocalFallbackLLMProvider()

    @property
    def name(self) -> str:
        return "gemini"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> str:
        if not self.api_key:
            return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens}
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception:
            pass

        return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        if not self.api_key:
            async for token in self.fallback.generate_stream(prompt, system_prompt, temperature, max_tokens):
                yield token
            return

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens}
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str:
                                    try:
                                        chunk_json = json.loads(data_str)
                                        candidates = chunk_json.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            if parts and "text" in parts[0]:
                                                yield parts[0]["text"]
                                    except Exception:
                                        continue
                        return
        except Exception:
            pass

        # Fallback if streaming failed
        async for token in self.fallback.generate_stream(prompt, system_prompt, temperature, max_tokens):
            yield token


class OpenAILLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.fallback = LocalFallbackLLMProvider()

    @property
    def name(self) -> str:
        return "openai"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> str:
        if not self.api_key:
            return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"model": self.model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
        except Exception:
            pass

        return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        if not self.api_key:
            async for token in self.fallback.generate_stream(prompt, system_prompt, temperature, max_tokens):
                yield token
            return

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"model": self.model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "stream": True}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: ") and not line.endswith("[DONE]"):
                                data_str = line[6:].strip()
                                try:
                                    chunk_json = json.loads(data_str)
                                    choices = chunk_json.get("choices", [])
                                    if choices and "delta" in choices[0]:
                                        delta_content = choices[0]["delta"].get("content", "")
                                        if delta_content:
                                            yield delta_content
                                except Exception:
                                    continue
                        return
        except Exception:
            pass

        async for token in self.fallback.generate_stream(prompt, system_prompt, temperature, max_tokens):
            yield token


class AnthropicLLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model: str = "claude-3-5-haiku-latest"):
        self.api_key = api_key
        self.model = model
        self.fallback = LocalFallbackLLMProvider()

    @property
    def name(self) -> str:
        return "anthropic"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> str:
        if not self.api_key:
            return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("content", [])
                    if content and "text" in content[0]:
                        return content[0]["text"]
        except Exception:
            pass

        return await self.fallback.generate(prompt, system_prompt, temperature, max_tokens)

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        # For simplicity, generate full text or fallback
        full_text = await self.generate(prompt, system_prompt, temperature, max_tokens)
        for token in full_text.split(" "):
            yield token + " "
