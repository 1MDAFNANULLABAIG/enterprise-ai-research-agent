from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk

router = APIRouter(prefix="/citations", tags=["Citations Intelligence"])

@router.get("/{chunk_id}")
def get_citation_detail(
    chunk_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chunk = db.query(DocumentChunk).filter(
        DocumentChunk.id == chunk_id,
        DocumentChunk.user_id == current_user.id
    ).first()

    if not chunk:
        # Check by vector_id
        chunk = db.query(DocumentChunk).filter(
            DocumentChunk.vector_id == chunk_id,
            DocumentChunk.user_id == current_user.id
        ).first()

    if not chunk:
        raise HTTPException(status_code=404, detail="Cited chunk not found or access denied")

    doc = db.query(Document).filter(Document.id == chunk.document_id).first()

    # Get surrounding context (prior and subsequent chunk)
    prev_chunk = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == chunk.document_id,
        DocumentChunk.chunk_index == chunk.chunk_index - 1
    ).first()

    next_chunk = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == chunk.document_id,
        DocumentChunk.chunk_index == chunk.chunk_index + 1
    ).first()

    return {
        "chunk_id": chunk.id,
        "document_id": chunk.document_id,
        "document_name": doc.filename if doc else "Document",
        "file_type": doc.file_type if doc else "txt",
        "page_number": chunk.page_number,
        "section_title": chunk.section_title,
        "chunk_index": chunk.chunk_index,
        "content": chunk.content,
        "prev_context": prev_chunk.content if prev_chunk else None,
        "next_context": next_chunk.content if next_chunk else None
    }
