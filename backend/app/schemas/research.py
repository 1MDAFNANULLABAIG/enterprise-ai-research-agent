from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.chat import CitationItem

class ResearchTaskCreate(BaseModel):
    title: Optional[str] = None
    prompt: str
    document_ids: List[str] = []
    provider: Optional[str] = None

class ResearchPlanStep(BaseModel):
    step_number: int
    title: str
    tool: str
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    input_params: Dict[str, Any] = {}
    output: Optional[str] = None

class ResearchReport(BaseModel):
    title: str
    executive_summary: str
    key_findings: List[str]
    comparison_table: Optional[Dict[str, Any]] = None  # {headers: [...], rows: [[...]]}
    evidence: List[Dict[str, Any]] = []
    conclusion: str
    sources: List[CitationItem] = []

class ResearchTaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    prompt: str
    document_ids: List[str] = []
    status: str
    plan: List[ResearchPlanStep] = []
    execution_steps: List[Dict[str, Any]] = []
    report: Optional[ResearchReport] = None
    metrics: Dict[str, Any] = {}
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
