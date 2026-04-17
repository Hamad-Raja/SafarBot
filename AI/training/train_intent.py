import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path

DATASET = Path(__file__).resolve().parent / "dataset.csv"
OUTDIR = Path(__file__).resolve().parents[1] / "ai_service" / "models"
OUTDIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATASET)
X = df["text"].astype(str)
y = df["intent"].astype(str)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1,2))),
    ("clf", LogisticRegression(max_iter=300))
])

pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)

acc = accuracy_score(y_test, y_pred)
print("Accuracy:", acc)
print("\nReport:\n", classification_report(y_test, y_pred))

joblib.dump(pipe, OUTDIR / "intent_model.joblib")
print(f"Saved model to: {OUTDIR/'intent_model.joblib'}")
