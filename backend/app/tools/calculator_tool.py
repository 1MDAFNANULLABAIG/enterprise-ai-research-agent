import ast
import operator
import math
from typing import Dict, Any
from app.tools.base import BaseTool

SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

SAFE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "sqrt": math.sqrt,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
}

def safe_eval_expr(node):
    if isinstance(node, ast.Expression):
        return safe_eval_expr(node.body)
    elif isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("Only numbers are allowed")
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            return SAFE_OPERATORS[op_type](safe_eval_expr(node.operand))
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            return SAFE_OPERATORS[op_type](safe_eval_expr(node.left), safe_eval_expr(node.right))
    elif isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in SAFE_FUNCTIONS:
            args = [safe_eval_expr(arg) for arg in node.args]
            return SAFE_FUNCTIONS[node.func.id](*args)
    raise ValueError(f"Unsupported or unsafe expression: {ast.dump(node)}")

class CalculatorTool(BaseTool):
    @property
    def name(self) -> str:
        return "calculator"

    @property
    def description(self) -> str:
        return "Safely evaluate mathematical expressions and financial calculations. Args: expression (str, e.g. '(142.8 - 111.2) / 111.2 * 100')."

    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        expr = kwargs.get("expression", "")
        if not expr:
            return {"error": "Expression parameter is required."}

        cleaned_expr = expr.replace("$", "").replace(",", "").replace("%", "")
        try:
            tree = ast.parse(cleaned_expr, mode='eval')
            result = safe_eval_expr(tree)
            return {
                "expression": expr,
                "result": round(float(result), 4) if isinstance(result, float) else result
            }
        except Exception as e:
            return {"error": f"Invalid mathematical expression: {str(e)}"}
