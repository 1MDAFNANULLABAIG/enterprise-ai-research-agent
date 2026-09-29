import httpx
from typing import List
from app.embeddings.base import EmbeddingProviderBase
from app.core.config import settings

class GeminiEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "text-embedding-004"
        self._dim = 768

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # If API key is not present or request fails, gracefully fallback
        if not self.api_key:
            from app.embeddings.local_provider import LocalSemanticEmbeddingProvider
            return LocalSemanticEmbeddingProvider(self._dim).embed_texts(texts)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents?key={self.api_key}"
        requests_payload = [{"model": f"models/{self.model}", "content": {"parts": [{"text": t}]}} for t in texts]
        
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, json={"requests": requests_payload})
                if resp.status_code == 200:
                    data = resp.json()
                    return [item["values"] for item in data.get("embeddings", [])]
        except Exception:
            pass

        from app.embeddings.local_provider import LocalSemanticEmbeddingProvider
        return LocalSemanticEmbeddingProvider(self._dim).embed_texts(texts)

    def embed_query(self, query: str) -> List[float]:
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self._dim

class OpenAIEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "text-embedding-3-small"
        self._dim = 1536

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            from app.embeddings.local_provider import LocalSemanticEmbeddingProvider
            return LocalSemanticEmbeddingProvider(self._dim).embed_texts(texts)

        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json={"input": texts, "model": self.model})
                if resp.status_code == 200:
                    data = resp.json()
                    return [item["embedding"] for item in data.get("data", [])]
        except Exception:
            pass

        from app.embeddings.local_provider import LocalSemanticEmbeddingProvider
        return LocalSemanticEmbeddingProvider(self._dim).embed_texts(texts)

    def embed_query(self, query: str) -> List[float]:
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self._dim
