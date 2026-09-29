from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseTool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    async def execute(self, user_id: str, **kwargs) -> Dict[str, Any]:
        pass
