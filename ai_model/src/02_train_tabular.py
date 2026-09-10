"""
NIVARA — Step 2: train every tabular model, compare them, explain the winner.

Run:  python src/02_train_tabular.py

Models trained here:
  * Risk (delay) classification .... CatBoost, LightGBM, XGBoost  -> pick the best
  * Cost overrun prediction ......... XGBoost Regressor
  * Anomaly detection ............... Isolation Forest
  * Similar-project retrieval ....... KNN (NearestNeighbors)
  * Explainability .................. SHAP on the winning risk model

A few beginner definitions:
  - train/validation/test split: we teach the model on older months (train),
    tune choices on a middle slice (validation) and finally judge it on the
    newest months it has never seen (test). We split by TIME, not randomly,
    so we don't accidentally let the model peek at the future.
  - ROC-AUC: 0.5 = coin flip, 1.0 = perfect ranking of risky vs safe.
  - recall on the "delayed" class: of all projects that truly slip, what share
    did we catch. For risk warnings, missing a real delay (a false negative) is
    the costly mistake, so we watch recall and false negatives closely.

DONE looks like: a metrics table prints, "BEST risk model = ...", the cost /
anomaly / KNN sections print, and files appear under models/.
"""

import warnings
warnings.filterwarnings("ignore")

import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.metrics import (roc_auc_score, precision_score, recall_score,
                             f1_score, confusion_matrix,
                             mean_absolute_error, mean_squared_error, r2_score)
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier, XGBRegressor
import shap

ROOT   = Path(__file__).resolve().parents[1]
DATA   = ROOT / "data" / "nivara_features.csv"
MODELS = ROOT / "models"; MODELS.mkdir(exist_ok=True)

TARGET = "label_3m"          # predict a delay 3 months ahead (swap to 6m / 12m if you like)
CAT_COLS = ["sector", "state"]
NUM_COLS = ["contractor_rating", "sanctioned_cost", "expenditure",
            "physical_pct", "planned_pct", "milestones_total", "milestones_delayed",
            "progress_gap", "expenditure_ratio", "milestone_delay_ratio",
            "progress_velocity", "expenditure_velocity", "cost_growth", "delay_count"]
FEATURES = CAT_COLS + NUM_COLS


def time_split(df):
    """Older months -> train, middle -> validation, newest -> test."""
    months = np.sort(df["month_index"].unique())
    lo, hi = np.quantile(months, [0.60, 0.80])
    train = df[df["month_index"] <= lo]
    val   = df[(df["month_index"] > lo) & (df["month_index"] <= hi)]
    test  = df[df["month_index"] > hi]
    return train, val, test


def encode(df):
    """Turn sector/state text into integer codes (models need numbers)."""
    df = df.copy()
    maps = {}
    for c in CAT_COLS:
        cats = sorted(df[c].astype(str).unique())
        maps[c] = {v: i for i, v in enumerate(cats)}
        df[c] = df[c].astype(str).map(maps[c]).astype(int)
    return df, maps


def evaluate(name, model, X, y):
    """Compute the metrics we care about, return a dict + print a line."""
    proba = model.predict_proba(X)[:, 1]
    pred  = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    row = dict(
        model=name,
        roc_auc=round(roc_auc_score(y, proba), 4),
        precision=round(precision_score(y, pred, zero_division=0), 4),
        recall=round(recall_score(y, pred, zero_division=0), 4),
        f1=round(f1_score(y, pred, zero_division=0), 4),
        false_negatives=int(fn), true_positives=int(tp),
    )
    print(f"  {name:10s}  AUC={row['roc_auc']:.3f}  P={row['precision']:.3f}  "
          f"R={row['recall']:.3f}  F1={row['f1']:.3f}  FN={fn}")
    return row


def main():
    df = pd.read_csv(DATA)
    df, cat_maps = encode(df)
    train, val, test = time_split(df)
    print(f"Rows  train={len(train)}  val={len(val)}  test={len(test)}")
    print(f"Predicting: {TARGET}\n")

    Xtr, ytr = train[FEATURES], train[TARGET]
    Xva, yva = val[FEATURES],   val[TARGET]
    Xte, yte = test[FEATURES],  test[TARGET]
    cat_idx = [FEATURES.index(c) for c in CAT_COLS]     # for CatBoost

    # ---------- 1) Three risk classifiers ----------
    print("Training risk classifiers (test-set metrics):")
    models = {}

    cb = CatBoostClassifier(iterations=300, depth=6, learning_rate=0.05,
                            loss_function="Logloss", verbose=False, random_seed=42)
    cb.fit(Xtr, ytr, cat_features=cat_idx, eval_set=(Xva, yva))
    models["CatBoost"] = cb

    lgbm = LGBMClassifier(n_estimators=400, learning_rate=0.05, num_leaves=31,
                          random_state=42, verbose=-1)
    lgbm.fit(Xtr, ytr)
    models["LightGBM"] = lgbm

    xgb = XGBClassifier(n_estimators=400, learning_rate=0.05, max_depth=5,
                        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
                        random_state=42)
    xgb.fit(Xtr, ytr)
    models["XGBoost"] = xgb

    results = [evaluate(n, m, Xte, yte) for n, m in models.items()]
    results_df = pd.DataFrame(results).sort_values("roc_auc", ascending=False)

    best_name = results_df.iloc[0]["model"]
    best_model = models[best_name]
    print(f"\nBEST risk model = {best_name} (highest ROC-AUC)\n")

    joblib.dump(best_model, MODELS / "risk_best.joblib")
    for n, m in models.items():
        joblib.dump(m, MODELS / f"risk_{n.lower()}.joblib")
    results_df.to_csv(MODELS / "risk_comparison.csv", index=False)

    # ---------- 2) SHAP on the winner ----------
    # SHAP explains which features pushed each prediction up or down.
    print("Computing SHAP feature importance on the winning model ...")
    explainer = shap.TreeExplainer(best_model)
    shap_vals = explainer.shap_values(Xte)
    if isinstance(shap_vals, list):            # some libs return [class0, class1]
        shap_vals = shap_vals[1]
    mean_abs = np.abs(shap_vals).mean(axis=0)
    imp = (pd.DataFrame({"feature": FEATURES, "mean_abs_shap": mean_abs})
           .sort_values("mean_abs_shap", ascending=False))
    imp.to_csv(MODELS / "shap_importance.csv", index=False)
    print("  Top drivers of delay risk (by mean |SHAP|):")
    for _, r in imp.head(6).iterrows():
        print(f"    {r['feature']:22s} {r['mean_abs_shap']:.4f}")
    print()

    # ---------- 3) Cost overrun regressor ----------
    print("Training cost-overrun regressor (XGBoost) ...")
    cost_target = "cost_overrun_ratio"
    cr = XGBRegressor(n_estimators=400, learning_rate=0.05, max_depth=5,
                      subsample=0.9, colsample_bytree=0.9, random_state=42)
    cr.fit(Xtr, train[cost_target])
    cpred = cr.predict(Xte)
    rmse = float(np.sqrt(mean_squared_error(test[cost_target], cpred)))
    print(f"  MAE={mean_absolute_error(test[cost_target], cpred):.4f}  "
          f"RMSE={rmse:.4f}  R2={r2_score(test[cost_target], cpred):.4f}")
    joblib.dump(cr, MODELS / "cost_regressor.joblib")
    print()

    # ---------- 4) Isolation Forest (anomaly detection) ----------
    # Anomaly detection is unsupervised and NOT a forecast, so we learn what
    # "normal" looks like across ALL project-months (fitting on only early months
    # would wrongly flag every later month as unusual).
    print("Training Isolation Forest (unusual project-months) ...")
    scaler = StandardScaler().fit(df[NUM_COLS])
    iso = IsolationForest(n_estimators=300, contamination=0.05, random_state=42)
    iso.fit(scaler.transform(df[NUM_COLS]))
    flags = iso.predict(scaler.transform(df[NUM_COLS]))       # -1 = anomaly
    print(f"  Flagged {int((flags == -1).sum())} / {len(flags)} rows as anomalous "
          f"({(flags == -1).mean():.1%})")
    joblib.dump({"scaler": scaler, "model": iso}, MODELS / "anomaly_iforest.joblib")
    print()

    # ---------- 5) KNN similar-project retrieval ----------
    print("Building KNN similar-project index ...")
    knn_scaler = StandardScaler().fit(df[NUM_COLS])
    knn = NearestNeighbors(n_neighbors=25, metric="euclidean")
    knn.fit(knn_scaler.transform(df[NUM_COLS]))
    # demo: find OTHER projects most similar to the first test row
    q_pid = test.iloc[0]["project_id"]
    q = knn_scaler.transform(test[NUM_COLS].iloc[[0]])
    dist, idx = knn.kneighbors(q)
    neighbours = [pid for pid in df.iloc[idx[0]]["project_id"].tolist()
                  if pid != q_pid]
    neighbours = list(dict.fromkeys(neighbours))[:5]      # unique, keep order
    print(f"  Example: projects most similar to {q_pid} -> {neighbours}")
    joblib.dump({"scaler": knn_scaler, "model": knn,
                 "index_project_ids": df["project_id"].values},
                MODELS / "similarity_knn.joblib")
    joblib.dump({"cat_maps": cat_maps, "features": FEATURES,
                 "num_cols": NUM_COLS, "cat_cols": CAT_COLS},
                MODELS / "preprocess.joblib")
    print()

    # ---------- 6) Optional: log to MLflow if it's installed ----------
    try:
        import mlflow
        mlflow.set_experiment("nivara")
        with mlflow.start_run(run_name=f"risk_{best_name}"):
            best_row = results_df.iloc[0].to_dict()
            mlflow.log_params({"target": TARGET, "best_model": best_name})
            mlflow.log_metrics({k: float(v) for k, v in best_row.items()
                                if k != "model"})
            mlflow.log_artifact(str(MODELS / "risk_comparison.csv"))
            mlflow.log_artifact(str(MODELS / "shap_importance.csv"))
        print("Logged run to MLflow (see the 'nivara' experiment).")
    except Exception as e:
        print(f"MLflow not logged ({type(e).__name__}) — skipping, models still saved.")

    print("\nSTEP 2 DONE — all tabular models trained and saved to models/")


if __name__ == "__main__":
    main()

