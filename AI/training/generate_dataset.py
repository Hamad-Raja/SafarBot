import os
import json
import random
import math
import pandas as pd
from datetime import datetime, timedelta

# ----------- CONFIG -----------
SEED = 42
N_ROWS = 60000  # increase to 100k if you want more
OUT_PATH = os.path.join("..", "data", "raw", "delay_dataset_raw.csv")

CITIES = [
    "Islamabad", "Rawalpindi", "Lahore", "Peshawar",
    "Faisalabad", "Multan", "Sialkot", "Gujranwala",
    "Bahawalpur", "Karachi", "Quetta"
]

OPERATORS = ["Daewoo", "Faisal Movers", "Niazi", "Bilal Travels", "Skyways", "Other"]
BUS_TYPES = ["Economy", "Executive", "Luxury"]

WEATHER = ["Clear", "Clouds", "Rain", "Thunderstorm", "Fog", "Haze"]

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def is_rush(hour: int) -> int:
    return 1 if hour in [7,8,9,17,18,19] else 0

def weekday_flag(date_str: str) -> int:
    d = datetime.fromisoformat(date_str)
    return 1 if d.weekday() < 5 else 0  # Mon-Fri = 1

def gen_trip():
    from_city, to_city = random.sample(CITIES, 2)
    operator = random.choice(OPERATORS)
    bus_type = random.choice(BUS_TYPES)

    # distance distribution (Pakistan intercity)
    distance_km = random.uniform(40, 1400)

    # speed depends on bus type a bit
    base_speed = random.uniform(55, 85)
    if bus_type == "Luxury":
        base_speed += 3
    if bus_type == "Economy":
        base_speed -= 2

    planned_duration_min = (distance_km / base_speed) * 60
    planned_duration_min *= random.uniform(0.95, 1.08)  # small noise

    # date
    start = datetime(2025, 1, 1)
    travel_date = (start + timedelta(days=random.randint(0, 650))).date().isoformat()

    departure_hour = random.randint(0, 23)

    # weather
    condition = random.choices(
        WEATHER,
        weights=[40, 25, 18, 4, 7, 6],
        k=1
    )[0]

    temp_c = random.uniform(5, 42)
    humidity = random.uniform(15, 95)
    wind_ms = random.uniform(0, 16)

    # price: rough estimate
    price = distance_km * random.uniform(2.2, 6.2)
    price = clamp(price, 500, 20000)

    return {
        "operator": operator,
        "bus_type": bus_type,
        "from_city": from_city,
        "to_city": to_city,
        "distance_km": distance_km,
        "planned_duration_min": planned_duration_min,
        "travel_date": travel_date,
        "departure_hour": departure_hour,
        "temp_c": temp_c,
        "humidity": humidity,
        "wind_ms": wind_ms,
        "condition": condition,
        "price": price,
        "is_weekday": weekday_flag(travel_date),
        "is_rush": is_rush(departure_hour),
    }

def synth_delay(row):
    """
    Create "delay_minutes" using a realistic rule-based + noise.
    This is good enough to train v1 model.
    Later replace labels with real arrival delays.
    """

    distance = row["distance_km"]
    dur = row["planned_duration_min"]
    hour = row["departure_hour"]
    condition = row["condition"]
    temp = row["temp_c"]
    wind = row["wind_ms"]
    humidity = row["humidity"]
    operator = row["operator"]
    bus_type = row["bus_type"]

    # base: longer trips have higher chance of delay
    delay = max(0.0, (distance - 80) * 0.025)

    # rush hour effect
    if row["is_rush"] == 1:
        delay += 7.5

    # weekday effect (more traffic)
    if row["is_weekday"] == 1:
        delay += 2.5

    # weather
    if condition == "Rain":
        delay += 10
    elif condition == "Thunderstorm":
        delay += 16
    elif condition == "Fog":
        delay += 12
    elif condition == "Haze":
        delay += 6

    # temperature extremes
    if temp > 40 or temp < 7:
        delay += 4

    # wind
    if wind > 10:
        delay += 2.5

    # humidity extreme
    if humidity > 85:
        delay += 2.0

    # operator reliability (toy priors)
    op_bias = {
        "Daewoo": 1.5,
        "Faisal Movers": 2.0,
        "Skyways": 2.7,
        "Bilal Travels": 3.2,
        "Niazi": 3.0,
        "Other": 3.5
    }.get(operator, 3.2)
    delay += op_bias

    # bus type
    if bus_type == "Luxury":
        delay -= 1.0
    elif bus_type == "Economy":
        delay += 1.2

    # proportional to planned duration a bit
    delay += (dur / 60) * 0.6  # per hour factor

    # noise (Gaussian)
    delay += random.gauss(0, 5)

    # clamp
    delay = clamp(delay, 0, 180)
    return delay

def main():
    random.seed(SEED)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    rows = []
    for _ in range(N_ROWS):
        r = gen_trip()
        r["delay_minutes"] = synth_delay(r)
        rows.append(r)

    df = pd.DataFrame(rows)
    df.to_csv(OUT_PATH, index=False)
    print(f"✅ Saved dataset: {OUT_PATH}  rows={len(df)}")

    # also save a simple schema
    schema = {
        "target": "delay_minutes",
        "categorical": ["operator", "bus_type", "from_city", "to_city", "condition"],
        "numerical": [
            "distance_km","planned_duration_min","departure_hour",
            "temp_c","humidity","wind_ms","price","is_weekday","is_rush"
        ]
    }
    schema_path = os.path.join("..", "model", "feature_schema.json")
    os.makedirs(os.path.dirname(schema_path), exist_ok=True)
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
    print(f"✅ Saved schema: {schema_path}")

if __name__ == "__main__":
    main()