from typing import Optional, List
from pydantic import BaseModel

class AppSettingsResponse(BaseModel):
    default_llm_provider: str
    gemini_model: str
    openai_model: str
    anthropic_model: str
    has_gemini_key: bool
    has_openai_key: bool
    has_anthropic_key: bool
    vector_db_type: str
    embedding_provider: str
    embedding_dimension: int
    rag_top_k: int
    rag_similarity_threshold: float
    rag_chunk_size: int
    rag_chunk_overlap: int

class AppSettingsUpdate(BaseModel):
    default_llm_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    openai_model: Optional[str] = None
    anthropic_model: Optional[str] = None
    rag_top_k: Optional[int] = None
    rag_similarity_threshold: Optional[float] = None
    rag_chunk_size: Optional[int] = None
    rag_chunk_overlap: Optional[int] = None
