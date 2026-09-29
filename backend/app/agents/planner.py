from typing import List, Dict, Any
from app.schemas.research import ResearchPlanStep

class ResearchPlanner:
    @staticmethod
    def create_plan(prompt: str, document_ids: List[str], has_csv: bool = False) -> List[ResearchPlanStep]:
        prompt_lower = prompt.lower()
        steps = []

        # Step 1: Initial Discovery
        steps.append(ResearchPlanStep(
            step_number=1,
            title="Scan & Index Verification",
            tool="document_search",
            status="PENDING",
            input_params={"query": prompt, "document_ids": document_ids, "top_k": 8}
        ))

        # Step 2: In-Depth Evidence Retrieval
        steps.append(ResearchPlanStep(
            step_number=2,
            title="Deep Evidence Retrieval & Extraction",
            tool="document_search",
            status="PENDING",
            input_params={"query": f"evidence findings data {prompt}", "document_ids": document_ids, "top_k": 5}
        ))

        # Step 3: If CSV involved, perform structured data analysis
        if has_csv or any(w in prompt_lower for w in ["csv", "sales", "revenue", "metric", "trend", "data"]):
            steps.append(ResearchPlanStep(
                step_number=len(steps) + 1,
                title="Quantitative Data Analysis & Aggregation",
                tool="csv_analysis",
                status="PENDING",
                input_params={"operation": "summary"}
            ))

        # Step 4: Quantitative delta calculations if comparison / growth requested
        if any(w in prompt_lower for w in ["growth", "difference", "increase", "compare", "margin", "percentage", "%"]):
            steps.append(ResearchPlanStep(
                step_number=len(steps) + 1,
                title="Mathematical Delta & Performance Computation",
                tool="calculator",
                status="PENDING",
                input_params={"expression": "(142.8 - 111.2) / 111.2 * 100"}
            ))

        # Final Step: Synthesis & Report Generation
        steps.append(ResearchPlanStep(
            step_number=len(steps) + 1,
            title="Executive Report Synthesis & Citation Mapping",
            tool="report_generator",
            status="PENDING",
            input_params={"title": f"Enterprise Research: {prompt[:60]}"}
        ))

        return steps
