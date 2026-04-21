import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="SafarBot AI Service", version="1.0.0")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        ms = int((time.time() - start) * 1000)
        print(
            f"[FASTAPI] {request.method} {request.url.path} -> {response.status_code} ({ms}ms)",
            flush=True,
        )
        return response
    except Exception as e:
        ms = int((time.time() - start) * 1000)
        print(
            f"[FASTAPI] {request.method} {request.url.path} -> EXCEPTION ({ms}ms) {e}",
            flush=True,
        )
        raise


@app.get("/ai/health")
def ai_health():
    return {
        "ok": True,
        "service": "SafarBot AI Service",
        "app_file": str(__file__),
    }


from agents.fraud_agent import router as fraud_router
from agents.insights_agent import router as insights_router

app.include_router(fraud_router)
app.include_router(insights_router)

try:
    from agents.voice_agent import router as voice_router
    app.include_router(voice_router)
    print("✅ voice router loaded", flush=True)
except Exception as e:
    print(f"⚠️ voice router skipped: {e}", flush=True)

print("✅ SafarBot AI loaded:", __file__, flush=True)