import os
from pathlib import Path
from typing import List, Optional, Any
from pydantic_settings import BaseSettings
from pydantic import field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise AI Research & Document Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # Server binding (Render dynamically assigns PORT)
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security & Auth
    SECRET_KEY: str = "enterprise_super_secure_jwt_secret_key_change_in_production_2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/enterprise_agent.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Any):
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # Redis & Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS_CACHE: bool = False

    # Vector Database
    VECTOR_DB_TYPE: str = "inmemory"  # "inmemory" or "qdrant"
    QDRANT_URL: Optional[str] = None  # None uses embedded/in-memory, or "http://localhost:6333" or "https://xyz.qdrant.tech"
    QDRANT_API_KEY: Optional[str] = None  # Required for Qdrant Cloud clusters
    QDRANT_COLLECTION: str = "enterprise_document_chunks"

    # LLM Providers
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "anthropic", "fallback"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Models
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-latest"

    # Embedding Providers
    EMBEDDING_PROVIDER: str = "local"  # "local", "gemini", "openai"
    EMBEDDING_DIMENSION: int = 384

    # RAG Settings
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.55
    RAG_CHUNK_SIZE: int = 600
    RAG_CHUNK_OVERLAP: int = 100

    # Storage (Local or S3-Compatible)
    STORAGE_DIR: str = str(BASE_DIR / "storage" / "uploads")
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".csv"]

    # S3 Object Storage (Production Optional)
    USE_S3_STORAGE: bool = False
    S3_BUCKET: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_REGION: Optional[str] = "us-east-1"
    S3_ENDPOINT_URL: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
