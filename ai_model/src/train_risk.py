"""
train_risk.py
-------------------------------------------------------------------------
NIVARA AI Platform - Model 3: Multi-Factor Explainable Risk Scoring &
CatBoostClassifier for Project Failure/Delay Risk Probability.
-------------------------------------------------------------------------
"""

import os
import json
import logging
import pandas as pd
import numpy as np
from catboost import CatBoostClassifier, Pool
from sklearn.model_selection import GroupKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from src.utils import logger

CATEGORICAL_FEATURES = ["state", "sector", "agency", "progress_trend", "mismatch_status"]
NUMERICAL_FEATURES = [
    "original_cost", "revised_cost", "cumulative_expenditure",
    "physical_progress", "financial_progress", "progress_mismatch_gap",
    "delay_months", "average_monthly_progress_3m", "average_monthly_spending_3m",
    "project_age_months", "planned_duration_months", "progress_slowdown"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def calculate_rule_based_risk(
    physical_progress: float,
    financial_progress: float,
    delay_months: float,
    original_cost: float,
    revised_cost: float,
    avg_monthly_prog: float = 1.0,
    progress_slowdown: bool = False,
    progress_trend: str = "stable",
    predicted_completion_delayed: bool = False,
    expected_cost_overrun_pct: float = 0.0,
    expected_delay_months: float = 0.0
) -> tuple[int, str, list[str]]:
    """
    Computes a transparent, explainable risk score (0 to 100), risk level (LOW/MEDIUM/HIGH/CRITICAL),
    and a list of human-interpretable warning reasons.
    """
    score = 0
    reasons = []

    phys = float(physical_progress or 0.0)
    fin = float(financial_progress or 0.0)
    delay = float(delay_months or 0.0)
    orig_c = float(original_cost or 0.0)
    rev_c = float(revised_cost or orig_c)
    gap = fin - phys

    # 0. 100% Completion Guard
    if phys >= 99.9:
        return 0, "LOW", ["Project execution successfully finalized and completed (100% Physical Progress)."]

    # 0b. Early Intake / Fresh Project Guard (0% progress, 0 delay, 0 cost increase)
    if phys <= 0.0 and delay <= 0.0 and (expected_delay_months <= 0.0 or not predicted_completion_delayed) and ((rev_c - orig_c) <= 0.0):
        return 5, "LOW", ["Project is in initial intake & mobilization stage (On Schedule)."]

    # 1. Schedule Delay & Target Slippage (Up to 45 pts)
    effective_delay = max(delay, float(expected_delay_months or 0.0) if predicted_completion_delayed else delay)
    if effective_delay >= 36.0:
        score += 45
        reasons.append(f"Severe multi-year schedule slippage of {round(effective_delay, 1)} months (+{round(effective_delay * 30.4)} days) past cabinet baseline.")
    elif effective_delay >= 24.0:
        score += 35
        reasons.append(f"Major schedule delay of {round(effective_delay, 1)} months past original target completion.")
    elif effective_delay >= 12.0:
        score += 25
        reasons.append(f"Significant schedule delay of {round(effective_delay, 1)} months recorded.")
    elif effective_delay >= 6.0:
        score += 15
        reasons.append(f"Project is facing {round(effective_delay, 1)} months schedule slippage.")
    elif effective_delay > 0.0:
        score += 10
        reasons.append(f"Moderate project schedule delay of {round(effective_delay, 1)} months.")

    # 2. Cost Escalation & Overrun (Up to 35 pts)
    raw_cost_inc = ((rev_c - orig_c) / orig_c * 100.0) if orig_c > 0 else 0.0
    cost_increase_pct = max(raw_cost_inc, float(expected_cost_overrun_pct or 0.0))

    if cost_increase_pct >= 30.0:
        score += 35
        reasons.append(f"Critical cost overrun: budget exceeds sanction by {round(cost_increase_pct, 1)}% (₹{round(rev_c - orig_c, 2)} Cr).")
    elif cost_increase_pct >= 20.0:
        score += 25
        reasons.append(f"Significant cost escalation: project exceeds sanctioned baseline by {round(cost_increase_pct, 1)}%.")
    elif cost_increase_pct >= 10.0:
        score += 15
        reasons.append(f"Moderate budget escalation of {round(cost_increase_pct, 1)}% recorded.")
    elif cost_increase_pct >= 5.0:
        score += 10
        reasons.append(f"Minor budget revision of {round(cost_increase_pct, 1)}% projected.")

    # 3. Financial vs Physical Mismatch (Up to 25 pts)
    if gap > 25.0:
        score += 25
        reasons.append(f"Financial expenditure ({round(fin, 1)}%) severely leads ground physical execution ({round(phys, 1)}%) by {round(gap, 1)}%.")
    elif gap > 15.0:
        score += 18
        reasons.append(f"Financial progress exceeds physical progress by {round(gap, 1)}% (Warning threshold).")
    elif gap > 8.0:
        score += 10
        reasons.append(f"Minor divergence between financial spend ({round(fin, 1)}%) and physical progress ({round(phys, 1)}%).")

    # 4. Progress Slowdown & Trend (Up to 15 pts)
    if progress_slowdown or progress_trend == "decreasing":
        score += 15
        reasons.append("Recent physical progress velocity is decelerating or trending downward.")
    elif avg_monthly_prog < 0.5 and phys < 90.0:
        score += 10
        reasons.append("Monthly physical progress velocity is critically low relative to project scale.")

    # 5. Stagnation in critical completion phase (Up to 10 pts)
    if phys < 30.0 and delay > 6.0:
        score += 10
        reasons.append("Project execution is stuck in early foundational stages despite elapsed timeline.")
    elif avg_monthly_prog < 0.2 and phys < 95.0:
        score += 5
        reasons.append("Progress stagnation observed over recent monthly reporting cycles.")

    # Map to level with intelligent multi-factor boundary
    if score >= 70 or effective_delay >= 24.0 or cost_increase_pct >= 25.0:
        score = max(score, 75)
        level = "CRITICAL"
    elif score >= 45 or effective_delay >= 12.0 or cost_increase_pct >= 15.0:
        score = max(score, 55)
        level = "HIGH"
    elif score >= 20 or effective_delay >= 3.0 or cost_increase_pct >= 5.0:
        score = max(score, 30)
        level = "MEDIUM"
    else:
        score = min(score, 18)
        level = "LOW"

    # Cap score
    score = min(100, max(0, score))

    if not reasons:
        reasons.append("Project progress and expenditure are within healthy operational parameters.")

    return score, level, reasons

    if not reasons:
        reasons.append("Project progress and expenditure are within healthy operational parameters.")

    return score, level, reasons


def train_risk_model(
    processed_csv_path: str = "data/processed/processed_monthly_data.csv",
    model_output_path: str = "models/risk_model.cbm"
) -> dict:
    """
    Trains CatBoostClassifier on processed project dataset to predict high-risk probability.
    Target definition:
    high_risk = 1 if (delay_months > 6 or progress_mismatch_gap > 20 or cost_increase > 15%), else 0.
    """
    if not os.path.exists(processed_csv_path):
        raise FileNotFoundError(f"Processed dataset not found at {processed_csv_path}")

    df = pd.read_csv(processed_csv_path)

    # Define ground truth high_risk target
    gap = df["financial_progress"] - df["physical_progress"]
    cost_increase = np.where(df["original_cost"] > 0, (df["revised_cost"] - df["original_cost"]) / df["original_cost"], 0.0)

    df["high_risk"] = np.where(
        (df["delay_months"] > 6.0) | (gap > 20.0) | (cost_increase > 0.15) | (df["progress_slowdown"] == 1),
        1, 0
    )

    X = df[ALL_FEATURES].copy()
    for col in CATEGORICAL_FEATURES:
        X[col] = X[col].fillna("Unknown").astype(str)
    for col in NUMERICAL_FEATURES:
        X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0.0)

    y = df["high_risk"].values
    groups = df["project_id"].values

    n_samples = len(df)
    n_projects = df["project_id"].nunique()

    metrics = {
        "model_name": "CatBoost Risk Classifier",
        "sample_count": int(n_samples),
        "unique_projects": int(n_projects),
        "features": ALL_FEATURES,
        "is_trained": False,
        "accuracy": None,
        "precision": None,
        "recall": None,
        "f1_score": None,
        "roc_auc": None,
        "target_distribution": {
            "low_medium_risk_0": int((y == 0).sum()),
            "high_critical_risk_1": int((y == 1).sum())
        }
    }

    n_splits = min(5, n_projects)
    gkf = GroupKFold(n_splits=n_splits)

    all_preds = []
    all_probs = []
    all_trues = []

    for train_idx, val_idx in gkf.split(X, y, groups):
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_val, y_val = X.iloc[val_idx], y[val_idx]

        train_pool = Pool(X_train, y_train, cat_features=CATEGORICAL_FEATURES)
        val_pool = Pool(X_val, y_val, cat_features=CATEGORICAL_FEATURES)

        fold_model = CatBoostClassifier(
            iterations=400,
            learning_rate=0.05,
            depth=5,
            loss_function="Logloss",
            eval_metric="AUC",
            random_seed=42,
            verbose=False
        )
        fold_model.fit(train_pool, eval_set=val_pool, early_stopping_rounds=30, verbose=False)
        probs = fold_model.predict_proba(X_val)[:, 1]
        preds = (probs >= 0.5).astype(int)

        all_preds.extend(preds)
        all_probs.extend(probs)
        all_trues.extend(y_val)

    acc = float(accuracy_score(all_trues, all_preds))
    prec = float(precision_score(all_trues, all_preds, zero_division=0))
    rec = float(recall_score(all_trues, all_preds, zero_division=0))
    f1 = float(f1_score(all_trues, all_preds, zero_division=0))
    auc = float(roc_auc_score(all_trues, all_probs))

    # Train final classifier
    final_pool = Pool(X, y, cat_features=CATEGORICAL_FEATURES)
    final_model = CatBoostClassifier(
        iterations=400,
        learning_rate=0.05,
        depth=5,
        loss_function="Logloss",
        eval_metric="AUC",
        random_seed=42,
        verbose=False
    )
    final_model.fit(final_pool, verbose=False)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    final_model.save_model(model_output_path)
    logger.info(f"Risk model saved to {model_output_path}")

    metrics.update({
        "is_trained": True,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "notes": f"Trained on {n_samples} monthly records across {n_projects} projects with {n_splits}-fold project CV."
    })

    return metrics


if __name__ == "__main__":
    res = train_risk_model()
    print("Risk Training Result:", json.dumps(res, indent=2))
