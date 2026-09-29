import time
import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, UsageLog

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("enterprise_ai")

class LatencyTracker:
    def __init__(self):
        self.start_time = time.perf_counter()
        self.retrieval_ms = 0.0
        self.llm_ms = 0.0
        self.total_ms = 0.0

    def record_retrieval(self, elapsed_ms: float):
        self.retrieval_ms = elapsed_ms

    def record_llm(self, elapsed_ms: float):
        self.llm_ms = elapsed_ms

    def finish(self) -> Dict[str, float]:
        self.total_ms = round((time.perf_counter() - self.start_time) * 1000, 2)
        return {
            "retrieval_ms": round(self.retrieval_ms, 2),
            "llm_ms": round(self.llm_ms, 2),
            "total_ms": self.total_ms,
        }

def log_audit_event(
    db: Session,
    user_id: Optional[str],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: str = "SUCCESS",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> None:
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            status=status,
            details_json=json.dumps(details or {}),
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()

def log_usage_metrics(
    db: Session,
    user_id: str,
    query_type: str,
    prompt_tokens: int,
    completion_tokens: int,
    retrieval_latency_ms: float,
    llm_latency_ms: float,
    total_latency_ms: float,
    retrieved_chunk_count: int = 0
) -> None:
    try:
        usage = UsageLog(
            user_id=user_id,
            query_type=query_type,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            retrieval_latency_ms=retrieval_latency_ms,
            llm_latency_ms=llm_latency_ms,
            total_latency_ms=total_latency_ms,
            retrieved_chunk_count=retrieved_chunk_count
        )
        db.add(usage)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record usage log: {e}")
        db.rollback()
