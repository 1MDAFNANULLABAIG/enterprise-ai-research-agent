from app.core.config import settings
from app.embeddings.base import EmbeddingProviderBase
from app.embeddings.local_provider import LocalSemanticEmbeddingProvider
from app.embeddings.api_providers import GeminiEmbeddingProvider, OpenAIEmbeddingProvider

def get_embedding_provider() -> EmbeddingProviderBase:
    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiEmbeddingProvider(settings.GEMINI_API_KEY)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider(settings.OPENAI_API_KEY)
    else:
        return LocalSemanticEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
