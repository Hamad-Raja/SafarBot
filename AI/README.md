# SafarBot AI (Local) — Whisper STT + Intent (TF-IDF) + Slots + FastAPI

This folder is a **starter AI module** for SafarBot:
- Local STT using **faster-whisper** (CPU)
- Intent classifier you train (TF-IDF + LogisticRegression)
- Rule-based slot extraction (cities/date/time/provider/seats/payment)
- Simple in-memory session memory (demo-friendly)

## 1) Train your intent model (recommended)
You can train in **Colab** using `training/train_intent.ipynb` OR locally:

```bash
cd training
pip install pandas scikit-learn joblib
python train_intent.py
```

This saves:
`ai_service/models/intent_model.joblib`

## 2) Run FastAPI AI service (Windows)
Install **Python 3.10+ (64-bit)**, then **FFmpeg** and add it to PATH.
Check:
```bash
ffmpeg -version
```

Run:
```bash
cd ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

Health:
```bash
curl http://127.0.0.1:8000/health
```

## 3) Test text intent + slots
```bash
curl -X POST http://127.0.0.1:8000/intent ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"mujhe islamabad se lahore jana hai kal\"}"
```

## 4) Test voice (no frontend needed)
Use **Postman**:
- POST `http://127.0.0.1:8000/voice/understand`
- form-data key `audio` (File) -> upload .wav/.mp3/.webm

Or curl:
```bash
curl -X POST http://127.0.0.1:8000/voice/understand ^
  -F "audio=@sample.wav"
```

## 5) Node integration
See `node_integration/voiceRoute_example.js` for calling this AI service.

## Notes
- Update cities list in `ai_service/config.json` to match your full `PAK_CITIES`.
- STT quality depends on mic and noise. Whisper is strong, but no system is 100% perfect.
