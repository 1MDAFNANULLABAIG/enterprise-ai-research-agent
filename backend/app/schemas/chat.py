from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CitationItem(BaseModel):
    source_index: int
    document_id: str
    document_name: str
    chunk_id: str
    page_number: int
    section_title: Optional[str] = None
    excerpt: str
    score: float

class LatencyMetrics(BaseModel):
    retrieval_ms: float = 0.0
    llm_ms: float = 0.0
    total_ms: float = 0.0
    tokens: int = 0

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    citations: List[CitationItem] = []
    metrics: Optional[LatencyMetrics] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    document_ids: List[str] = []

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    document_ids: Optional[List[str]] = None

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    document_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    document_ids: Optional[List[str]] = None
    provider: Optional[str] = None  # gemini, openai, anthropic, fallback
    stream: bool = False

class FeedbackRequest(BaseModel):
    feedback: str  # "like", "dislike", None
