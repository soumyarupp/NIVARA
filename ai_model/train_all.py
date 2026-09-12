"""
train_all.py
-------------------------------------------------------------------------
NIVARA AI Platform - Master Pipeline Orchestrator.
Preprocesses Excel flash reports, engineers features, prepares training
subsets, trains completion/cost/risk/NLP models, evaluates metrics,
and serializes artifacts and model_metadata.json.
-------------------------------------------------------------------------
"""

import os
import json
import logging
from datetime import datetime, timezone
import pandas as pd
from src.utils import logger
from src.data_preprocessing import load_and_preprocess_all
from src.feature_engineering import extract_point_in_time_features
from src.train_completion import prepare_completion_training_data, train_completion_model
from src.train_cost import prepare_cost_training_data, train_cost_model
from src.train_risk import train_risk_model
from src.train_delay_nlp import train_delay_nlp_model


def run_full_pipeline():
    start_time = datetime.now(timezone.utc)
    logger.info("=" * 70)
    logger.info("STARTING NIVARA FULL AI TRAINING & FEATURE PIPELINE")
    logger.info("=" * 70)

    # 1. Data Ingestion & Preprocessing
    logger.info("\n--- STEP 1: PREPROCESSING DATABASE & FLASH REPORT DATA ---")
    processed_csv_path = "data/processed/processed_monthly_data.csv"
    if os.path.exists(processed_csv_path) and os.path.getsize(processed_csv_path) > 1000:
        logger.info(f"Loading existing database-exported dataset from {processed_csv_path}...")
        processed_df = pd.read_csv(processed_csv_path)
    else:
        processed_df = load_and_preprocess_all(
            data_dir="data/raw",
            output_path=processed_csv_path
        )

    # 2. Chronological Feature Engineering
    logger.info("\n--- STEP 2: CHRONOLOGICAL POINT-IN-TIME FEATURE ENGINEERING ---")
    featured_df = extract_point_in_time_features(processed_df)
    featured_df.to_csv("data/processed/processed_monthly_data.csv", index=False)
    logger.info(f"Updated processed dataset with {featured_df.shape[1]} features.")

    # 3. Model 1: Completion Date Prediction
    logger.info("\n--- STEP 3: TRAINING COMPLETION REGRESSION MODEL ---")
    comp_train_df = prepare_completion_training_data(
        processed_csv_path="data/processed/processed_monthly_data.csv",
        output_training_path="data/processed/completion_training_data.csv"
    )
    comp_metrics = train_completion_model(
        training_data_path="data/processed/completion_training_data.csv",
        model_output_path="models/completion_model.cbm"
    )

    # 4. Model 2: Expected Final Expenditure
    logger.info("\n--- STEP 4: TRAINING FINAL EXPENDITURE REGRESSION MODEL ---")
    cost_train_df = prepare_cost_training_data(
        processed_csv_path="data/processed/processed_monthly_data.csv",
        output_training_path="data/processed/cost_training_data.csv"
    )
    cost_metrics = train_cost_model(
        training_data_path="data/processed/cost_training_data.csv",
        model_output_path="models/cost_model.cbm"
    )

    # 5. Model 3: Project Risk Classifier
    logger.info("\n--- STEP 5: TRAINING PROJECT RISK CLASSIFIER ---")
    risk_metrics = train_risk_model(
        processed_csv_path="data/processed/processed_monthly_data.csv",
        model_output_path="models/risk_model.cbm"
    )

    # 6. Model 4: NLP Delay Bottleneck Classifier
    logger.info("\n--- STEP 6: TRAINING DELAY REASON NLP CLASSIFIER ---")
    nlp_metrics = train_delay_nlp_model(
        vectorizer_output_path="models/delay_vectorizer.joblib",
        model_output_path="models/delay_classifier.joblib"
    )

    end_time = datetime.now(timezone.utc)
    duration_secs = (end_time - start_time).total_seconds()

    # 7. Model Metadata Compilation
    metadata = {
        "platform": "NIVARA Infrastructure Monitoring AI",
        "version": "2.0.0",
        "pipeline_timestamp": end_time.isoformat(),
        "pipeline_duration_seconds": round(duration_secs, 2),
        "dataset_summary": {
            "total_monthly_snapshots": len(featured_df),
            "unique_projects": int(featured_df["project_id"].nunique()),
            "date_range": [
                str(featured_df["report_date"].min().date() if hasattr(featured_df["report_date"].min(), "date") else featured_df["report_date"].min()),
                str(featured_df["report_date"].max().date() if hasattr(featured_df["report_date"].max(), "date") else featured_df["report_date"].max())
            ],
            "completed_project_snapshots": len(comp_train_df),
            "cost_training_snapshots": len(cost_train_df)
        },
        "models": {
            "completion_model": comp_metrics,
            "cost_model": cost_metrics,
            "risk_model": risk_metrics,
            "nlp_delay_classifier": nlp_metrics
        },
        "system_limitations": {
            "historical_depth": "7 monthly reporting cycles (January 2026 - July 2026)",
            "fallback_mechanism": "Calibrated burn-rate baseline formulas are blended with CatBoost inference when project historical depth is limited.",
            "data_leakage_prevention": "All evaluations use project-level GroupKFold partitioning."
        }
    }

    os.makedirs("models", exist_ok=True)
    with open("models/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info("=" * 70)
    logger.info("NIVARA AI PIPELINE COMPLETE")
    logger.info(f"Metadata written to models/model_metadata.json in {round(duration_secs, 2)}s")
    logger.info("=" * 70)

    print("\nSUMMARY METRICS:")
    print(json.dumps(metadata["dataset_summary"], indent=2))
    print("\nMODELS STATUS:")
    for m_key, m_val in metadata["models"].items():
        print(f"- {m_key}: trained={m_val.get('is_trained')}, baseline_mode={m_val.get('baseline_mode', False)}")


if __name__ == "__main__":
    run_full_pipeline()
