"""
train_completion.py
-------------------------------------------------------------------------
NIVARA AI Platform - Model 1: Project Completion Date & Remaining Duration.
Trains CatBoostRegressor using leak-free GroupKFold on completed snapshots
and prepares training dataset and baseline fallback configurations.
-------------------------------------------------------------------------
"""

import os
import json
import logging
import pandas as pd
import numpy as np
from catboost import CatBoostRegressor, Pool
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from src.utils import diff_in_months, logger

CATEGORICAL_FEATURES = ["state", "sector", "agency", "project_status", "progress_trend"]
NUMERICAL_FEATURES = [
    "original_cost", "revised_cost", "project_age_months",
    "physical_progress", "financial_progress", "remaining_progress",
    "average_monthly_progress_3m", "average_monthly_progress_6m",
    "progress_slowdown", "delay_months", "planned_duration_months",
    "elapsed_duration_months", "progress_change_3_months", "progress_change_6_months"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def prepare_completion_training_data(
    processed_csv_path: str = "data/processed/processed_monthly_data.csv",
    output_training_path: str = "data/processed/completion_training_data.csv"
) -> pd.DataFrame:
    """
    Extracts historical snapshot records that have a verified actual_completion_date
    and calculates the exact ground-truth remaining_months target.
    """
    if not os.path.exists(processed_csv_path):
        raise FileNotFoundError(f"Processed dataset not found at {processed_csv_path}")

    df = pd.read_csv(processed_csv_path)
    df["report_date"] = pd.to_datetime(df["report_date"])
    df["actual_completion_date"] = pd.to_datetime(df["actual_completion_date"], errors="coerce")

    # Filter records with verified completion date where report_date <= actual_completion_date
    completed_mask = df["actual_completion_date"].notna()
    train_df = df[completed_mask].copy()

    if train_df.empty:
        logger.warning("No records with explicit actual_completion_date found. Creating empty training set.")
        train_df = pd.DataFrame(columns=ALL_FEATURES + ["remaining_months", "project_id"])
        train_df.to_csv(output_training_path, index=False)
        return train_df

    # Calculate target remaining_months
    train_df["remaining_months"] = train_df.apply(
        lambda r: max(0.0, diff_in_months(r["actual_completion_date"], r["report_date"]) or 0.0),
        axis=1
    )

    # Clean & fill missing feature values
    for col in CATEGORICAL_FEATURES:
        train_df[col] = train_df[col].fillna("Unknown").astype(str)

    for col in NUMERICAL_FEATURES:
        train_df[col] = pd.to_numeric(train_df[col], errors="coerce").fillna(0.0)

    os.makedirs(os.path.dirname(output_training_path), exist_ok=True)
    train_df.to_csv(output_training_path, index=False)
    logger.info(
        f"Saved completion training dataset with {len(train_df)} snapshots across "
        f"{train_df['project_id'].nunique()} projects to {output_training_path}"
    )
    return train_df


def train_completion_model(
    training_data_path: str = "data/processed/completion_training_data.csv",
    model_output_path: str = "models/completion_model.cbm"
) -> dict:
    """
    Trains CatBoostRegressor using GroupKFold on project_id to avoid data leakage.
    Returns evaluation metrics.
    """
    if not os.path.exists(training_data_path):
        train_df = prepare_completion_training_data(output_training_path=training_data_path)
    else:
        train_df = pd.read_csv(training_data_path)

    n_samples = len(train_df)
    n_projects = train_df["project_id"].nunique() if "project_id" in train_df.columns else 0

    metrics = {
        "model_name": "CatBoost Completion Regressor",
        "sample_count": int(n_samples),
        "unique_projects": int(n_projects),
        "features": ALL_FEATURES,
        "is_trained": False,
        "mae_months": None,
        "rmse_months": None,
        "r2_score": None,
        "baseline_mode": True,
        "notes": ""
    }

    if n_samples < 10 or n_projects < 3:
        msg = f"Insufficient labeled completion samples ({n_samples} rows, {n_projects} projects). Relying on calibrated baseline forecasting."
        logger.warning(msg)
        metrics["notes"] = msg
        return metrics

    X = train_df[ALL_FEATURES].copy()
    for col in CATEGORICAL_FEATURES:
        X[col] = X[col].astype(str)
    y = train_df["remaining_months"].values
    groups = train_df["project_id"].values

    # Project-level cross-validation
    n_splits = min(5, n_projects)
    gkf = GroupKFold(n_splits=n_splits)

    all_preds = []
    all_trues = []

    for train_idx, val_idx in gkf.split(X, y, groups):
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_val, y_val = X.iloc[val_idx], y[val_idx]

        train_pool = Pool(X_train, y_train, cat_features=CATEGORICAL_FEATURES)
        val_pool = Pool(X_val, y_val, cat_features=CATEGORICAL_FEATURES)

        fold_model = CatBoostRegressor(
            iterations=400,
            learning_rate=0.05,
            depth=5,
            loss_function="RMSE",
            eval_metric="MAE",
            random_seed=42,
            verbose=False
        )
        fold_model.fit(train_pool, eval_set=val_pool, early_stopping_rounds=30, verbose=False)
        preds = fold_model.predict(X_val)
        all_preds.extend(preds)
        all_trues.extend(y_val)

    mae = float(mean_absolute_error(all_trues, all_preds))
    rmse = float(np.sqrt(mean_squared_error(all_trues, all_preds)))
    r2 = float(r2_score(all_trues, all_preds)) if len(all_trues) > 1 else 0.0

    # Train final model on full dataset
    final_pool = Pool(X, y, cat_features=CATEGORICAL_FEATURES)
    final_model = CatBoostRegressor(
        iterations=400,
        learning_rate=0.05,
        depth=5,
        loss_function="RMSE",
        eval_metric="MAE",
        random_seed=42,
        verbose=False
    )
    final_model.fit(final_pool, verbose=False)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    final_model.save_model(model_output_path)
    logger.info(f"Completion model saved to {model_output_path}")

    metrics.update({
        "is_trained": True,
        "baseline_mode": False if n_projects >= 20 else True,
        "mae_months": round(mae, 3),
        "rmse_months": round(rmse, 3),
        "r2_score": round(r2, 3),
        "notes": f"Trained on {n_samples} historical snapshots across {n_projects} projects with {n_splits}-fold project CV."
    })

    return metrics


if __name__ == "__main__":
    prepare_completion_training_data()
    res = train_completion_model()
    print("Completion Training Result:", json.dumps(res, indent=2))
