from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CSVQueryRequest(BaseModel):
    document_id: str
    query: str
    chart_type: Optional[str] = "bar"  # bar, line, pie, scatter

class CSVMetadataResponse(BaseModel):
    document_id: str
    row_count: int
    column_count: int
    columns: List[str]
    column_types: Dict[str, str]
    summary_stats: Dict[str, Any]
    sample_rows: List[Dict[str, Any]]

class CSVQueryResponse(BaseModel):
    answer: str
    query_executed: str
    result_data: List[Dict[str, Any]]
    chart_data: Optional[Dict[str, Any]] = None  # {labels: [...], datasets: [...]}
    execution_time_ms: float
