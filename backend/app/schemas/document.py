from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DocumentBase(BaseModel):
    filename: str

class DocumentUpdate(BaseModel):
    filename: Optional[str] = None

class DocumentChunkResponse(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    page_number: int
    section_title: Optional[str] = None
    content: str
    token_count: int

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    original_name: str
    file_type: str
    file_size_bytes: int
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentSearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page_number: int
    section_title: Optional[str] = None
    content: str
    similarity_score: float
