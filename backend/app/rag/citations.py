import re
from typing import List, Dict, Any, Tuple
from app.schemas.chat import CitationItem

class CitationManager:
    @staticmethod
    def format_context_with_sources(chunks: List[Dict[str, Any]]) -> str:
        """
        Formats retrieved chunks into clear, verifiable source blocks for the LLM.
        """
        if not chunks:
            return ""

        context_parts = []
        for idx, item in enumerate(chunks, 1):
            payload = item.get("payload", {})
            doc_name = payload.get("filename", "Unknown Document")
            page_num = payload.get("page_number", 1)
            chunk_id = payload.get("chunk_id", item.get("id", f"chk_{idx}"))
            section = payload.get("section_title", f"Page {page_num}")
            content = payload.get("content", "").strip()

            context_parts.append(
                f"[Source {idx}] Document: {doc_name} | Page: {page_num} | Section: {section} | Chunk: {chunk_id}\n"
                f"Content: {content}"
            )

        return "\n\n".join(context_parts)

    @staticmethod
    def extract_and_align_citations(
        response_text: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[CitationItem]:
        """
        Extracts citations from text and maps them to actual retrieved chunks.
        Guarantees that only real, retrieved chunks are returned as citations.
        """
        if not retrieved_chunks:
            return []

        # Find all [Source X, Page Y] or [Source X] references
        matches = re.findall(r'\[Source\s+(\d+)(?:,\s*Page\s*(\d+))?\]', response_text)
        cited_indices = set()
        for m in matches:
            try:
                cited_indices.add(int(m[0]))
            except ValueError:
                pass

        citations = []
        for idx, item in enumerate(retrieved_chunks, 1):
            # If explicit citation found in text, include it; if none explicitly cited but text generated, include top 2
            if idx in cited_indices or (not cited_indices and idx <= 2 and "Insufficient information" not in response_text):
                payload = item.get("payload", {})
                content = payload.get("content", "")
                # Create a concise excerpt (first 180 chars)
                excerpt = content[:200] + ("..." if len(content) > 200 else "")
                
                citations.append(CitationItem(
                    source_index=idx,
                    document_id=payload.get("document_id", ""),
                    document_name=payload.get("filename", "Document"),
                    chunk_id=payload.get("chunk_id", item.get("id", "")),
                    page_number=payload.get("page_number", 1),
                    section_title=payload.get("section_title"),
                    excerpt=excerpt,
                    score=float(item.get("score", 0.0))
                ))

        return citations
