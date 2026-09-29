import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from app.core.database import Base

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    test_count = Column(Integer, nullable=False, default=0)
    precision_score = Column(Float, nullable=False, default=0.0)
    recall_score = Column(Float, nullable=False, default=0.0)
    faithfulness_score = Column(Float, nullable=False, default=0.0)
    citation_accuracy = Column(Float, nullable=False, default=0.0)
    avg_latency_ms = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="COMPLETED", nullable=False)
    details_json = Column(Text, default="[]", nullable=True)  # Detailed question-level results
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
