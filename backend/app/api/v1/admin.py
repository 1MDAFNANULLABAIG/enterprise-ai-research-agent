import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.conversation import Conversation, Message
from app.models.research import ResearchTask
from app.models.audit import AuditLog, UsageLog
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin & System Governance"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "status": l.status,
            "ip_address": l.ip_address,
            "details": json.loads(l.details_json) if l.details_json else {},
            "created_at": l.created_at
        })
    return results

@router.get("/metrics")
def get_system_metrics(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    total_users = db.query(User).count()
    total_docs = db.query(Document).count()
    indexed_docs = db.query(Document).filter(Document.status == "INDEXED").count()
    total_chunks = db.query(DocumentChunk).count()
    total_conversations = db.query(Conversation).count()
    total_research = db.query(ResearchTask).count()
    total_queries = db.query(UsageLog).count()

    # Latency aggregates
    avg_retrieval = db.query(func.avg(UsageLog.retrieval_latency_ms)).scalar() or 0.0
    avg_llm = db.query(func.avg(UsageLog.llm_latency_ms)).scalar() or 0.0
    avg_total = db.query(func.avg(UsageLog.total_latency_ms)).scalar() or 0.0
    total_tokens = db.query(func.sum(UsageLog.total_tokens)).scalar() or 0

    recent_usage = db.query(UsageLog).order_by(UsageLog.created_at.desc()).limit(15).all()

    return {
        "overview": {
            "total_users": total_users,
            "total_documents": total_docs,
            "indexed_documents": indexed_docs,
            "total_chunks": total_chunks,
            "total_conversations": total_conversations,
            "total_research_tasks": total_research,
            "total_queries_performed": total_queries
        },
        "performance": {
            "avg_retrieval_latency_ms": round(float(avg_retrieval), 2),
            "avg_llm_latency_ms": round(float(avg_llm), 2),
            "avg_total_latency_ms": round(float(avg_total), 2),
            "total_tokens_consumed": int(total_tokens)
        },
        "recent_queries": [
            {
                "id": u.id,
                "user_id": u.user_id,
                "type": u.query_type,
                "retrieval_ms": u.retrieval_latency_ms,
                "llm_ms": u.llm_latency_ms,
                "total_ms": u.total_latency_ms,
                "tokens": u.total_tokens,
                "chunks": u.retrieved_chunk_count,
                "created_at": u.created_at
            }
            for u in recent_usage
        ]
    }
