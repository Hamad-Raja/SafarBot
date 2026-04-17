from pathlib import Path
import joblib

MODEL_PATH = Path(__file__).resolve().parent / "models" / "intent_model.joblib"

print("Model path:", MODEL_PATH)
print("Exists:", MODEL_PATH.exists())

model = joblib.load(MODEL_PATH)
print("Loaded model:", type(model))

tests = [
    "I want to book a ticket from islamabad to lahore tomorrow",
    "show routes from rawalpindi to faisalabad",
    "select option 2",
    "i need 3 seats window",
    "pay with jazzcash",
    "cancel booking",
]

for t in tests:
    pred = model.predict([t])[0]
    print(f"\nTEXT: {t}\nPRED: {pred}")

# Optional: confidence if your pipeline supports predict_proba
try:
    proba = model.predict_proba([tests[0]])[0]
    conf = float(max(proba))
    print("\nConfidence example:", conf)
except Exception as e:
    print("\nNo predict_proba available:", e)