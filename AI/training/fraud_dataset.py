import random
import csv

def generate_row():
    seats = random.randint(1, 10)
    amount = seats * random.randint(2000, 4000)
    bookings_1min = random.randint(0, 4)
    bookings_10min = random.randint(0, 6)
    same_device = random.choice([0, 1])
    duplicate_route = random.choice([0, 1])
    account_age = random.randint(0, 365)
    night_flag = random.choice([0, 1])
    cancel_ratio = round(random.uniform(0, 1), 2)

    fraud_score = 0

    if seats >= 8:
        fraud_score += 2
    if bookings_1min >= 3:
        fraud_score += 2
    if same_device == 1:
        fraud_score += 1
    if account_age < 5:
        fraud_score += 1
    if cancel_ratio > 0.7:
        fraud_score += 2

    label = 1 if fraud_score >= 3 else 0

    return [
        seats, amount, bookings_1min, bookings_10min,
        same_device, duplicate_route,
        account_age, night_flag, cancel_ratio,
        label
    ]

with open("fraud_dataset.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
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

    for _ in range(1000):
        writer.writerow(generate_row())

print("✅ Dataset generated: fraud_dataset.csv")