import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error
from sklearn.ensemble import RandomForestRegressor

# --------- Synthetic dataset generator (you can replace later with real data) ----------
def generate_synthetic(n=20000, seed=42):
    rng = np.random.default_rng(seed)

    operators = ["Daewoo", "Faisal Movers", "Niazi", "Skyways"]
    bus_types = ["Executive", "Business", "Economy"]
    cities = ["Islamabad", "Rawalpindi", "Lahore", "Faisalabad", "Multan", "Peshawar", "Karachi"]

    df = pd.DataFrame({
        "operator": rng.choice(operators, n),
        "bus_type": rng.choice(bus_types, n),
        "from_city": rng.choice(cities, n),
        "to_city": rng.choice(cities, n),
        "distance_km": rng.uniform(50, 1400, n).round(2),
        "duration_min": rng.uniform(60, 1200, n).round(0),
        "traffic_index": rng.uniform(0, 1, n).round(3),     # 0..1
        "rain_mm": rng.exponential(2.0, n).round(2),        # mostly small
        "wind_ms": rng.uniform(0, 15, n).round(2),
        "temp_c": rng.uniform(5, 42, n).round(2),
        "hour_of_day": rng.integers(0, 24, n),
        "day_of_week": rng.integers(0, 7, n),
    })

    # make realistic-ish delay minutes
    base = 5 + (df["distance_km"] / 200) + (df["duration_min"] / 300)
    traffic = 45 * df["traffic_index"]
    rain = 3.0 * np.minimum(df["rain_mm"], 20)
    wind = 0.7 * np.maximum(df["wind_ms"] - 8, 0)
    rush = np.where(df["hour_of_day"].isin([7, 8, 9, 17, 18, 19]), 10, 0)
    weekend = np.where(df["day_of_week"].isin([5, 6]), 6, 0)

    noise = rng.normal(0, 6, n)

    df["delay_minutes"] = np.maximum(0, base + traffic + rain + wind + rush + weekend + noise).round(1)
    # remove impossible same city route
    df = df[df["from_city"] != df["to_city"]].reset_index(drop=True)
    return df


def main():
    root = os.path.dirname(os.path.dirname(__file__))  # AI/ai_real_time_insights
    model_dir = os.path.join(root, "model")
    os.makedirs(model_dir, exist_ok=True)
    out_path = os.path.join(model_dir, "delay_pipeline.joblib")

    df = generate_synthetic(n=25000)

    target = "delay_minutes"
    X = df.drop(columns=[target])
    y = df[target]

    cat_cols = ["operator", "bus_type", "from_city", "to_city"]
    num_cols = [c for c in X.columns if c not in cat_cols]

    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", "passthrough", num_cols),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
        max_depth=18,
        min_samples_leaf=2
    )

    pipe = Pipeline([
        ("pre", pre),
        ("model", model)
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, preds)

    joblib.dump(pipe, out_path)
    print(f"✅ Saved model pipeline: {out_path}")
    print(f"📉 MAE (minutes): {mae:.2f}")


if __name__ == "__main__":
    main()