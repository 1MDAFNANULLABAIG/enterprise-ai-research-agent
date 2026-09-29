import httpx
from typing import Dict, Any, List
from app.tools.base import BaseTool

class WebSearchTool(BaseTool):
    @property
    def name(self) -> str:
        return "web_search"

    @property
    def description(self) -> str:
        return "Search external authoritative sources and technical documentation. Args: query (str)."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        query = kwargs.get("query", "")
        if not query:
            return {"error": "Query parameter is required."}

        # Safe trusted search simulation with realistic enterprise domain lookup
        authoritative_sources = [
            {
                "title": "NIST SP 800-63B Digital Identity Guidelines",
                "url": "https://pages.nist.gov/800-63-3/sp800-63b.html",
                "snippet": "NIST guidance on password hashing, multi-factor authentication, and cryptographic session protection."
            },
            {
                "title": "EU AI Act Compliance & Governance Standards",
                "url": "https://artificialintelligenceact.eu/",
                "snippet": "Regulatory baselines for high-risk AI systems, transparency logging, and risk mitigation requirements."
            },
            {
                "title": "AWS Well-Architected Framework: Machine Learning Lens",
                "url": "https://aws.amazon.com/architecture/well-architected/",
                "snippet": "Best practices for multi-tenant vector databases, resilient RAG pipelines, and cost optimization."
            }
        ]

        matched = [s for s in authoritative_sources if any(w in s["title"].lower() or w in s["snippet"].lower() for w in query.lower().split())]
        return {
            "query": query,
            "results": matched if matched else authoritative_sources[:2]
        }

class ReportGeneratorTool(BaseTool):
    @property
    def name(self) -> str:
        return "report_generator"

    @property
    def description(self) -> str:
        return "Structure research findings into a standardized executive report. Args: title (str), executive_summary (str), key_findings (list), comparison_table (dict), conclusion (str), sources (list)."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        title = kwargs.get("title", "Executive Research Report")
        executive_summary = kwargs.get("executive_summary", "")
        key_findings = kwargs.get("key_findings", [])
        comparison_table = kwargs.get("comparison_table")
        conclusion = kwargs.get("conclusion", "")
        sources = kwargs.get("sources", [])

        report = {
            "title": title,
            "executive_summary": executive_summary,
            "key_findings": key_findings if isinstance(key_findings, list) else [key_findings],
            "comparison_table": comparison_table,
            "conclusion": conclusion,
            "sources": sources
        }

        return {
            "status": "GENERATED",
            "report": report
        }
