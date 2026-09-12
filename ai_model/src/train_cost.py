"""
train_cost.py
-------------------------------------------------------------------------
NIVARA AI Platform - Model 2: Expected Final Expenditure & Cost Overrun.
Trains CatBoostRegressor on historical completed project cost baselines
and provides baseline extrapolation logic.
-------------------------------------------------------------------------
"""

import os
import json
import logging
import pandas as pd
import numpy as np
from catboost import CatBoostRegressor, Pool
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error, mean_squared_error
from src.utils import logger

CATEGORICAL_FEATURES = ["state", "sector", "agency", "monthly_spending_trend"]
NUMERICAL_FEATURES = [
    "original_cost", "revised_cost", "cumulative_expenditure",
    "physical_progress", "financial_progress", "remaining_progress",
    "average_monthly_spending_3m", "average_monthly_spending_6m",
    "project_age_months", "delay_months", "expected_delay_months",
    "progress_mismatch_gap"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def prepare_cost_training_data(
    processed_csv_path: str = "data/processed/processed_monthly_data.csv",
    output_training_path: str = "data/processed/cost_training_data.csv"
) -> pd.DataFrame:
    """
    Builds cost training data from projects that have reached completion
    (actual_final_expenditure, actual_completion_date, or physical_progress >= 99.9).
    """
    if not os.path.exists(processed_csv_path):
        raise FileNotFoundError(f"Processed dataset not found at {processed_csv_path}")

    df = pd.read_csv(processed_csv_path)

    # Completed projects identifier
    completed_mask = (
        (df["actual_final_expenditure"].notna() & (df["actual_final_expenditure"] > 0)) |
        df["actual_completion_date"].notna() |
        (df["physical_progress"] >= 99.9) |
        (df["project_status"].str.lower().isin(["completed", "complete"]))
    )

    # Use final snapshot of completed projects as ground truth
    completed_projects = df[completed_mask]["project_id"].unique()
    snapshots = df[df["project_id"].isin(completed_projects)].copy()

    if snapshots.empty:
        logger.warning("No completed project records found for cost model training.")
        train_df = pd.DataFrame(columns=ALL_FEATURES + ["final_expenditure_target", "project_id"])
        train_df.to_csv(output_training_path, index=False)
        return train_df

    # Ground truth final expenditure per project
    final_costs = {}
    for pid, group in snapshots.groupby("project_id"):
        explicit_final = group["actual_final_expenditure"].dropna()
        if not explicit_final.empty and explicit_final.iloc[-1] > 0:
            final_costs[pid] = float(explicit_final.iloc[-1])
        else:
            final_costs[pid] = float(group["cumulative_expenditure"].max())

    snapshots["final_expenditure_target"] = snapshots["project_id"].map(final_costs)

    # Filter out records where target is 0 or invalid
    train_df = snapshots[snapshots["final_expenditure_target"] > 0].copy()

    for col in CATEGORICAL_FEATURES:
        train_df[col] = train_df[col].fillna("Unknown").astype(str)

    for col in NUMERICAL_FEATURES:
        train_df[col] = pd.to_numeric(train_df[col], errors="coerce").fillna(0.0)

    os.makedirs(os.path.dirname(output_training_path), exist_ok=True)
    train_df.to_csv(output_training_path, index=False)
    logger.info(
        f"Saved cost training dataset with {len(train_df)} snapshots across "
        f"{train_df['project_id'].nunique()} completed projects to {output_training_path}"
    )
    return train_df


def train_cost_model(
    training_data_path: str = "data/processed/cost_training_data.csv",
    model_output_path: str = "models/cost_model.cbm"
) -> dict:
    """
    Trains CatBoostRegressor to predict final project expenditure in ₹ Crore.
    """
    if not os.path.exists(training_data_path):
        train_df = prepare_cost_training_data(output_training_path=training_data_path)
    else:
        train_df = pd.read_csv(training_data_path)

    n_samples = len(train_df)
    n_projects = train_df["project_id"].nunique() if "project_id" in train_df.columns else 0

    metrics = {
        "model_name": "CatBoost Cost Regressor",
        "sample_count": int(n_samples),
        "unique_projects": int(n_projects),
        "features": ALL_FEATURES,
        "is_trained": False,
        "mae_crore": None,
        "rmse_crore": None,
        "mape_pct": None,
        "baseline_mode": True,
        "notes": ""
    }

    if n_samples < 10 or n_projects < 3:
        msg = f"Insufficient labeled cost samples ({n_samples} rows, {n_projects} projects). Relying on calibrated baseline forecasting."
        logger.warning(msg)
        metrics["notes"] = msg
        return metrics

    X = train_df[ALL_FEATURES].copy()
    for col in CATEGORICAL_FEATURES:
        X[col] = X[col].astype(str)
    y = train_df["final_expenditure_target"].values
    groups = train_df["project_id"].values

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
            iterations=500,
            learning_rate=0.04,
            depth=6,
            loss_function="RMSE",
            eval_metric="MAE",
            random_seed=42,
            verbose=False
        )
        fold_model.fit(train_pool, eval_set=val_pool, early_stopping_rounds=40, verbose=False)
        preds = fold_model.predict(X_val)
        all_preds.extend(preds)
        all_trues.extend(y_val)

    mae = float(mean_absolute_error(all_trues, all_preds))
    rmse = float(np.sqrt(mean_squared_error(all_trues, all_preds)))

    # Compute safe MAPE
    non_zero = [t for t, p in zip(all_trues, all_preds) if t > 0.01]
    non_zero_preds = [p for t, p in zip(all_trues, all_preds) if t > 0.01]
    if non_zero:
        mape = float(np.mean(np.abs((np.array(non_zero) - np.array(non_zero_preds)) / np.array(non_zero))) * 100.0)
    else:
        mape = 0.0

    # Train final model
    final_pool = Pool(X, y, cat_features=CATEGORICAL_FEATURES)
    final_model = CatBoostRegressor(
        iterations=500,
        learning_rate=0.04,
        depth=6,
        loss_function="RMSE",
        eval_metric="MAE",
        random_seed=42,
        verbose=False
    )
    final_model.fit(final_pool, verbose=False)

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    final_model.save_model(model_output_path)
    logger.info(f"Cost model saved to {model_output_path}")

    metrics.update({
        "is_trained": True,
        "baseline_mode": False if n_projects >= 20 else True,
        "mae_crore": round(mae, 2),
        "rmse_crore": round(rmse, 2),
        "mape_pct": round(mape, 2),
        "notes": f"Trained on {n_samples} historical snapshots across {n_projects} projects with {n_splits}-fold project CV."
    })

    return metrics


if __name__ == "__main__":
    prepare_cost_training_data()
    res = train_cost_model()
    print("Cost Training Result:", json.dumps(res, indent=2))
