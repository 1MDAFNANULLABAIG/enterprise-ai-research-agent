from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class EvaluationCase(BaseModel):
    id: str
    question: str
    ground_truth_answer: str
    expected_document: str
    expected_page: int
    expected_keywords: List[str]

class EvaluationRunResponse(BaseModel):
    id: str
    name: str
    test_count: int
    precision_score: float
    recall_score: float
    faithfulness_score: float
    citation_accuracy: float
    avg_latency_ms: float
    status: str
    details: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class EvaluationRunRequest(BaseModel):
    name: Optional[str] = "Benchmark Suite 1.0"
    top_k: Optional[int] = 5
    provider: Optional[str] = None
