from typing import Optional
from app.core.config import settings
from app.llm.base import LLMProviderBase
from app.llm.fallback_provider import LocalFallbackLLMProvider
from app.llm.api_providers import GeminiLLMProvider, OpenAILLMProvider, AnthropicLLMProvider

def get_llm_provider(provider_name: Optional[str] = None) -> LLMProviderBase:
    selected = (provider_name or settings.DEFAULT_LLM_PROVIDER).lower()

    if selected == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiLLMProvider(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
    elif selected == "openai":
        if settings.OPENAI_API_KEY:
            return OpenAILLMProvider(settings.OPENAI_API_KEY, settings.OPENAI_MODEL)
    elif selected == "anthropic":
        if settings.ANTHROPIC_API_KEY:
            return AnthropicLLMProvider(settings.ANTHROPIC_API_KEY, settings.ANTHROPIC_MODEL)

    # If key missing or selected is fallback:
    return LocalFallbackLLMProvider()
