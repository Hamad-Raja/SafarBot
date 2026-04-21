import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/insights", tags=["insights"])

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_CANDIDATES = [
    BASE_DIR / "models" / "insights" / "delay_model.joblib",
    BASE_DIR / "models" / "insights" / "delay_pipeline.joblib",
    BASE_DIR / "models" / "delay_model.joblib",
    BASE_DIR / "models" / "delay_pipeline.joblib",
]

SCHEMA_CANDIDATES = [
    BASE_DIR / "models" / "insights" / "feature_schema.json",
    BASE_DIR / "models" / "feature_schema.json",
]

MODEL = None
MODEL_PATH = None
FEATURE_SCHEMA = None


class PredictDelayBase(BaseModel):
    operator: str = Field(..., example="Daewoo")
    bus_type: str = Field(..., example="Executive")
    from_city: str = Field(..., example="Islamabad")
    to_city: str = Field(..., example="Lahore")
    distance_km: float = Field(..., example=380.5)

    duration_min: Optional[float] = Field(None, example=300)
    planned_duration_min: Optional[float] = Field(None, example=300)

    temp_c: float = Field(..., example=17.1)
    humidity: Optional[float] = Field(None, example=68)
    wind_ms: float = Field(..., example=2.8)
    condition: Optional[str] = Field(None, example="Rain")
    rain_mm: float = Field(0.0, example=0.0)
    traffic_index: float = Field(0.2, ge=0.0, le=1.0, example=0.35)

    price: Optional[float] = Field(None, example=2200)
    travel_date: Optional[str] = Field(None, example="2026-03-16")
    hour_of_day: Optional[int] = Field(None, ge=0, le=23, example=18)
    departure_hour: Optional[int] = Field(None, ge=0, le=23, example=18)
    day_of_week: Optional[int] = Field(None, ge=0, le=6, example=1)
    is_weekday: Optional[int] = Field(None, ge=0, le=1, example=1)
    is_rush: Optional[int] = Field(None, ge=0, le=1, example=1)


class PredictDelayRequest(PredictDelayBase):
    pass


class PredictDelayResponse(BaseModel):
    delay_minutes: float
    will_delay: bool
    threshold_minutes: float
    model_path: str


class RunDelayAgentItem(PredictDelayBase):
    trip_id: str


class RunDelayAgentRequest(BaseModel):
    threshold_minutes: Optional[float] = None
    trips: List[RunDelayAgentItem]


class TripPrediction(BaseModel):
    trip_id: str
    from_city: str
    to_city: str
    operator: str
    bus_type: str
    delay_minutes: float
    will_delay: bool


class RunDelayAgentResponse(BaseModel):
    threshold_minutes: float
    delayed: List[TripPrediction]
    not_delayed: List[TripPrediction]
    model_path: str


def first_existing(paths):
    for path in paths:
        if path.exists():
            return path
    return None


def resolve_model_path():
    path = first_existing(MODEL_CANDIDATES)
    if not path:
        raise RuntimeError(
            "Delay model file not found. Checked: "
            + ", ".join(str(p) for p in MODEL_CANDIDATES)
        )
    return path


def load_feature_schema():
    global FEATURE_SCHEMA
    if FEATURE_SCHEMA is not None:
        return FEATURE_SCHEMA

    schema_path = first_existing(SCHEMA_CANDIDATES)
    if schema_path:
        try:
            FEATURE_SCHEMA = json.loads(schema_path.read_text(encoding="utf-8"))
        except Exception:
            FEATURE_SCHEMA = {}
    else:
        FEATURE_SCHEMA = {}

    return FEATURE_SCHEMA


def get_model():
    global MODEL, MODEL_PATH

    if MODEL is None:
        MODEL_PATH = resolve_model_path()
        loaded = joblib.load(MODEL_PATH)
        MODEL = loaded.get("pipeline", loaded) if isinstance(loaded, dict) else loaded

        estimator = getattr(MODEL, "named_steps", {}).get("model", MODEL)
        if hasattr(estimator, "n_jobs"):
            estimator.n_jobs = 1

    return MODEL


def env_threshold():
    try:
        return float(os.getenv("DELAY_THRESHOLD_MINUTES", "10"))
    except ValueError:
        return 10.0


def derive_fields(payload):
    travel_date = payload.get("travel_date")
    hour = payload.get("hour_of_day")
    if hour is None:
        hour = payload.get("departure_hour")

    day_of_week = payload.get("day_of_week")
    if day_of_week is None and travel_date:
        try:
            day_of_week = datetime.fromisoformat(travel_date).weekday()
        except ValueError:
            day_of_week = None

    is_weekday = payload.get("is_weekday")
    if is_weekday is None and day_of_week is not None:
        is_weekday = 1 if day_of_week < 5 else 0

    is_rush = payload.get("is_rush")
    if is_rush is None and hour is not None:
        is_rush = 1 if hour in {7, 8, 9, 17, 18, 19} else 0

    duration_min = payload.get("duration_min")
    planned_duration_min = payload.get("planned_duration_min")

    if duration_min is None:
        duration_min = planned_duration_min
    if planned_duration_min is None:
        planned_duration_min = duration_min

    return {
        "duration_min": duration_min if duration_min is not None else 0.0,
        "planned_duration_min": planned_duration_min if planned_duration_min is not None else 0.0,
        "hour_of_day": hour if hour is not None else 0,
        "departure_hour": hour if hour is not None else 0,
        "day_of_week": day_of_week if day_of_week is not None else 0,
        "is_weekday": is_weekday if is_weekday is not None else 1,
        "is_rush": is_rush if is_rush is not None else 0,
        "condition": payload.get("condition") or "Clear",
        "humidity": payload.get("humidity", 0.0) or 0.0,
        "price": payload.get("price", 0.0) or 0.0,
        "traffic_index": payload.get("traffic_index", 0.0) or 0.0,
        "rain_mm": payload.get("rain_mm", 0.0) or 0.0,
    }


def expected_feature_names(model):
    feature_names = list(getattr(model, "feature_names_in_", []))
    if feature_names:
        return feature_names

    schema = load_feature_schema()
    return schema.get("categorical", []) + schema.get("numerical", [])


def build_features(records, model):
    normalized = []

    for record in records:
        item = dict(record)
        item.update(derive_fields(item))
        normalized.append(item)

    frame = pd.DataFrame(normalized)
    feature_names = expected_feature_names(model)

    if feature_names:
        for name in feature_names:
            if name not in frame.columns:
                frame[name] = 0
        frame = frame[feature_names]

    return frame


@router.get("/health")
def insights_health():
    path = first_existing(MODEL_CANDIDATES)
    return {
        "status": "ok",
        "model_found": bool(path),
        "model_path": str(path) if path else None,
        "checked_paths": [str(p) for p in MODEL_CANDIDATES],
    }


@router.post("/predict_delay", response_model=PredictDelayResponse)
def predict_delay(req: PredictDelayRequest):
    try:
        model = get_model()
        X = build_features([req.model_dump()], model)
        pred = float(model.predict(X)[0])
        pred = max(0.0, pred)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    threshold = env_threshold()

    return {
        "delay_minutes": round(pred, 2),
        "will_delay": pred >= threshold,
        "threshold_minutes": threshold,
        "model_path": str(MODEL_PATH),
    }


@router.post("/run_delay_agent", response_model=RunDelayAgentResponse)
def run_delay_agent(req: RunDelayAgentRequest):
    try:
        model = get_model()
        threshold = float(req.threshold_minutes) if req.threshold_minutes is not None else env_threshold()

        X = build_features([trip.model_dump() for trip in req.trips], model)
        preds = [max(0.0, float(x)) for x in model.predict(X)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {e}")

    delayed = []
    not_delayed = []

    for trip, pred in zip(req.trips, preds):
        item = {
            "trip_id": trip.trip_id,
            "from_city": trip.from_city,
            "to_city": trip.to_city,
            "operator": trip.operator,
            "bus_type": trip.bus_type,
            "delay_minutes": round(pred, 2),
            "will_delay": pred >= threshold,
        }

        if pred >= threshold:
            delayed.append(item)
        else:
            not_delayed.append(item)

    return {
        "threshold_minutes": threshold,
        "delayed": delayed,
        "not_delayed": not_delayed,
        "model_path": str(MODEL_PATH),
    }