from pathlib import Path
from typing import Optional, List, Tuple
import logging
import os

import joblib
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger("fraud_agent")

BASE = Path(__file__).resolve().parent.parent  # ai_service/
MODEL_PATH = BASE / "models" / "fraud_model.joblib"

FRAUD_MODEL = None
MODEL_LOAD_ERROR = None

# Configurable thresholds / weights
BLOCK_THRESHOLD = int(os.getenv("FRAUD_BLOCK_THRESHOLD", "70"))
REVIEW_THRESHOLD = int(os.getenv("FRAUD_REVIEW_THRESHOLD", "40"))

RULE_WEIGHT = float(os.getenv("FRAUD_RULE_WEIGHT", "0.55"))
ML_WEIGHT = float(os.getenv("FRAUD_ML_WEIGHT", "0.45"))

MODEL_VERSION = os.getenv("FRAUD_MODEL_VERSION", "fraud_model_v1")


def load_model_once():
    global FRAUD_MODEL, MODEL_LOAD_ERROR

    if FRAUD_MODEL is not None:
        return

    if not MODEL_PATH.exists():
        MODEL_LOAD_ERROR = f"Model not found at {MODEL_PATH}"
        logger.warning(MODEL_LOAD_ERROR)
        return

    try:
        FRAUD_MODEL = joblib.load(MODEL_PATH)
        MODEL_LOAD_ERROR = None
        logger.info("Fraud model loaded successfully from %s", str(MODEL_PATH))
    except Exception as e:
        FRAUD_MODEL = None
        MODEL_LOAD_ERROR = str(e)
        logger.exception("Fraud model load failed")


@router.on_event("startup")
async def _warmup():
    load_model_once()


class FraudReq(BaseModel):
    user_id: str

    seats_count: int = Field(ge=0, le=50)
    total_amount: float = Field(ge=0)

    bookings_last_1min: int = Field(default=0, ge=0, le=50)
    bookings_last_10min: int = Field(default=0, ge=0, le=200)

    same_device_flag: int = Field(default=0, ge=0, le=1)
    duplicate_route_flag: int = Field(default=0, ge=0, le=1)

    account_age_days: int = Field(default=30, ge=0, le=5000)
    night_booking_flag: int = Field(default=0, ge=0, le=1)

    cancellation_history_ratio: float = Field(default=0.0, ge=0.0, le=1.0)


class FraudResp(BaseModel):
    score: int
    decision: str
    risk_level: str
    reasons: List[str]
    explanations: List[str]
    rule_score: int
    ml_score: Optional[int] = None
    ml_prob: Optional[float] = None
    model_loaded: bool = False
    model_version: str
    model_error: Optional[str] = None


RULE_EXPLANATIONS = {
    "BULK_SEATS_8_PLUS": "User selected 8 or more seats in a single booking.",
    "BULK_SEATS_6_PLUS": "User selected 6 or more seats in a single booking.",
    "HIGH_FREQUENCY_1MIN": "Multiple bookings were attempted within 1 minute.",
    "MED_FREQUENCY_1MIN": "Repeated booking activity was detected within 1 minute.",
    "HIGH_FREQUENCY_10MIN": "Booking frequency was unusually high within 10 minutes.",
    "SAME_DEVICE_MULTI_ACCOUNTS": "The same device appears to be used by different accounts.",
    "DUPLICATE_ROUTE_SAME_DAY": "A duplicate booking attempt was detected for the same route and day.",
    "NEW_ACCOUNT_0_2_DAYS": "The account is extremely new.",
    "NEW_ACCOUNT_3_7_DAYS": "The account is recently created.",
    "NIGHT_BOOKING": "The booking was made during late-night hours.",
    "HIGH_CANCELLATION_HISTORY": "The user has a very high cancellation history.",
    "MED_CANCELLATION_HISTORY": "The user has a noticeable cancellation history.",
    "VERY_HIGH_AMOUNT": "The booking amount is unusually high.",
    "HIGH_AMOUNT": "The booking amount is higher than normal.",
    "ML_RISK_SIGNAL": "The machine learning model detected suspicious behavior patterns.",
    "NO_RULE_TRIGGERED": "No direct rule was triggered for this booking.",
}


def rule_engine(req: FraudReq) -> Tuple[int, List[str]]:
    score = 0
    reasons: List[str] = []

    if req.seats_count >= 8:
        score += 40
        reasons.append("BULK_SEATS_8_PLUS")
    elif req.seats_count >= 6:
        score += 20
        reasons.append("BULK_SEATS_6_PLUS")

    if req.bookings_last_1min >= 3:
        score += 50
        reasons.append("HIGH_FREQUENCY_1MIN")
    elif req.bookings_last_1min == 2:
        score += 25
        reasons.append("MED_FREQUENCY_1MIN")

    if req.bookings_last_10min >= 6:
        score += 20
        reasons.append("HIGH_FREQUENCY_10MIN")

    if req.same_device_flag == 1:
        score += 30
        reasons.append("SAME_DEVICE_MULTI_ACCOUNTS")

    if req.duplicate_route_flag == 1:
        score += 15
        reasons.append("DUPLICATE_ROUTE_SAME_DAY")

    if req.account_age_days <= 2:
        score += 30
        reasons.append("NEW_ACCOUNT_0_2_DAYS")
    elif req.account_age_days <= 7:
        score += 15
        reasons.append("NEW_ACCOUNT_3_7_DAYS")

    if req.night_booking_flag == 1:
        score += 8
        reasons.append("NIGHT_BOOKING")

    if req.cancellation_history_ratio >= 0.75:
        score += 25
        reasons.append("HIGH_CANCELLATION_HISTORY")
    elif req.cancellation_history_ratio >= 0.55:
        score += 12
        reasons.append("MED_CANCELLATION_HISTORY")

    if req.total_amount >= 32000:
        score += 15
        reasons.append("VERY_HIGH_AMOUNT")
    elif req.total_amount >= 22000:
        score += 8
        reasons.append("HIGH_AMOUNT")

    return score, reasons


def ml_score_fn(req: FraudReq) -> Tuple[Optional[int], Optional[float]]:
    load_model_once()

    if FRAUD_MODEL is None:
        return None, None

    X = [[
        req.seats_count,
        req.total_amount,
        req.bookings_last_1min,
        req.bookings_last_10min,
        req.same_device_flag,
        req.duplicate_route_flag,
        req.account_age_days,
        req.night_booking_flag,
        req.cancellation_history_ratio,
    ]]

    try:
        prob = float(FRAUD_MODEL.predict_proba(X)[0][1])
        return int(round(prob * 100)), prob
    except Exception:
        try:
            pred = int(FRAUD_MODEL.predict(X)[0])
            prob = 0.85 if pred == 1 else 0.15
            return int(round(prob * 100)), prob
        except Exception:
            logger.exception("Fraud model inference failed")
            return None, None


def decide(final_score: int) -> str:
    if final_score >= BLOCK_THRESHOLD:
        return "BLOCK"
    if final_score >= REVIEW_THRESHOLD:
        return "REVIEW"
    return "ALLOW"


def get_risk_level(final_score: int) -> str:
    if final_score >= BLOCK_THRESHOLD:
        return "HIGH"
    if final_score >= REVIEW_THRESHOLD:
        return "MEDIUM"
    return "LOW"


def build_explanations(reasons: List[str]) -> List[str]:
    return [RULE_EXPLANATIONS.get(reason, reason) for reason in reasons]


@router.get("/fraud/health")
def fraud_health():
    load_model_once()
    return {
        "ok": True,
        "model_loaded": FRAUD_MODEL is not None,
        "model_version": MODEL_VERSION,
        "model_path": str(MODEL_PATH),
        "model_error": MODEL_LOAD_ERROR,
        "review_threshold": REVIEW_THRESHOLD,
        "block_threshold": BLOCK_THRESHOLD,
    }


@router.post("/fraud/score", response_model=FraudResp)
def fraud_score_api(req: FraudReq):
    r_score, reasons = rule_engine(req)
    m_score, m_prob = ml_score_fn(req)

    if m_score is None:
        final = r_score
    else:
        total_weight = RULE_WEIGHT + ML_WEIGHT
        safe_rule_weight = RULE_WEIGHT / total_weight if total_weight > 0 else 0.55
        safe_ml_weight = ML_WEIGHT / total_weight if total_weight > 0 else 0.45
        final = int(round((safe_rule_weight * r_score) + (safe_ml_weight * m_score)))

    final = max(0, min(100, final))
    decision = decide(final)

    if decision == "ALLOW" and r_score >= REVIEW_THRESHOLD:
        decision = "REVIEW"
        final = max(final, REVIEW_THRESHOLD)

    if r_score >= BLOCK_THRESHOLD:
        decision = "BLOCK"
        final = max(final, BLOCK_THRESHOLD)

    final_reasons = list(reasons) if reasons else []

    if not final_reasons and m_score is not None and m_score >= REVIEW_THRESHOLD:
        final_reasons.append("ML_RISK_SIGNAL")

    if not final_reasons:
        final_reasons.append("NO_RULE_TRIGGERED")

    risk_level = get_risk_level(final)
    explanations = build_explanations(final_reasons)

    logger.info(
        "Fraud scored user_id=%s decision=%s risk=%s final=%s rule=%s ml=%s model_loaded=%s",
        req.user_id,
        decision,
        risk_level,
        final,
        r_score,
        m_score,
        FRAUD_MODEL is not None,
    )

    return FraudResp(
        score=final,
        decision=decision,
        risk_level=risk_level,
        reasons=final_reasons,
        explanations=explanations,
        rule_score=r_score,
        ml_score=m_score,
        ml_prob=m_prob,
        model_loaded=FRAUD_MODEL is not None,
        model_version=MODEL_VERSION,
        model_error=MODEL_LOAD_ERROR,
    )