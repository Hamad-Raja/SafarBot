import csv
import random
from datetime import datetime

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

N_ROWS = 10000
FRAUD_RATE_TARGET = 0.07  # ~7% fraud like real-world imbalance

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def bern(p):
    return 1 if random.random() < p else 0

def generate_row() -> list:
    """
    Generates a realistic-ish booking row with overlapping patterns + noise.
    label: 0=legit, 1=fraud
    """

    # ----- Base distributions (legit-biased) -----
    seats_count = random.choices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                                 weights=[28, 26, 16, 9, 6, 4, 3, 3, 1, 1])[0]

    base_fare = random.randint(2200, 4200)  # per seat
    total_amount = seats_count * base_fare + random.randint(-500, 900)

    bookings_last_1min = random.choices([0, 1, 2, 3, 4],
                                        weights=[65, 22, 8, 4, 1])[0]
    bookings_last_10min = clamp(bookings_last_1min + random.choices([0, 1, 2, 3, 4, 5],
                                weights=[20, 25, 22, 15, 10, 8])[0], 0, 12)

    account_age_days = int(abs(random.gauss(60, 90)))  # many accounts young-ish, some old
    account_age_days = clamp(account_age_days, 0, 1500)

    # Night flag 1AM–5AM: ~12% of bookings happen then
    night_booking_flag = bern(0.12)

    # Duplicate route same day: legit can happen too
    duplicate_route_flag = bern(0.08)

    # same device used by multiple accounts (rare legit)
    same_device_flag = bern(0.05)

    # cancellation ratio: most legit low, some high
    cancellation_history_ratio = clamp(random.betavariate(2, 8), 0.0, 1.0)  # skew low

    # ----- Noise + realistic overlaps -----
    # Some legit bulk bookings exist (families/agents)
    legit_bulk_booking = bern(0.04)  # 4%
    if legit_bulk_booking:
        seats_count = random.choice([6, 7, 8])
        total_amount = seats_count * random.randint(2400, 3800)

    # ----- Fraud propensity scoring (latent) -----
    # We compute a latent "risk" and then sample label from it
    risk = 0.0

    # Bulk seats: suspicious but not always
    if seats_count >= 8:
        risk += 1.4
    elif seats_count >= 6:
        risk += 0.7

    # High rapid retries
    if bookings_last_1min >= 3:
        risk += 1.6
    elif bookings_last_1min == 2:
        risk += 0.8

    if bookings_last_10min >= 5:
        risk += 1.0

    # same device multi-account
    if same_device_flag == 1:
        risk += 1.2

    # duplicate route spam
    if duplicate_route_flag == 1 and bookings_last_10min >= 3:
        risk += 0.9
    elif duplicate_route_flag == 1:
        risk += 0.4

    # brand-new accounts more risky
    if account_age_days <= 2:
        risk += 1.4
    elif account_age_days <= 7:
        risk += 0.7

    # night time slight risk
    if night_booking_flag == 1:
        risk += 0.35

    # high cancellation history is strong risk
    if cancellation_history_ratio >= 0.75:
        risk += 1.4
    elif cancellation_history_ratio >= 0.55:
        risk += 0.7

    # Amount outlier risk (but correlated with seats)
    if total_amount >= 22000:
        risk += 0.6
    if total_amount >= 32000:
        risk += 0.8

    # Legit bulk booking reduces risk a bit (overlap)
    if legit_bulk_booking:
        risk -= 0.7

    # Add random noise (imperfect world)
    risk += random.gauss(0, 0.25)

    # Convert latent risk -> probability via a squashed function
    # Tune threshold so global fraud rate ~ FRAUD_RATE_TARGET
    # (This is approximate; we also enforce rate later)
    p = 1 / (1 + pow(2.71828, -(risk - 2.2)))  # shift controls base rate

    label = 1 if random.random() < p else 0

    return [
        seats_count,
        float(total_amount),
        bookings_last_1min,
        bookings_last_10min,
        same_device_flag,
        duplicate_route_flag,
        account_age_days,
        night_booking_flag,
        round(float(cancellation_history_ratio), 3),
        label,
    ]

def generate_dataset(path="fraud_dataset_v2.csv"):
    rows = [generate_row() for _ in range(N_ROWS)]

    # Enforce approximate fraud rate target by flipping a small number if needed
    fraud_count = sum(r[-1] for r in rows)
    current_rate = fraud_count / len(rows)

    # If too high/low, adjust by flipping labels on lowest-risk-ish rows (approx)
    # We'll do a simple fix: randomly flip until closer (keeps dataset realistic enough)
    target = FRAUD_RATE_TARGET
    max_iters = 5000
    it = 0
    while it < max_iters and abs(current_rate - target) > 0.01:
        idx = random.randrange(len(rows))
        if current_rate > target and rows[idx][-1] == 1:
            rows[idx][-1] = 0
        elif current_rate < target and rows[idx][-1] == 0:
            # flip only if row looks somewhat risky
            seats_count = rows[idx][0]
            b1 = rows[idx][2]
            acc_age = rows[idx][6]
            if seats_count >= 6 or b1 >= 2 or acc_age <= 7:
                rows[idx][-1] = 1
        fraud_count = sum(r[-1] for r in rows)
        current_rate = fraud_count / len(rows)
        it += 1

    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "seats_count",
            "total_amount",
            "bookings_last_1min",
            "bookings_last_10min",
            "same_device_flag",
            "duplicate_route_flag",
            "account_age_days",
            "night_booking_flag",
            "cancellation_history_ratio",
            "label"
        ])
        w.writerows(rows)

    print("✅ Generated:", path)
    print("Rows:", len(rows))
    print("Fraud count:", fraud_count)
    print("Fraud rate:", round(current_rate, 4))
    print("Seed:", RANDOM_SEED, "Generated at:", datetime.now().isoformat(timespec="seconds"))

if __name__ == "__main__":
    generate_dataset()