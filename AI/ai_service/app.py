import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request

# Load .env BEFORE importing modules that use os.getenv(...)
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from agents.voice_agent import router as voice_router, APP_VERSION
from agents.fraud_agent import router as fraud_router


app = FastAPI(title="SafarBot AI Service")


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


app.include_router(voice_router)
app.include_router(fraud_router)

print("🔥 LOADED (CLEAN APP):", APP_VERSION, __file__, flush=True)