import os
import time
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.csv_analysis import CSVQueryRequest, CSVQueryResponse, CSVMetadataResponse
from app.tools.csv_analysis_tool import CSVAnalysisTool

router = APIRouter(prefix="/csv", tags=["CSV Data Analytics"])

@router.get("/{document_id}/schema", response_model=CSVMetadataResponse)
def get_csv_schema(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc or doc.file_type.lower() != "csv":
        raise HTTPException(status_code=404, detail="CSV document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File on disk not found")

    df = pd.read_csv(doc.file_path)
    col_types = {col: str(df[col].dtype) for col in df.columns}

    # Clean NaN values for json
    stats = df.describe().fillna(0).to_dict()
    sample = df.head(10).fillna("").to_dict(orient="records")

    return CSVMetadataResponse(
        document_id=doc.id,
        row_count=len(df),
        column_count=len(df.columns),
        columns=df.columns.tolist(),
        column_types=col_types,
        summary_stats=stats,
        sample_rows=sample
    )

@router.post("/query", response_model=CSVQueryResponse)
async def query_csv(
    req: CSVQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start = time.perf_counter()
    doc = db.query(Document).filter(
        Document.id == req.document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc or doc.file_type.lower() != "csv":
        raise HTTPException(status_code=404, detail="CSV document not found")

    df = pd.read_csv(doc.file_path)
    query_lower = req.query.lower()

    chart_data = None
    result_data = []
    answer = ""

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    # Determine requested operation from user question
    if "average" in query_lower or "mean" in query_lower:
        target_col = next((c for c in num_cols if c.lower() in query_lower), num_cols[0] if num_cols else None)
        if target_col:
            val = float(df[target_col].mean())
            answer = f"The average {target_col.replace('_', ' ')} across all records is **{round(val, 2):,}**."
            result_data = [{"metric": f"Average {target_col}", "value": val}]
    elif "highest" in query_lower or "maximum" in query_lower or "top" in query_lower:
        val_col = next((c for c in num_cols if c.lower() in query_lower), num_cols[0] if num_cols else None)
        group_col = next((c for c in cat_cols if c.lower() in query_lower), cat_cols[0] if cat_cols else None)
        if val_col and group_col:
            grouped = df.groupby(group_col)[val_col].sum().reset_index()
            top_row = grouped.sort_values(by=val_col, ascending=False).iloc[0]
            answer = f"The {group_col.replace('_', ' ')} with the highest {val_col.replace('_', ' ')} is **{top_row[group_col]}** with **{round(float(top_row[val_col]), 2):,}**."
            result_data = grouped.sort_values(by=val_col, ascending=False).head(5).to_dict(orient="records")

            chart_data = {
                "labels": [str(r[group_col]) for r in result_data],
                "datasets": [{
                    "label": f"Total {val_col.replace('_', ' ').title()}",
                    "data": [float(r[val_col]) for r in result_data]
                }]
            }
    elif "trend" in query_lower or "quarter" in query_lower or "monthly" in query_lower:
        val_col = next((c for c in num_cols if c.lower() in query_lower), num_cols[0] if num_cols else None)
        time_col = next((c for c in df.columns if any(w in c.lower() for w in ["quarter", "month", "date", "year"])), df.columns[0])
        grouped = df.groupby(time_col)[val_col].sum().reset_index() if val_col else df.head(10)
        result_data = grouped.to_dict(orient="records")
        answer = f"Temporal trend for {val_col or 'metrics'} evaluated across {len(grouped)} periods."
        chart_data = {
            "labels": [str(r[time_col]) for r in result_data],
            "datasets": [{
                "label": f"Trend: {val_col}",
                "data": [float(r[val_col]) for r in result_data]
            }]
        }
    elif "anomaly" in query_lower or "outlier" in query_lower:
        target_col = next((c for c in num_cols if c.lower() in query_lower), num_cols[0] if num_cols else None)
        if target_col:
            vals = df[target_col].dropna()
            mean = vals.mean()
            std = vals.std()
            z = (vals - mean) / (std if std > 0 else 1)
            anom = df[abs(z) > 1.8]
            result_data = anom.head(10).to_dict(orient="records")
            answer = f"Detected **{len(anom)}** statistical anomalies in column '{target_col}' (Z-score > 1.8)."
    else:
        # Default aggregate view
        group_col = cat_cols[0] if cat_cols else df.columns[0]
        val_col = num_cols[0] if num_cols else None
        if val_col:
            grouped = df.groupby(group_col)[val_col].sum().reset_index()
            result_data = grouped.head(8).to_dict(orient="records")
            answer = f"Summary analysis of {val_col} aggregated by {group_col} across {len(df)} records."
            chart_data = {
                "labels": [str(r[group_col]) for r in result_data],
                "datasets": [{
                    "label": f"{val_col.title()}",
                    "data": [float(r[val_col]) for r in result_data]
                }]
            }
        else:
            result_data = df.head(5).to_dict(orient="records")
            answer = f"Dataset preview with {len(df)} rows and {len(df.columns)} columns."

    elapsed_ms = (time.perf_counter() - start) * 1000

    return CSVQueryResponse(
        answer=answer,
        query_executed=req.query,
        result_data=result_data,
        chart_data=chart_data,
        execution_time_ms=round(elapsed_ms, 2)
    )
