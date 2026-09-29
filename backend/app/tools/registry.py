from typing import Dict, List
from app.tools.base import BaseTool
from app.tools.doc_tools import DocumentSearchTool, DocumentRetrievalTool
from app.tools.calculator_tool import CalculatorTool
from app.tools.csv_analysis_tool import CSVAnalysisTool
from app.tools.report_and_web_tools import WebSearchTool, ReportGeneratorTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {
            "document_search": DocumentSearchTool(),
            "document_retrieval": DocumentRetrievalTool(),
            "calculator": CalculatorTool(),
            "csv_analysis": CSVAnalysisTool(),
            "web_search": WebSearchTool(),
            "report_generator": ReportGeneratorTool(),
        }

    def get_tool(self, name: str) -> BaseTool:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, str]]:
        return [
            {"name": tool.name, "description": tool.description}
            for tool in self._tools.values()
        ]

_registry = ToolRegistry()

def get_tool_registry() -> ToolRegistry:
    return _registry
