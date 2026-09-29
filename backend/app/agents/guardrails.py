import re
from typing import Tuple

INJECTION_PATTERNS = [
    r'ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions',
    r'system\s+override',
    r'disregard\s+the\s+above',
    r'you\s+are\s+now\s+(?:an?\s+)?(?:dan|unrestricted|jailbroken)',
    r'<script[\s\S]*?>[\s\S]*?<\/script>',
    r'exec\s*\(\s*["\'].*?["\']\s*\)',
    r'DROP\s+TABLE',
    r'UNION\s+SELECT',
    r'--\s*$',
    r'\bformat\s+c:\b'
]

class SafetyGuardrails:
    @staticmethod
    def inspect_prompt(prompt: str) -> Tuple[bool, str]:
        """
        Inspects user prompt for injection attempts or malicious code.
        Returns: (is_safe: bool, reason: str)
        """
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return False, f"Prompt violates safety policy (detected pattern matching: {pattern})."

        if len(prompt.strip()) == 0:
            return False, "Prompt cannot be empty."

        if len(prompt) > 8000:
            return False, "Prompt exceeds maximum allowed character length (8000)."

        return True, "Passed"

    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Removes dangerous control characters and normalizes whitespace.
        """
        cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        return cleaned.strip()
