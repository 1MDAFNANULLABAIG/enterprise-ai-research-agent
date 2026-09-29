import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.security import get_current_user
from app.core.observability import log_audit_event
from app.models.user import User
from app.models.research import ResearchTask
from app.schemas.research import ResearchTaskCreate, ResearchTaskResponse, ResearchPlanStep, ResearchReport
from app.agents.research_agent import ResearchAgent

router = APIRouter(prefix="/research", tags=["AI Research Agent"])

def _format_task_response(task: ResearchTask) -> ResearchTaskResponse:
    plan_data = json.loads(task.plan_json) if task.plan_json else []
    exec_data = json.loads(task.execution_steps_json) if task.execution_steps_json else []
    report_data = json.loads(task.report_json) if task.report_json else None
    metrics_data = json.loads(task.metrics_json) if task.metrics_json else {}
    doc_ids = json.loads(task.document_ids_json) if task.document_ids_json else []

    plan_steps = [ResearchPlanStep(**p) for p in plan_data]
    report_obj = ResearchReport(**report_data) if (report_data and "title" in report_data) else None

    return ResearchTaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        prompt=task.prompt,
        document_ids=doc_ids,
        status=task.status,
        plan=plan_steps,
        execution_steps=exec_data,
        report=report_obj,
        metrics=metrics_data,
        created_at=task.created_at,
        completed_at=task.completed_at
    )

@router.post("/tasks", response_model=ResearchTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_research_task(
    task_in: ResearchTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = task_in.title or f"Research: {task_in.prompt[:40]}..."
    task = ResearchTask(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=title,
        prompt=task_in.prompt,
        document_ids_json=json.dumps(task_in.document_ids or []),
        status="PENDING"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_audit_event(db, current_user.id, "RESEARCH_CREATE", "ResearchTask", task.id, "SUCCESS")

    # Execute synchronously or return immediately
    agent = ResearchAgent(db=db, user_id=current_user.id)
    updated_task = await agent.execute_task(task.id, provider_name=task_in.provider)

    return _format_task_response(updated_task)

@router.get("/tasks", response_model=List[ResearchTaskResponse])
def list_research_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = db.query(ResearchTask).filter(ResearchTask.user_id == current_user.id).order_by(ResearchTask.created_at.desc()).all()
    return [_format_task_response(t) for t in tasks]

@router.get("/tasks/{task_id}", response_model=ResearchTaskResponse)
def get_research_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(ResearchTask).filter(ResearchTask.id == task_id, ResearchTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Research task not found")
    return _format_task_response(task)

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_research_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(ResearchTask).filter(ResearchTask.id == task_id, ResearchTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Research task not found")
    db.delete(task)
    db.commit()
    return None
