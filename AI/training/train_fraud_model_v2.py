import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.ensemble import RandomForestClassifier

DATA_PATH = "fraud_dataset_v2.csv"
OUT_MODEL_PATH = "../ai_service/models/fraud_model.joblib"

df = pd.read_csv(DATA_PATH)

X = df.drop("label", axis=1)
y = df["label"]

# Stratify is important for imbalanced datasets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# class_weight helps imbalance
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    min_samples_split=6,
    min_samples_leaf=3,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

pred = model.predict(X_test)
proba = model.predict_proba(X_test)[:, 1]

print("\n=== Confusion Matrix ===")
print(confusion_matrix(y_test, pred))

print("\n=== Classification Report ===")
print(classification_report(y_test, pred, digits=4))

try:
    auc = roc_auc_score(y_test, proba)
    print("\n=== ROC-AUC ===")
    print(round(auc, 4))
except Exception as e:
    print("ROC-AUC error:", e)

joblib.dump(model, OUT_MODEL_PATH)
print("\n✅ Model saved to", OUT_MODEL_PATH)

# Optional: feature importance
importances = list(model.feature_importances_)
feat_names = list(X.columns)
pairs = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)
print("\n=== Feature Importance (Top) ===")
for name, imp in pairs[:10]:
    print(f"{name}: {imp:.4f}")