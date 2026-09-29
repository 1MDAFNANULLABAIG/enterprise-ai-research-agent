import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResearchTask(Base):
    __tablename__ = "research_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    document_ids_json = Column(Text, default="[]", nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, PLANNING, RESEARCHING, COMPLETED, FAILED
    plan_json = Column(Text, default="[]", nullable=True)  # List of steps
    execution_steps_json = Column(Text, default="[]", nullable=True)  # Tool execution traces
    report_json = Column(Text, default="{}", nullable=True)  # Final structured report
    metrics_json = Column(Text, default="{}", nullable=True)  # Latency, tool call counts
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="research_tasks")
