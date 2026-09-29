import threading
import json
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from app.vectorstore.base import VectorStoreBase

logger = logging.getLogger("enterprise_ai.inmemory_store")

class InMemoryVectorStore(VectorStoreBase):
    def __init__(self):
        self._lock = threading.Lock()
        self._vectors: Dict[str, np.ndarray] = {}  # id -> normalized vector
        self._payloads: Dict[str, Dict[str, Any]] = {}  # id -> metadata payload
        self._hydrated = False

    def _hydrate_from_db(self):
        if self._hydrated or self._vectors:
            return
        try:
            from app.core.database import SessionLocal
            from app.models.document import DocumentChunk, Document
            from app.embeddings.factory import get_embedding_provider

            db = SessionLocal()
            try:
                chunks = db.query(DocumentChunk).all()
                if not chunks:
                    self._hydrated = True
                    return

                doc_map = {d.id: d.filename for d in db.query(Document).all()}
                embedder = get_embedding_provider()

                chunk_texts = [c.content for c in chunks]
                vectors = embedder.embed_texts(chunk_texts)

                for chunk, vec in zip(chunks, vectors):
                    arr = np.array(vec, dtype=np.float32)
                    norm = np.linalg.norm(arr)
                    if norm > 1e-6:
                        arr = arr / norm
                    self._vectors[chunk.id] = arr
                    self._payloads[chunk.id] = {
                        "chunk_id": chunk.id,
                        "document_id": chunk.document_id,
                        "user_id": chunk.user_id,
                        "filename": doc_map.get(chunk.document_id, "Document"),
                        "page_number": chunk.page_number,
                        "section_title": chunk.section_title,
                        "content": chunk.content
                    }
                self._hydrated = True
                logger.info(f"Hydrated InMemoryVectorStore with {len(self._vectors)} chunks from DB.")
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Could not hydrate vector store from DB: {e}")

    def upsert(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        with self._lock:
            for vec, payload, vid in zip(vectors, payloads, ids):
                arr = np.array(vec, dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 1e-6:
                    arr = arr / norm
                self._vectors[vid] = arr
                self._payloads[vid] = payload
        return True

    def search(
        self,
        query_vector: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        with self._lock:
            if not self._vectors:
                self._hydrate_from_db()

            if not self._vectors:
                return []

            q_arr = np.array(query_vector, dtype=np.float32)
            q_norm = np.linalg.norm(q_arr)
            if q_norm > 1e-6:
                q_arr = q_arr / q_norm

            doc_id_set = set(document_ids) if document_ids else None
            candidates = []

            for vid, vec in self._vectors.items():
                payload = self._payloads.get(vid, {})
                # Strict multi-tenant isolation: match user_id
                if payload.get("user_id") != user_id:
                    continue

                # Document scope filtering
                if doc_id_set and payload.get("document_id") not in doc_id_set:
                    continue

                # Cosine similarity
                score = float(np.dot(q_arr, vec))
                if score >= score_threshold:
                    candidates.append({
                        "id": vid,
                        "score": round(score, 4),
                        "payload": payload
                    })

            # Sort descending by score
            candidates.sort(key=lambda x: x["score"], reverse=True)
            return candidates[:top_k]

    def delete_by_document(self, document_id: str, user_id: str) -> bool:
        with self._lock:
            to_delete = [
                vid for vid, p in self._payloads.items()
                if p.get("document_id") == document_id and p.get("user_id") == user_id
            ]
            for vid in to_delete:
                self._vectors.pop(vid, None)
                self._payloads.pop(vid, None)
        return True

    def delete_by_user(self, user_id: str) -> bool:
        with self._lock:
            to_delete = [
                vid for vid, p in self._payloads.items()
                if p.get("user_id") == user_id
            ]
            for vid in to_delete:
                self._vectors.pop(vid, None)
                self._payloads.pop(vid, None)
        return True
