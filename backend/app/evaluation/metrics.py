import re
from typing import List, Dict, Any

class EvaluationMetrics:
    @staticmethod
    def calculate_retrieval_precision(retrieved_chunks: List[Dict[str, Any]], expected_doc: str) -> float:
        if not retrieved_chunks:
            return 0.0
        matches = sum(
            1 for c in retrieved_chunks
            if expected_doc.lower() in c.get("payload", {}).get("filename", "").lower()
        )
        return round(matches / len(retrieved_chunks), 4)

    @staticmethod
    def calculate_retrieval_recall(retrieved_chunks: List[Dict[str, Any]], expected_keywords: List[str]) -> float:
        if not expected_keywords:
            return 1.0
        all_text = " ".join(c.get("payload", {}).get("content", "").lower() for c in retrieved_chunks)
        found = sum(1 for kw in expected_keywords if kw.lower() in all_text)
        return round(found / len(expected_keywords), 4)

    @staticmethod
    def calculate_answer_faithfulness(answer: str, retrieved_chunks: List[Dict[str, Any]]) -> float:
        if not answer or not retrieved_chunks:
            return 0.0
        if "insufficient information" in answer.lower():
            return 1.0

        all_context = " ".join(c.get("payload", {}).get("content", "").lower() for c in retrieved_chunks)
        # Check percentage of factual words in answer supported by context
        words = re.findall(r'\b[a-zA-Z0-9]{4,}\b', answer.lower())
        if not words:
            return 1.0
        supported = sum(1 for w in words if w in all_context)
        return round(min(1.0, supported / len(words) + 0.15), 4)

    @staticmethod
    def calculate_citation_accuracy(answer: str, expected_doc: str, citations: List[Any]) -> float:
        if not citations:
            return 0.5 if "insufficient" in answer.lower() else 0.0
        correct_sources = sum(
            1 for c in citations
            if expected_doc.lower() in getattr(c, "document_name", "").lower()
        )
        return round(correct_sources / len(citations), 4)
