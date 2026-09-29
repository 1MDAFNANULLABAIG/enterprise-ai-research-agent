import json
import os
import time
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy.orm import Session

from app.rag.pipeline import RAGPipeline
from app.evaluation.metrics import EvaluationMetrics
from app.models.evaluation import EvaluationRun

DATASET_PATH = Path(__file__).resolve().parent / "dataset.json"

class RAGEvaluator:
    @staticmethod
    async def run_benchmark(db: Session, user_id: str, run_name: str = "Automated Evaluation Run", top_k: int = 5, provider: str = None) -> EvaluationRun:
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            cases = json.load(f)

        pipeline = RAGPipeline(top_k=top_k)

        precisions = []
        recalls = []
        faithfulnesses = []
        citation_accuracies = []
        latencies = []
        details = []

        for case in cases:
            q = case["question"]
            expected_doc = case["expected_document"]
            expected_kw = case["expected_keywords"]

            start = time.perf_counter()
            # Retrieve
            chunks, retrieval_ms = pipeline.retrieve(q, user_id=user_id, top_k=top_k)
            # Query answer
            res = await pipeline.query(q, user_id=user_id, provider_name=provider)
            latency = (time.perf_counter() - start) * 1000

            p = EvaluationMetrics.calculate_retrieval_precision(chunks, expected_doc)
            r = EvaluationMetrics.calculate_retrieval_recall(chunks, expected_kw)
            f = EvaluationMetrics.calculate_answer_faithfulness(res["answer"], chunks)
            c = EvaluationMetrics.calculate_citation_accuracy(res["answer"], expected_doc, res["citations"])

            precisions.append(p)
            recalls.append(r)
            faithfulnesses.append(f)
            citation_accuracies.append(c)
            latencies.append(latency)

            details.append({
                "case_id": case["id"],
                "question": q,
                "precision": p,
                "recall": r,
                "faithfulness": f,
                "citation_accuracy": c,
                "latency_ms": round(latency, 2),
                "answer_preview": res["answer"][:150] + "...",
                "retrieved_chunks_count": len(chunks)
            })

        avg_p = round(sum(precisions) / max(len(precisions), 1), 4)
        avg_r = round(sum(recalls) / max(len(recalls), 1), 4)
        avg_f = round(sum(faithfulnesses) / max(len(faithfulnesses), 1), 4)
        avg_c = round(sum(citation_accuracies) / max(len(citation_accuracies), 1), 4)
        avg_lat = round(sum(latencies) / max(len(latencies), 1), 2)

        run = EvaluationRun(
            name=run_name,
            test_count=len(cases),
            precision_score=avg_p,
            recall_score=avg_r,
            faithfulness_score=avg_f,
            citation_accuracy=avg_c,
            avg_latency_ms=avg_lat,
            status="COMPLETED",
            details_json=json.dumps(details)
        )

        db.add(run)
        db.commit()
        db.refresh(run)
        return run
