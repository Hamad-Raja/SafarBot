from typing import Dict, Any
import time
import uuid

class SessionStore:
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds
        self._store: Dict[str, Dict[str, Any]] = {}

    def new_session(self) -> str:
        sid = uuid.uuid4().hex
        self._store[sid] = {"created_at": time.time(), "updated_at": time.time(), "state": "idle", "memory": {}}
        return sid

    def get(self, sid: str) -> Dict[str, Any]:
        self._gc()
        if sid not in self._store:
            self._store[sid] = {"created_at": time.time(), "updated_at": time.time(), "state": "idle", "memory": {}}
        self._store[sid]["updated_at"] = time.time()
        return self._store[sid]

    def set_state(self, sid: str, state: str):
        s = self.get(sid)
        s["state"] = state
        s["updated_at"] = time.time()

    def set_memory(self, sid: str, key: str, value: Any):
        s = self.get(sid)
        s["memory"][key] = value
        s["updated_at"] = time.time()

    def _gc(self):
        now = time.time()
        dead = [k for k,v in self._store.items() if now - v.get("updated_at", v["created_at"]) > self.ttl]
        for k in dead:
            self._store.pop(k, None)
