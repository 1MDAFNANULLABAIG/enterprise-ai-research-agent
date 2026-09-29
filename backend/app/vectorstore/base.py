from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class VectorStoreBase(ABC):
    @abstractmethod
    def upsert(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        pass

    @abstractmethod
    def search(
        self,
        query_vector: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5,
        score_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_by_document(self, document_id: str, user_id: str) -> bool:
        pass

    @abstractmethod
    def delete_by_user(self, user_id: str) -> bool:
        pass
