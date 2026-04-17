import os
import asyncio
import uuid
import time
import subprocess
import json
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

import joblib
import edge_tts
import pyttsx3
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

import requests

from slot_extractor import extract_slots, normalize_text as slots_normalize_text

APP_VERSION = "APP_PY_OPENAI_SLOT_V6_URDU_STT_BOOST"

router = APIRouter()  # ✅ now using router (not FastAPI app)

# -----------------------------
# Optional: OpenAI (NLU fallback)
# -----------------------------
HAVE_OPENAI = False
OPENAI_IMPORT_ERROR = None
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

try:
    if OPENAI_API_KEY:
        from openai import OpenAI
        HAVE_OPENAI = True
except Exception as e:
    OPENAI_IMPORT_ERROR = str(e)
    HAVE_OPENAI = False

# -----------------------------
# STT (Whisper)
# -----------------------------
HAVE_STT = True
STT_IMPORT_ERROR = None
try:
    from faster_whisper import WhisperModel
except Exception as e:
    HAVE_STT = False
    STT_IMPORT_ERROR = str(e)

BASE = Path(__file__).resolve().parent.parent  # ✅ points to ai_service/
TMP_DIR = BASE / "tmp_audio"
TMP_DIR.mkdir(exist_ok=True)

TTS_DIR = BASE / "tmp_tts"
TTS_DIR.mkdir(exist_ok=True)

MODEL_PATH = BASE / "models" / "intent_model.joblib"
CONFIG_PATH = BASE / "config.json"

WHISPER_MODEL: Optional["WhisperModel"] = None
INTENT_MODEL = None
CONFIG: Dict[str, Any] = {}

# -----------------------------
# Helpers
# -----------------------------
def load_config() -> Dict[str, Any]:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {"cities": [], "providers": [], "city_aliases": {}, "city_aliases_urdu": {}}
    return {"cities": [], "providers": [], "city_aliases": {}, "city_aliases_urdu": {}}

def load_intent_model():
    if MODEL_PATH.exists():
        try:
            m = joblib.load(MODEL_PATH)
            print("✅ Intent model loaded", flush=True)
            return m
        except Exception as e:
            print("❌ Failed to load intent model:", e, flush=True)
            return None
    print("❌ Intent model not found", flush=True)
    return None

def get_whisper():
    global WHISPER_MODEL
    if not HAVE_STT:
        return None
    if WHISPER_MODEL is None:
        WHISPER_MODEL = WhisperModel("base", device="cpu", compute_type="int8")
    return WHISPER_MODEL

def predict_intent(text: str) -> Dict[str, Any]:
    global INTENT_MODEL
    if INTENT_MODEL is None:
        return {"intent": "search_routes", "confidence": None}

    intent = INTENT_MODEL.predict([text])[0]
    confidence = None
    try:
        proba = INTENT_MODEL.predict_proba([text])[0]
        confidence = float(max(proba))
    except Exception:
        confidence = None

    return {"intent": intent, "confidence": confidence}

def build_response(text: str, session_id: Optional[str], slots: Dict[str, Any]) -> Dict[str, Any]:
    intent_out = predict_intent(text)
    return {
        "session_id": session_id,
        "text": text,
        "intent": intent_out["intent"],
        "confidence": intent_out["confidence"],
        "slots": slots,
    }

# -----------------------------
# ffmpeg conversion (webm -> wav 16k mono)
# -----------------------------
def to_wav_16k(in_path: Path) -> Path:
    out_path = in_path.with_suffix(".wav")
    cmd = ["ffmpeg", "-y", "-i", str(in_path), "-ac", "1", "-ar", "16000", str(out_path)]
    subprocess.run(cmd, check=True)
    return out_path

# -----------------------------
# Offline TTS fallback (pyttsx3) -> WAV
# -----------------------------
def tts_offline_wav(text: str, out_path: Path):
    engine = pyttsx3.init()
    engine.setProperty("rate", 165)
    engine.save_to_file(text, str(out_path))
    engine.runAndWait()

# -----------------------------
# OpenAI slot extraction (fallback)
# -----------------------------
def _post_validate_city(city: Optional[str], cities: List[str]) -> Optional[str]:
    if not city:
        return None
    for c in cities:
        if c.lower() == city.strip().lower():
            return c
    return None

def openai_extract_slots(text: str, config: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    if not HAVE_OPENAI:
        return {}, {"openai_used": False, "reason": "OPENAI not available / key missing"}

    client = OpenAI(api_key=OPENAI_API_KEY)
    cities = config.get("cities", [])
    providers = config.get("providers", [])

    schema = {
        "name": "safarbot_slots",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "from": {"type": ["string", "null"]},
                "to": {"type": ["string", "null"]},
                "date": {"type": ["string", "null"]},
                "time": {"type": ["string", "null"]},
                "seat_count": {"type": ["integer", "null"]},
                "provider": {"type": ["string", "null"]},
                "intent_hint": {"type": ["string", "null"]},
            },
            "required": ["from", "to", "date", "time", "seat_count", "provider", "intent_hint"],
            "additionalProperties": False,
        },
    }

    system = (
        "You extract bus travel booking slots for Pakistan routes.\n"
        "Return ONLY JSON matching the schema.\n"
        "Rules:\n"
        "- Cities must be English city names from list when possible.\n"
        "- Map Urdu misspellings like اسلامبات / اسلام آبات -> Islamabad.\n"
        "- Providers can be Hamad / Faisal Movers / Daewoo etc.\n"
        f"Cities: {cities}\n"
        f"Providers: {providers}\n"
    )

    resp = client.responses.create(
        model=OPENAI_MODEL,
        input=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"User text: {text}"},
        ],
        response_format={"type": "json_schema", "json_schema": schema},
    )

    data = getattr(resp, "output_json", None)
    if not isinstance(data, dict):
        out_text = getattr(resp, "output_text", "") or ""
        try:
            data = json.loads(out_text)
        except Exception:
            data = {}

    out: Dict[str, Any] = {}
    out["from"] = _post_validate_city(data.get("from"), cities)
    out["to"] = _post_validate_city(data.get("to"), cities)
    for k in ["date", "time", "seat_count", "provider"]:
        out[k] = data.get(k)

    if out.get("provider") and providers:
        prov = str(out["provider"]).strip().lower()
        matched = None
        for p in providers:
            if p.lower() == prov:
                matched = p
                break
        out["provider"] = matched if matched else out["provider"]

    debug = {"openai_used": True, "model": OPENAI_MODEL, "raw": data}
    return out, debug

# -----------------------------
# Startup (moved to router)
# -----------------------------
@router.on_event("startup")
async def warmup():
    global CONFIG, INTENT_MODEL
    CONFIG = load_config()
    print("✅ Config loaded. Cities:", len(CONFIG.get("cities", [])), flush=True)
    print("✅ Has Urdu Aliases:", "city_aliases_urdu" in CONFIG, flush=True)
    INTENT_MODEL = load_intent_model()
    if HAVE_STT:
        await asyncio.to_thread(get_whisper)

# -----------------------------
# Schemas
# -----------------------------
class TextIn(BaseModel):
    text: str
    session_id: Optional[str] = None

# -----------------------------
# Endpoints (SAME PATHS as before)
# -----------------------------
@router.get("/health")
def health():
    return {
        "ok": True,
        "app_version": APP_VERSION,
        "app_file": str(__file__),
        "stt_ready": bool(HAVE_STT),
        "stt_import_error": STT_IMPORT_ERROR,
        "openai_ready": bool(HAVE_OPENAI),
        "openai_import_error": OPENAI_IMPORT_ERROR,
        "intent_model_loaded": bool(INTENT_MODEL is not None),
        "config_loaded": bool(CONFIG is not None),
    }

@router.post("/intent")
def intent_api(inp: TextIn):
    txt = (inp.text or "").strip()
    if not txt:
        raise HTTPException(status_code=400, detail="text is required")
    slots = extract_slots(txt, CONFIG)
    return build_response(txt, inp.session_id, slots)

@router.post("/voice/understand")
async def voice_understand(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Query(None),
):
    model = get_whisper()
    if model is None:
        return {
            "session_id": session_id,
            "text": "",
            "intent": "search_routes",
            "confidence": None,
            "slots": {},
            "stt_language": None,
            "debug": {"stt_ready": False, "error": STT_IMPORT_ERROR},
        }

    data = await audio.read()
    print("🎧 UPLOAD:", {"filename": audio.filename, "content_type": audio.content_type, "bytes": len(data)}, flush=True)

    if not data or len(data) < 2000:
        raise HTTPException(status_code=400, detail=f"Empty/too small audio ({len(data)} bytes)")

    ext = Path(audio.filename or "audio.webm").suffix or ".webm"
    raw_path = TMP_DIR / f"input_{uuid.uuid4().hex}{ext}"
    raw_path.write_bytes(data)

    try:
        wav_path = to_wav_16k(raw_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ffmpeg convert failed: {e}")

    wav_size = wav_path.stat().st_size if wav_path.exists() else 0
    print("🎚️ WAV:", {"path": str(wav_path), "bytes": wav_size}, flush=True)

    debug: Dict[str, Any] = {
        "upload_bytes": len(data),
        "wav_bytes": wav_size,
        "model": "base",
        "vad_filter": True,
        "language_forced": "ur",
        "segments": 0,
        "openai_fallback_used": False,
    }

    segments_gen, info = model.transcribe(
        str(wav_path),
        vad_filter=True,
        language="ur",
        beam_size=5,
        best_of=3,
        initial_prompt=(
            "یہ پاکستان میں بس سفر کے بارے میں گفتگو ہے۔ "
            "شہر: اسلام آباد، لاہور، کراچی، راولپنڈی، فیصل آباد، گوجرانوالہ۔ "
            "بس آپریٹر: حماد، فیصل موورز، داوو۔ "
            "جملہ مثال: مجھے کل اسلام آباد سے لاہور جانا ہے۔"
        ),
    )

    segments = list(segments_gen)
    debug["segments"] = len(segments)

    text = " ".join([seg.text.strip() for seg in segments]).strip()
    print("🎙️ RAW TRANSCRIPT:", text, flush=True)

    text_norm = slots_normalize_text(text)
    print("🎙️ AFTER NORMALIZE:", text_norm, flush=True)

    slots_rule = extract_slots(text, CONFIG)

    need_openai = (slots_rule.get("from") is None or slots_rule.get("to") is None)
    slots_final = dict(slots_rule)

    openai_debug = None
    if need_openai and HAVE_OPENAI:
        slots_ai, openai_debug = await asyncio.to_thread(openai_extract_slots, text, CONFIG)
        if slots_ai:
            debug["openai_fallback_used"] = True
            for k, v in slots_ai.items():
                if slots_final.get(k) in (None, "", {}) and v not in (None, "", {}):
                    slots_final[k] = v

    print("🧩 SLOTS OUT:", slots_final, flush=True)

    out = build_response(text, session_id, slots_final)
    out["stt_language"] = getattr(info, "language", None)
    debug["openai_debug"] = openai_debug
    out["debug"] = debug
    return out

@router.post("/tts")
async def tts(inp: TextIn):
    txt = (inp.text or "").strip()
    if not txt:
        raise HTTPException(status_code=400, detail="text is required")

    voice = "ur-PK-UzmaNeural"
    mp3_path = TTS_DIR / f"{uuid.uuid4().hex}.mp3"
    try:
        communicate = edge_tts.Communicate(txt, voice)
        await communicate.save(str(mp3_path))
        return FileResponse(str(mp3_path), media_type="audio/mpeg", filename="reply.mp3")
    except Exception as e:
        print("⚠️ Edge TTS failed, fallback to offline pyttsx3:", e, flush=True)

    wav_path = TTS_DIR / f"{uuid.uuid4().hex}.wav"
    try:
        await asyncio.to_thread(tts_offline_wav, txt, wav_path)
        return FileResponse(str(wav_path), media_type="audio/wav", filename="reply.wav")
    except Exception as e:
        print("❌ Offline TTS also failed:", e, flush=True)
        raise HTTPException(status_code=503, detail="TTS temporarily unavailable (edge + offline failed)")

@router.get("/openai/ping")
def openai_ping():
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(400, "OPENAI_API_KEY env var missing")

    r = requests.post(
        "https://api.openai.com/v1/responses",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        json={"model": "gpt-4.1-mini", "input": "ping"},
        timeout=30,
    )
    return {
        "status_code": r.status_code,
        "body": r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
    }