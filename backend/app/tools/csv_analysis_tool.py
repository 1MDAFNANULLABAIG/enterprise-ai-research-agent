import os
import json
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.tools.base import BaseTool
from app.core.database import SessionLocal
from app.models.document import Document

class CSVAnalysisTool(BaseTool):
    @property
    def name(self) -> str:
        return "csv_analysis"

    @property
    def description(self) -> str:
        return "Analyze tabular CSV data, perform aggregations, detect trends/anomalies, and generate chart data. Args: document_id (str), operation (str: 'summary'|'filter'|'groupby'|'anomaly'|'chart'), column (str), group_by_col (str), agg_func (str: 'sum'|'mean'|'count'|'max'|'min')."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        document_id = kwargs.get("document_id")
        operation = kwargs.get("operation", "summary").lower()

        if not document_id:
            return {"error": "document_id is required."}

        db = SessionLocal()
        try:
            doc = db.query(Document).filter(
                Document.id == document_id,
                Document.user_id == user_id
            ).first()

            if not doc:
                return {"error": "CSV document not found or access denied."}

            if not os.path.exists(doc.file_path):
                return {"error": "Document file does not exist on storage."}

            df = pd.read_csv(doc.file_path)

            if operation == "summary":
                return {
                    "filename": doc.filename,
                    "rows": len(df),
                    "columns": df.columns.tolist(),
                    "numerical_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
                    "categorical_columns": df.select_dtypes(exclude=[np.number]).columns.tolist(),
                    "head": df.head(5).to_dict(orient="records"),
                    "summary_statistics": df.describe().to_dict()
                }

            elif operation == "groupby":
                group_col = kwargs.get("group_by_col")
                value_col = kwargs.get("column")
                agg = kwargs.get("agg_func", "sum").lower()

                if not group_col or not value_col:
                    return {"error": "group_by_col and column are required for groupby"}

                if group_col not in df.columns or value_col not in df.columns:
                    return {"error": f"Columns not found. Available: {df.columns.tolist()}"}

                grouped = df.groupby(group_col)[value_col].agg(agg).reset_index()
                records = grouped.to_dict(orient="records")

                # Generate chart payload
                chart_data = {
                    "labels": [str(r[group_col]) for r in records],
                    "datasets": [{
                        "label": f"{agg.upper()} of {value_col}",
                        "data": [r[value_col] for r in records]
                    }]
                }

                return {
                    "operation": "groupby",
                    "group_by": group_col,
                    "target_column": value_col,
                    "agg_func": agg,
                    "results": records,
                    "chart_data": chart_data
                }

            elif operation == "anomaly":
                target_col = kwargs.get("column")
                if not target_col or target_col not in df.columns:
                    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                    target_col = num_cols[0] if num_cols else None

                if not target_col:
                    return {"error": "No numeric column available for anomaly detection."}

                vals = df[target_col].dropna()
                mean = vals.mean()
                std = vals.std()
                if std > 0:
                    z_scores = (vals - mean) / std
                    anomalies = df[abs(z_scores) > 2.0]
                else:
                    anomalies = pd.DataFrame()

                return {
                    "operation": "anomaly",
                    "column": target_col,
                    "mean": float(mean),
                    "std": float(std),
                    "anomaly_count": len(anomalies),
                    "anomalous_rows": anomalies.to_dict(orient="records")
                }

            elif operation == "chart":
                label_col = kwargs.get("group_by_col") or df.columns[0]
                val_col = kwargs.get("column")
                if not val_col:
                    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                    val_col = num_cols[0] if num_cols else df.columns[1]

                chart_data = {
                    "labels": [str(x) for x in df[label_col].tolist()[:30]],
                    "datasets": [{
                        "label": str(val_col),
                        "data": [float(x) if pd.notnull(x) else 0 for x in df[val_col].tolist()[:30]]
                    }]
                }
                return {
                    "operation": "chart",
                    "chart_type": kwargs.get("chart_type", "bar"),
                    "chart_data": chart_data
                }

            return {"error": f"Unknown operation: {operation}"}
        finally:
            db.close()
