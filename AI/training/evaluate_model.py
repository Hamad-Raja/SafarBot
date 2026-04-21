import os
import joblib
import pandas as pd

MODEL_CANDIDATES = [
    os.path.join("..", "model", "delay_pipeline.joblib"),
    os.path.join("..", "model", "delay_model.joblib"),
]


def resolve_model_path():
    for candidate in MODEL_CANDIDATES:
        if os.path.exists(candidate):
            return candidate
    return MODEL_CANDIDATES[0]


def main():
    loaded = joblib.load(resolve_model_path())
    pipe = loaded.get("pipeline", loaded) if isinstance(loaded, dict) else loaded

    sample_row = {
        "operator": "Daewoo",
        "bus_type": "Executive",
        "from_city": "Islamabad",
        "to_city": "Lahore",
        "condition": "Rain",
        "distance_km": 375,
        "planned_duration_min": 300,
        "duration_min": 300,
        "departure_hour": 18,
        "hour_of_day": 18,
        "temp_c": 26,
        "humidity": 80,
        "wind_ms": 6,
        "rain_mm": 2,
        "traffic_index": 0.35,
        "price": 2200,
        "day_of_week": 1,
        "is_weekday": 1,
        "is_rush": 1,
    }
    feature_names = list(getattr(pipe, "feature_names_in_", []))
    if feature_names:
        sample = pd.DataFrame([{name: sample_row.get(name, 0) for name in feature_names}])
    else:
        sample = pd.DataFrame([sample_row])

    pred = pipe.predict(sample)[0]
    print("Predicted delay minutes:", round(float(pred), 2))

if __name__ == "__main__":
    main()
