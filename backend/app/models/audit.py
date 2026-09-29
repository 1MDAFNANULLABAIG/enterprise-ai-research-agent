import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=True)
    action = Column(String(100), nullable=False)  # AUTH_LOGIN, DOC_UPLOAD, DOC_DELETE, CHAT_QUERY, etc.
    resource_type = Column(String(50), nullable=True)  # Document, Conversation, ResearchTask, User
    resource_id = Column(String(36), nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, FAILED, DENIED
    details_json = Column(Text, default="{}", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    query_type = Column(String(50), nullable=False)  # "chat", "research", "csv_analysis"
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    retrieval_latency_ms = Column(Float, default=0.0, nullable=False)
    llm_latency_ms = Column(Float, default=0.0, nullable=False)
    total_latency_ms = Column(Float, default=0.0, nullable=False)
    retrieved_chunk_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
