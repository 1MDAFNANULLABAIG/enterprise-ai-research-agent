from typing import Dict, Any, List, Optional
from app.tools.base import BaseTool
from app.rag.pipeline import RAGPipeline

class DocumentSearchTool(BaseTool):
    def __init__(self):
        self.pipeline = RAGPipeline()

    @property
    def name(self) -> str:
        return "document_search"

    @property
    def description(self) -> str:
        return "Search indexed enterprise documents using semantic and keyword search. Args: query (str), document_ids (list, optional), top_k (int, optional)."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        query = kwargs.get("query", "")
        document_ids = kwargs.get("document_ids")
        top_k = kwargs.get("top_k", 5)

        if not query:
            return {"error": "Query parameter is required."}

        chunks, latency = self.pipeline.retrieve(query, user_id, document_ids, top_k=top_k)

        results = []
        for c in chunks:
            payload = c.get("payload", {})
            results.append({
                "chunk_id": payload.get("chunk_id", c.get("id")),
                "document_id": payload.get("document_id"),
                "filename": payload.get("filename"),
                "page_number": payload.get("page_number", 1),
                "section": payload.get("section_title"),
                "score": c.get("score"),
                "excerpt": payload.get("content", "")[:300]
            })

        return {
            "query": query,
            "match_count": len(results),
            "results": results,
            "latency_ms": latency
        }

class DocumentRetrievalTool(BaseTool):
    @property
    def name(self) -> str:
        return "document_retrieval"

    @property
    def description(self) -> str:
        return "Retrieve the full content of a specific chunk or document page. Args: chunk_id (str) or document_id (str)."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        chunk_id = kwargs.get("chunk_id")
        from app.core.database import SessionLocal
        from app.models.document import DocumentChunk

        db = SessionLocal()
        try:
            chunk = db.query(DocumentChunk).filter(
                DocumentChunk.id == chunk_id,
                DocumentChunk.user_id == user_id
            ).first()

            if not chunk:
                return {"error": f"Chunk {chunk_id} not found or access denied."}

            return {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "page_number": chunk.page_number,
                "section": chunk.section_title,
                "full_content": chunk.content
            }
        finally:
            db.close()
