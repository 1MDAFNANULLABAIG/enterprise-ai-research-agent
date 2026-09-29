import os
import json
import logging
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentChunk
from app.rag.extractors import DocumentExtractor
from app.rag.chunker import SemanticChunker
from app.embeddings.factory import get_embedding_provider
from app.vectorstore.factory import get_vector_store
from app.core.config import settings

logger = logging.getLogger("enterprise_ai.worker")

class DocumentIngestionProcessor:
    @staticmethod
    def process_document_sync(db: Session, document_id: str) -> bool:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found.")
            return False

        try:
            doc.status = "PROCESSING"
            db.commit()

            # 1. Text Extraction
            pages, page_count = DocumentExtractor.extract_from_file(doc.file_path, doc.file_type)
            doc.page_count = page_count

            # 2. Semantic Chunking
            chunker = SemanticChunker(
                chunk_size=settings.RAG_CHUNK_SIZE,
                chunk_overlap=settings.RAG_CHUNK_OVERLAP
            )
            raw_chunks = chunker.chunk_pages(pages)

            if not raw_chunks:
                doc.status = "INDEXED"
                doc.chunk_count = 0
                db.commit()
                return True

            # 3. Create DocumentChunk DB records
            embedding_provider = get_embedding_provider()
            vector_store = get_vector_store()

            chunk_texts = []
            chunk_records = []
            chunk_payloads = []
            chunk_ids = []

            for rc in raw_chunks:
                chunk_id = str(uuid.uuid4())
                chunk_record = DocumentChunk(
                    id=chunk_id,
                    document_id=doc.id,
                    user_id=doc.user_id,
                    chunk_index=rc["chunk_index"],
                    page_number=rc["page_number"],
                    section_title=rc["section_title"],
                    content=rc["content"],
                    token_count=rc["token_count"],
                    vector_id=chunk_id,
                    metadata_json=json.dumps({
                        "filename": doc.filename,
                        "original_name": doc.original_name,
                        "page_number": rc["page_number"],
                        "section": rc["section_title"]
                    })
                )
                chunk_records.append(chunk_record)
                chunk_texts.append(rc["content"])
                chunk_ids.append(chunk_id)

                # Vector payload (includes user_id for multi-tenant isolation!)
                chunk_payloads.append({
                    "chunk_id": chunk_id,
                    "document_id": doc.id,
                    "user_id": doc.user_id,
                    "filename": doc.filename,
                    "page_number": rc["page_number"],
                    "section_title": rc["section_title"],
                    "content": rc["content"]
                })

            # 4. Generate Embeddings
            vectors = embedding_provider.embed_texts(chunk_texts)

            # 5. Vector Store Upsert
            vector_store.upsert(
                vectors=vectors,
                payloads=chunk_payloads,
                ids=chunk_ids
            )

            # 6. Save Chunk DB records
            db.bulk_save_objects(chunk_records)
            doc.chunk_count = len(chunk_records)
            doc.status = "INDEXED"
            doc.error_message = None
            db.commit()

            logger.info(f"Successfully processed and indexed document {doc.filename} ({len(chunk_records)} chunks)")
            return True

        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}", exc_info=True)
            doc.status = "FAILED"
            doc.error_message = str(e)
            db.commit()
            return False
