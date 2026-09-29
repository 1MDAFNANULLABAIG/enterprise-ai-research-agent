import time
from typing import List, Dict, Any, Optional, Tuple, AsyncIterator
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.observability import LatencyTracker, log_usage_metrics
from app.embeddings.factory import get_embedding_provider
from app.vectorstore.factory import get_vector_store
from app.llm.factory import get_llm_provider
from app.rag.reranker import HybridReranker
from app.rag.citations import CitationManager
from app.schemas.chat import CitationItem

SYSTEM_RAG_PROMPT = """You are an Enterprise AI Research & Document Agent.
Your role is to provide accurate, strictly factual, and comprehensive answers based ONLY on the provided document excerpts.

CRITICAL OPERATIONAL RULES:
1. Every factual statement must cite its exact source using bracketed citations, e.g., [Source 1, Page 2] or [Source 2, Page 5].
2. Never invent or hallucinate facts, metrics, dates, or citations.
3. If the provided excerpts do not contain sufficient evidence to answer the question reliably, explicitly state:
   "Insufficient information found in the available documents to answer this question."
4. Maintain a professional, executive tone suitable for corporate enterprise leadership.
5. Use markdown formatting with bullet points and comparison tables where appropriate.
"""

class RAGPipeline:
    def __init__(
        self,
        top_k: int = settings.RAG_TOP_K,
        similarity_threshold: float = settings.RAG_SIMILARITY_THRESHOLD
    ):
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold
        self.embedding_provider = get_embedding_provider()
        self.vector_store = get_vector_store()
        self.reranker = HybridReranker()

    def retrieve(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Executes query embedding, multi-tenant vector search, and hybrid reranking.
        Returns: (reranked_chunks, elapsed_retrieval_ms)
        """
        k = top_k or self.top_k
        start_t = time.perf_counter()

        # 1. Embed query
        query_vector = self.embedding_provider.embed_query(query)

        # 2. Vector search with tenant isolation & optional doc scope
        raw_candidates = self.vector_store.search(
            query_vector=query_vector,
            user_id=user_id,
            document_ids=document_ids,
            top_k=k * 2,  # Fetch 2x for reranking
            score_threshold=0.0
        )

        # 3. Hybrid reranking
        reranked = self.reranker.rerank(query, raw_candidates, top_k=k)

        elapsed_ms = (time.perf_counter() - start_t) * 1000
        return reranked, elapsed_ms

    async def query(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        provider_name: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        End-to-end RAG question answering.
        """
        tracker = LatencyTracker()

        # Step 1: Retrieval
        chunks, retrieval_ms = self.retrieve(query, user_id, document_ids)
        tracker.record_retrieval(retrieval_ms)

        # Filter by threshold
        valid_chunks = [c for c in chunks if c.get("score", 0.0) >= self.similarity_threshold]
        if not valid_chunks and chunks:
            # Check if highest score is at least 0.35 to consider relevant
            if chunks[0].get("score", 0.0) >= 0.35:
                valid_chunks = chunks[:2]

        if not valid_chunks:
            perf = tracker.finish()
            return {
                "answer": "Insufficient information found in the available documents to answer this question. Please ensure relevant documents have been uploaded and indexed.",
                "citations": [],
                "metrics": perf,
                "retrieved_chunks_count": 0
            }

        # Step 2: Context formatting
        context_str = CitationManager.format_context_with_sources(valid_chunks)

        user_prompt = f"""DOCUMENT CONTEXT:
{context_str}

USER QUESTION:
{query}

Please formulate an accurate, cited answer based strictly on the context above:"""

        # Step 3: LLM generation
        llm_start = time.perf_counter()
        llm = get_llm_provider(provider_name)
        answer = await llm.generate(
            prompt=user_prompt,
            system_prompt=SYSTEM_RAG_PROMPT,
            temperature=0.1
        )
        llm_ms = (time.perf_counter() - llm_start) * 1000
        tracker.record_llm(llm_ms)

        # Step 4: Citations alignment
        citations = CitationManager.extract_and_align_citations(answer, valid_chunks)

        perf = tracker.finish()

        # Log usage metrics if db provided
        if db:
            words = (user_prompt + answer).split()
            prompt_tokens = int(len(user_prompt.split()) * 1.3)
            completion_tokens = int(len(answer.split()) * 1.3)
            log_usage_metrics(
                db=db,
                user_id=user_id,
                query_type="chat",
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                retrieval_latency_ms=perf["retrieval_ms"],
                llm_latency_ms=perf["llm_ms"],
                total_latency_ms=perf["total_ms"],
                retrieved_chunk_count=len(valid_chunks)
            )

        return {
            "answer": answer,
            "citations": citations,
            "metrics": perf,
            "retrieved_chunks_count": len(valid_chunks)
        }

    async def query_stream(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        provider_name: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Streaming RAG response yielding status updates and token chunks.
        """
        # Yield status: Searching
        yield {"type": "status", "stage": "Searching indexed documents..."}
        
        chunks, retrieval_ms = self.retrieve(query, user_id, document_ids)
        
        yield {"type": "status", "stage": "Retrieving evidence..."}
        
        valid_chunks = [c for c in chunks if c.get("score", 0.0) >= self.similarity_threshold]
        if not valid_chunks and chunks and chunks[0].get("score", 0.0) >= 0.35:
            valid_chunks = chunks[:2]

        if not valid_chunks:
            yield {"type": "status", "stage": "Generating response..."}
            refusal = "Insufficient information found in the available documents to answer this question. Please ensure relevant documents have been uploaded and indexed."
            yield {"type": "token", "token": refusal}
            yield {
                "type": "done",
                "citations": [],
                "metrics": {"retrieval_ms": round(retrieval_ms, 2), "llm_ms": 0.0, "total_ms": round(retrieval_ms, 2)}
            }
            return

        yield {"type": "status", "stage": "Analyzing sources & generating answer..."}

        context_str = CitationManager.format_context_with_sources(valid_chunks)
        user_prompt = f"""DOCUMENT CONTEXT:
{context_str}

USER QUESTION:
{query}

Please formulate an accurate, cited answer based strictly on the context above:"""

        llm_start = time.perf_counter()
        llm = get_llm_provider(provider_name)
        
        full_text = ""
        async for token in llm.generate_stream(
            prompt=user_prompt,
            system_prompt=SYSTEM_RAG_PROMPT,
            temperature=0.1
        ):
            full_text += token
            yield {"type": "token", "token": token}

        llm_ms = (time.perf_counter() - llm_start) * 1000
        total_ms = retrieval_ms + llm_ms

        citations = CitationManager.extract_and_align_citations(full_text, valid_chunks)

        yield {
            "type": "done",
            "citations": [c.model_dump() for c in citations],
            "metrics": {
                "retrieval_ms": round(retrieval_ms, 2),
                "llm_ms": round(llm_ms, 2),
                "total_ms": round(total_ms, 2)
            }
        }
