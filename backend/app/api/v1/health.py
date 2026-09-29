import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import settings
from app.vectorstore.factory import get_vector_store

router = APIRouter(tags=["Health & Observability"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time()
    }

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    vstore_ok = False
    try:
        vstore = get_vector_store()
        vstore_ok = vstore is not None
    except Exception:
        vstore_ok = False

    return {
        "status": "ready" if (db_ok and vstore_ok) else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "vector_store": "ready" if vstore_ok else "unavailable",
        "llm_provider": settings.DEFAULT_LLM_PROVIDER
    }
