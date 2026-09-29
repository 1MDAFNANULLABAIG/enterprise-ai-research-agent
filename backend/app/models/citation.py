import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from app.core.database import Base

class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_index = Column(Integer, nullable=False, default=1)
    document_id = Column(String(36), index=True, nullable=False)
    document_name = Column(String(255), nullable=False)
    chunk_id = Column(String(36), nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    section_title = Column(String(255), nullable=True)
    excerpt = Column(Text, nullable=False)
    score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
