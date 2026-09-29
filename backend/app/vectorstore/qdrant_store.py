import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.vectorstore.base import VectorStoreBase
from app.core.config import settings

logger = logging.getLogger("enterprise_ai.qdrant")

import uuid

def _ensure_uuid(raw_id: Any) -> str:
    try:
        return str(uuid.UUID(str(raw_id)))
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(raw_id)))

class QdrantVectorStore(VectorStoreBase):
    def __init__(self, collection_name: str = "enterprise_document_chunks", url: Optional[str] = None, dimension: int = 384):
        self.collection_name = collection_name
        self.dimension = dimension
        try:
            if url:
                self.client = QdrantClient(url=url, api_key=settings.QDRANT_API_KEY, timeout=10.0)
            else:
                self.client = QdrantClient(location=":memory:")
            self._ensure_collection()
            self._ready = True
        except Exception as e:
            logger.warning(f"Could not connect to Qdrant, falling back to local mode: {e}")
            self._ready = False

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.dimension,
                        distance=models.Distance.COSINE
                    )
                )
        except Exception as e:
            logger.error(f"Error ensuring collection {self.collection_name}: {e}")

    def upsert(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        if not self._ready:
            return False
        try:
            points = [
                models.PointStruct(
                    id=_ensure_uuid(point_id),
                    vector=vec,
                    payload=payload
                )
                for point_id, vec, payload in zip(ids, vectors, payloads)
            ]
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            return True
        except Exception as e:
            logger.error(f"Qdrant upsert error: {e}")
            return False

    def search(
        self,
        query_vector: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        if not self._ready:
            return []
        try:
            must_filters = [
                models.FieldCondition(
                    key="user_id",
                    match=models.MatchValue(value=user_id)
                )
            ]

            if document_ids:
                must_filters.append(
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchAny(any=document_ids)
                    )
                )

            query_filter = models.Filter(must=must_filters)

            formatted = []
            # Check if query_points (qdrant-client >= 1.10) is available
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    query_filter=query_filter,
                    limit=top_k,
                    score_threshold=score_threshold if score_threshold > 0 else None
                )
                for point in response.points:
                    formatted.append({
                        "id": str(point.id),
                        "score": round(float(point.score), 4),
                        "payload": point.payload or {}
                    })
            elif hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=query_filter,
                    limit=top_k,
                    score_threshold=score_threshold if score_threshold > 0 else None
                )
                for hit in results:
                    formatted.append({
                        "id": str(hit.id),
                        "score": round(float(hit.score), 4),
                        "payload": hit.payload or {}
                    })

            return formatted
        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            return []

    def delete_by_document(self, document_id: str, user_id: str) -> bool:
        if not self._ready:
            return False
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(key="document_id", match=models.MatchValue(value=document_id)),
                            models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))
                        ]
                    )
                )
            )
            return True
        except Exception as e:
            logger.error(f"Qdrant delete error: {e}")
            return False

    def delete_by_user(self, user_id: str) -> bool:
        if not self._ready:
            return False
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))
                        ]
                    )
                )
            )
            return True
        except Exception as e:
            logger.error(f"Qdrant delete error: {e}")
            return False
