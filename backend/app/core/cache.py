import time
import json
from typing import Optional, Any
from app.core.config import settings

class InMemoryCache:
    def __init__(self):
        self._store = {}
        self._expires = {}

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        if key in self._expires and self._expires[key] < now:
            self.delete(key)
            return None
        return self._store.get(key)

    def set(self, key: str, value: str, expire: int = 3600) -> None:
        self._store[key] = value
        self._expires[key] = time.time() + expire

    def delete(self, key: str) -> None:
        self._store.pop(key, None)
        self._expires.pop(key, None)

    def clear(self) -> None:
        self._store.clear()
        self._expires.clear()

_memory_cache = InMemoryCache()
_redis_client = None

def get_redis_client():
    global _redis_client
    if not settings.USE_REDIS_CACHE:
        return None
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client

class CacheService:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        r = get_redis_client()
        if r:
            try:
                val = r.get(key)
                return json.loads(val) if val else None
            except Exception:
                pass
        val = _memory_cache.get(key)
        return json.loads(val) if val else None

    @staticmethod
    def set(key: str, value: Any, expire_seconds: int = 3600) -> None:
        val_str = json.dumps(value)
        r = get_redis_client()
        if r:
            try:
                r.setex(key, expire_seconds, val_str)
                return
            except Exception:
                pass
        _memory_cache.set(key, val_str, expire_seconds)

    @staticmethod
    def delete(key: str) -> None:
        r = get_redis_client()
        if r:
            try:
                r.delete(key)
            except Exception:
                pass
        _memory_cache.delete(key)

    @staticmethod
    def user_key(user_id: str, subkey: str) -> str:
        # Strictly enforces user isolation in cache
        return f"tenant:{user_id}:{subkey}"
