from app.core.config import settings
from app.vectorstore.base import VectorStoreBase
from app.vectorstore.inmemory_store import InMemoryVectorStore
from app.vectorstore.qdrant_store import QdrantVectorStore

_global_store: VectorStoreBase = None

def get_vector_store() -> VectorStoreBase:
    global _global_store
    if _global_store is None:
        if settings.VECTOR_DB_TYPE.lower() == "qdrant":
            try:
                store = QdrantVectorStore(
                    collection_name=settings.QDRANT_COLLECTION,
                    url=settings.QDRANT_URL,
                    dimension=settings.EMBEDDING_DIMENSION
                )
                if store._ready:
                    _global_store = store
                else:
                    _global_store = InMemoryVectorStore()
            except Exception:
                _global_store = InMemoryVectorStore()
        else:
            _global_store = InMemoryVectorStore()
    return _global_store
