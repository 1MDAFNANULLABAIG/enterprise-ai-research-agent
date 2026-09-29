import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.evaluation import EvaluationRun
from app.schemas.evaluation import EvaluationRunResponse, EvaluationRunRequest
from app.evaluation.evaluator import RAGEvaluator

router = APIRouter(prefix="/evaluation", tags=["RAG Evaluation & Benchmarking"])

def _format_eval_run(run: EvaluationRun) -> EvaluationRunResponse:
    details = json.loads(run.details_json) if run.details_json else []
    return EvaluationRunResponse(
        id=run.id,
        name=run.name,
        test_count=run.test_count,
        precision_score=run.precision_score,
        recall_score=run.recall_score,
        faithfulness_score=run.faithfulness_score,
        citation_accuracy=run.citation_accuracy,
        avg_latency_ms=run.avg_latency_ms,
        status=run.status,
        details=details,
        created_at=run.created_at
    )

@router.post("/run", response_model=EvaluationRunResponse)
async def run_evaluation(
    req: EvaluationRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = await RAGEvaluator.run_benchmark(
        db=db,
        user_id=current_user.id,
        run_name=req.name,
        top_k=req.top_k,
        provider=req.provider
    )
    return _format_eval_run(run)

@router.get("/runs", response_model=List[EvaluationRunResponse])
def get_evaluation_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    runs = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).all()
    return [_format_eval_run(r) for r in runs]

@router.get("/runs/{run_id}", response_model=EvaluationRunResponse)
def get_evaluation_run(run_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    run = db.query(EvaluationRun).filter(EvaluationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")
    return _format_eval_run(run)
