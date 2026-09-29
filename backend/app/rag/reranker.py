import re
import math
from typing import List, Dict, Any

class HybridReranker:
    """
    Ranks retrieved chunks using a hybrid combination of
    Dense Vector Similarity + Lexical BM25 Keyword Scoring.
    """
    def __init__(self, vector_weight: float = 0.65, lexical_weight: float = 0.35):
        self.vector_weight = vector_weight
        self.lexical_weight = lexical_weight

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        # Tokenize query
        q_tokens = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_]{3,}\b', query)]
        if not q_tokens:
            return sorted(candidates, key=lambda x: x.get("score", 0.0), reverse=True)[:top_k]

        # Calculate BM25-like lexical scores
        avg_doc_len = sum(len(c["payload"].get("content", "").split()) for c in candidates) / max(len(candidates), 1)

        reranked = []
        for c in candidates:
            payload = c.get("payload", {})
            content = payload.get("content", "").lower()
            words = content.split()
            doc_len = len(words)

            vector_score = float(c.get("score", 0.0))

            # BM25 term frequency calculation
            lexical_score = 0.0
            for qt in set(q_tokens):
                tf = content.count(qt)
                if tf > 0:
                    # BM25 TF formula: tf * (k1 + 1) / (tf + k1 * (1 - b + b * (doc_len / avg_doc_len)))
                    k1 = 1.2
                    b = 0.75
                    norm_len = (1 - b + b * (doc_len / max(avg_doc_len, 1)))
                    bm25_tf = (tf * (k1 + 1)) / (tf + k1 * norm_len)
                    lexical_score += bm25_tf

            # Normalize lexical score
            norm_lexical = min(1.0, lexical_score / max(len(set(q_tokens)), 1))

            # Combined hybrid score
            combined_score = (self.vector_weight * vector_score) + (self.lexical_weight * norm_lexical)

            reranked.append({
                "id": c.get("id"),
                "score": round(combined_score, 4),
                "vector_score": vector_score,
                "lexical_score": round(norm_lexical, 4),
                "payload": payload
            })

        reranked.sort(key=lambda x: x["score"], reverse=True)
        return reranked[:top_k]
