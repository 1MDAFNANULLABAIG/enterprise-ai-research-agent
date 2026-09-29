import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.observability import log_audit_event
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentChunkResponse, DocumentUpdate
from app.workers.async_processor import DocumentIngestionProcessor
from app.vectorstore.factory import get_vector_store

router = APIRouter(prefix="/documents", tags=["Document Management"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Save file to disk
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{os.path.basename(file.filename)}"
    file_path = os.path.join(settings.STORAGE_DIR, safe_filename)

    file_size = 0
    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                await out_file.write(chunk)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 3. Create Document DB record
    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=file.filename,
        original_name=file.filename,
        file_path=file_path,
        file_type=ext.replace(".", ""),
        file_size_bytes=file_size,
        status="UPLOADED"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit_event(db, current_user.id, "DOC_UPLOAD", "Document", doc.id, "SUCCESS")

    # 4. Trigger Background Ingestion
    def run_ingestion(d_id: str):
        from app.core.database import SessionLocal
        s = SessionLocal()
        try:
            DocumentIngestionProcessor.process_document_sync(s, d_id)
        finally:
            s.close()

    background_tasks.add_task(run_ingestion, doc.id)

    return doc

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))
    if status:
        query = query.filter(Document.status == status.upper())

    return query.order_by(Document.created_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/chunks", response_model=List[DocumentChunkResponse])
def get_document_chunks(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
        DocumentChunk.user_id == current_user.id
    ).order_by(DocumentChunk.chunk_index.asc()).all()
    return chunks

@router.get("/{document_id}/preview")
def preview_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File on disk not found")

    # Read preview based on type
    try:
        if doc.file_type in ["txt", "csv"]:
            with open(doc.file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(5000)
            return {"type": doc.file_type, "content": content}
        elif doc.file_type == "pdf":
            import pypdf
            reader = pypdf.PdfReader(doc.file_path)
            first_page = reader.pages[0].extract_text() if reader.pages else ""
            return {"type": "pdf", "content": first_page[:5000], "pages": len(reader.pages)}
        else:
            return {"type": doc.file_type, "content": f"Binary preview for {doc.filename}"}
    except Exception as e:
        return {"type": doc.file_type, "content": f"Could not preview: {str(e)}"}

@router.put("/{document_id}", response_model=DocumentResponse)
def rename_document(
    document_id: str,
    update_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if update_in.filename:
        doc.filename = update_in.filename
        db.commit()
        db.refresh(doc)
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector store
    vstore = get_vector_store()
    vstore.delete_by_document(document_id=doc.id, user_id=current_user.id)

    # Remove file on disk if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    log_audit_event(db, current_user.id, "DOC_DELETE", "Document", doc.id, "SUCCESS")

    db.delete(doc)
    db.commit()
    return None
