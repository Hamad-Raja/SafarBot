from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional
import json
import joblib

from slot_extractor import extract_slots  # your updated one

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "models" / "intent_model.joblib"
CONFIG_PATH = BASE / "config.json"

_model = None
_config: Dict[str, Any] = {}

def load_assets() -> None:
    global _model, _config
    if CONFIG_PATH.exists():
        _config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    else:
        _config = {"cities": [], "providers": [], "city_aliases": {}}

    if MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    else:
        _model = None

def understand(text: str) -> Dict[str, Any]:
    text = text or ""
    intent = "search_routes"
    confidence: Optional[float] = None

    if _model is not None:
        intent = _model.predict([text])[0]
        try:
            proba = _model.predict_proba([text])[0]
            confidence = float(max(proba))
        except Exception:
            confidence = None

    slots = extract_slots(text, _config)

    return {
        "text": text,
        "intent": intent,
        "confidence": confidence,
        "slots": slots,
    }