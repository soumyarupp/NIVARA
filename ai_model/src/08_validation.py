"""
NIVARA Step 8 — Honest validation + leakage check.

1. Uses a project-level train/test split.
2. Confirms no project appears in both train and test.
3. Evaluates CatBoost with all features.
4. Runs an ablation without progress_gap.
"""

import warnings

warnings.filterwarnings("ignore")

import joblib
import pandas as pd
from catboost import CatBoostClassifier
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit


# -----------------------------
# Load data and preprocessing
# -----------------------------

df = pd.read_csv("data/nivara_features.csv")

preprocess = joblib.load("models/preprocess.joblib")

FEATURES = preprocess["features"]
CAT_COLS = preprocess["cat_cols"]
TARGET = "label_3m"


# -----------------------------
# Apply saved categorical maps
# -----------------------------

for col in CAT_COLS:
    df[col] = df[col].map(
        preprocess["cat_maps"][col]
    ).astype(int)


# -----------------------------
# Validation function
# -----------------------------

def run_validation(features, label):

    X = df[features]
    y = df[TARGET]
    groups = df["project_id"]

    # Project-level split
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.25,
        random_state=42,
    )

    train_idx, test_idx = next(
        splitter.split(X, y, groups)
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    train_projects = set(
        groups.iloc[train_idx]
    )

    test_projects = set(
        groups.iloc[test_idx]
    )

    overlap = (
        train_projects & test_projects
    )

    # CatBoost categorical feature positions
    cat_idx = [
        features.index(col)
        for col in CAT_COLS
        if col in features
    ]

    # Train model
    model = CatBoostClassifier(
        iterations=300,
        depth=6,
        learning_rate=0.05,
        verbose=False,
        random_seed=42,
    )

    model.fit(
        X_train,
        y_train,
        cat_features=cat_idx,
    )

    # Predictions
    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_test,
        predictions,
        labels=[0, 1],
    ).ravel()

    print()
    print("=" * 60)
    print(label)
    print("=" * 60)

    print(
        f"Project overlap: {len(overlap)} "
        f"(must be 0)"
    )

    print(
        f"ROC-AUC   : "
        f"{roc_auc_score(y_test, probabilities):.3f}"
    )

    print(
        f"Precision : "
        f"{precision_score(y_test, predictions, zero_division=0):.3f}"
    )

    print(
        f"Recall    : "
        f"{recall_score(y_test, predictions, zero_division=0):.3f}"
    )

    print(
        f"F1        : "
        f"{f1_score(y_test, predictions, zero_division=0):.3f}"
    )

    print(f"False Negatives: {fn}")

    print(
        f"Confusion Matrix: "
        f"TN={tn}, FP={fp}, FN={fn}, TP={tp}"
    )

    if overlap:
        print(
            "\nWARNING: Project leakage detected!"
        )

    else:
        print(
            "\nProject split is clean."
        )


# -----------------------------
# Dataset information
# -----------------------------

print("=" * 60)
print("NIVARA STEP 8 — HONEST VALIDATION")
print("=" * 60)

print(
    f"Rows: {len(df)}"
)

print(
    f"Projects: {df['project_id'].nunique()}"
)

print(
    f"Features: {len(FEATURES)}"
)


# -----------------------------
# Test 1: All features
# -----------------------------

run_validation(
    FEATURES,
    "PROJECT-SPLIT — ALL FEATURES",
)


# -----------------------------
# Test 2: Remove dominant feature
# -----------------------------

features_without_gap = [
    feature
    for feature in FEATURES
    if feature != "progress_gap"
]

run_validation(
    features_without_gap,
    "PROJECT-SPLIT — WITHOUT progress_gap",
)


# -----------------------------
# Finished
# -----------------------------

print()
print("=" * 60)
print("STEP 8 DONE — honest validation complete")
print("=" * 60)
