from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.settings import AppSettingsResponse, AppSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Application Settings"])

@router.get("", response_model=AppSettingsResponse)
def get_settings(current_user: User = Depends(get_current_user)):
    return AppSettingsResponse(
        default_llm_provider=settings.DEFAULT_LLM_PROVIDER,
        gemini_model=settings.GEMINI_MODEL,
        openai_model=settings.OPENAI_MODEL,
        anthropic_model=settings.ANTHROPIC_MODEL,
        has_gemini_key=bool(settings.GEMINI_API_KEY),
        has_openai_key=bool(settings.OPENAI_API_KEY),
        has_anthropic_key=bool(settings.ANTHROPIC_API_KEY),
        vector_db_type=settings.VECTOR_DB_TYPE,
        embedding_provider=settings.EMBEDDING_PROVIDER,
        embedding_dimension=settings.EMBEDDING_DIMENSION,
        rag_top_k=settings.RAG_TOP_K,
        rag_similarity_threshold=settings.RAG_SIMILARITY_THRESHOLD,
        rag_chunk_size=settings.RAG_CHUNK_SIZE,
        rag_chunk_overlap=settings.RAG_CHUNK_OVERLAP,
    )

@router.put("", response_model=AppSettingsResponse)
def update_settings(
    update_in: AppSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    if update_in.default_llm_provider:
        settings.DEFAULT_LLM_PROVIDER = update_in.default_llm_provider
    if update_in.gemini_api_key:
        settings.GEMINI_API_KEY = update_in.gemini_api_key
    if update_in.openai_api_key:
        settings.OPENAI_API_KEY = update_in.openai_api_key
    if update_in.anthropic_api_key:
        settings.ANTHROPIC_API_KEY = update_in.anthropic_api_key
    if update_in.gemini_model:
        settings.GEMINI_MODEL = update_in.gemini_model
    if update_in.openai_model:
        settings.OPENAI_MODEL = update_in.openai_model
    if update_in.anthropic_model:
        settings.ANTHROPIC_MODEL = update_in.anthropic_model
    if update_in.rag_top_k is not None:
        settings.RAG_TOP_K = update_in.rag_top_k
    if update_in.rag_similarity_threshold is not None:
        settings.RAG_SIMILARITY_THRESHOLD = update_in.rag_similarity_threshold
    if update_in.rag_chunk_size is not None:
        settings.RAG_CHUNK_SIZE = update_in.rag_chunk_size
    if update_in.rag_chunk_overlap is not None:
        settings.RAG_CHUNK_OVERLAP = update_in.rag_chunk_overlap

    return get_settings(current_user=current_user)
