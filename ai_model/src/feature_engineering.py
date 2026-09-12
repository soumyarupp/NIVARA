"""
feature_engineering.py
-------------------------------------------------------------------------
NIVARA AI Platform - Point-in-time Feature Extraction, Progress/Spending
Velocities, Mismatch Gap Classification, and Rolling Trajectory Analysis.
-------------------------------------------------------------------------
"""

import pandas as pd
import numpy as np
import logging
from src.utils import diff_in_months, logger


def compute_mismatch_status(gap: float) -> str:
    """Classifies mismatch gap magnitude neutrally."""
    if pd.isna(gap):
        return "Normal"
    abs_gap = abs(gap)
    if abs_gap <= 10.0:
        return "Normal"
    elif abs_gap <= 20.0:
        return "Monitor"
    elif abs_gap <= 30.0:
        return "Warning"
    else:
        return "High Alert"


def classify_trend(values: list) -> str:
    """Classifies trend of a numerical sequence as increasing, stable, or decreasing."""
    valid_vals = [v for v in values if pd.notna(v)]
    if len(valid_vals) < 2:
        return "stable"
    diff = valid_vals[-1] - valid_vals[0]
    if diff > 0.5:
        return "increasing"
    elif diff < -0.5:
        return "decreasing"
    else:
        return "stable"


def extract_point_in_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes chronological features for every project record strictly using
    past and current monthly snapshots (zero future data leakage).
    """
    logger.info("Extracting chronological point-in-time features per project...")
    df = df.copy()

    # Ensure datetime format and sort chronologically
    df["report_date"] = pd.to_datetime(df["report_date"])
    df["start_date"] = pd.to_datetime(df["start_date"], errors="coerce")
    df["original_completion_date"] = pd.to_datetime(df["original_completion_date"], errors="coerce")
    df["revised_completion_date"] = pd.to_datetime(df["revised_completion_date"], errors="coerce")
    df["actual_completion_date"] = pd.to_datetime(df["actual_completion_date"], errors="coerce")

    df = df.sort_values(by=["project_id", "report_date"]).reset_index(drop=True)

    # 1. Base Progress & Expenditure Lag Calculations per project
    grouped = df.groupby("project_id")

    df["previous_physical_progress"] = grouped["physical_progress"].shift(1)
    df["monthly_progress"] = np.where(
        df["previous_physical_progress"].notna(),
        df["physical_progress"] - df["previous_physical_progress"],
        np.nan
    )
    # Clip negative measurement noise if any
    df["monthly_progress"] = df["monthly_progress"].clip(lower=0.0)

    df["progress_change_1_month"] = df["monthly_progress"]
    df["progress_change_3_months"] = df["physical_progress"] - grouped["physical_progress"].shift(3)
    df["progress_change_6_months"] = df["physical_progress"] - grouped["physical_progress"].shift(6)

    # Rolling average progress
    df["average_monthly_progress_3m"] = grouped["monthly_progress"].transform(
        lambda s: s.rolling(window=3, min_periods=1).mean()
    )
    df["average_monthly_progress_6m"] = grouped["monthly_progress"].transform(
        lambda s: s.rolling(window=6, min_periods=1).mean()
    )

    # Progress Trend & Acceleration
    df["prev_monthly_progress"] = grouped["monthly_progress"].shift(1)
    df["progress_acceleration"] = df["monthly_progress"] - df["prev_monthly_progress"]

    df["progress_trend"] = np.where(
        df["progress_acceleration"] > 0.5, "increasing",
        np.where(df["progress_acceleration"] < -0.5, "decreasing", "stable")
    )

    # Progress Slowdown: current monthly progress is notably less than 3m average
    df["progress_slowdown"] = np.where(
        (df["monthly_progress"].notna()) & 
        (df["average_monthly_progress_3m"].notna()) & 
        (df["monthly_progress"] < 0.65 * df["average_monthly_progress_3m"]) &
        (df["physical_progress"] < 98.0),
        1, 0
    )

    df["remaining_progress"] = (100.0 - df["physical_progress"]).clip(lower=0.0)

    # 2. Expenditure Features
    df["previous_cumulative_expenditure"] = grouped["cumulative_expenditure"].shift(1)
    df["calculated_monthly_expenditure"] = np.where(
        df["previous_cumulative_expenditure"].notna(),
        df["cumulative_expenditure"] - df["previous_cumulative_expenditure"],
        np.nan
    )
    df["calculated_monthly_expenditure"] = df["calculated_monthly_expenditure"].clip(lower=0.0)

    # If monthly_expenditure was not provided, use calculated_monthly_expenditure
    df["monthly_expenditure"] = df["monthly_expenditure"].fillna(df["calculated_monthly_expenditure"])

    df["expenditure_change_1_month"] = df["monthly_expenditure"]
    df["expenditure_change_3_months"] = df["cumulative_expenditure"] - grouped["cumulative_expenditure"].shift(3)

    df["average_monthly_spending_3m"] = grouped["monthly_expenditure"].transform(
        lambda s: s.rolling(window=3, min_periods=1).mean()
    )
    df["average_monthly_spending_6m"] = grouped["monthly_expenditure"].transform(
        lambda s: s.rolling(window=6, min_periods=1).mean()
    )

    df["total_spending_last_3m"] = grouped["monthly_expenditure"].transform(
        lambda s: s.rolling(window=3, min_periods=1).sum()
    )
    df["total_spending_last_6m"] = grouped["monthly_expenditure"].transform(
        lambda s: s.rolling(window=6, min_periods=1).sum()
    )

    # Expenditure growth rate
    prev_spending = grouped["monthly_expenditure"].shift(1)
    safe_prev = np.where(prev_spending > 0, prev_spending, np.nan)
    growth_calc = np.where(
        pd.notna(safe_prev) & df["monthly_expenditure"].notna(),
        (df["monthly_expenditure"] - safe_prev) / np.where(pd.isna(safe_prev), 1.0, safe_prev),
        0.0
    )
    df["expenditure_growth_rate"] = pd.Series(growth_calc, index=df.index).fillna(0.0)

    df["monthly_spending_trend"] = np.where(
        df["monthly_expenditure"] > df["average_monthly_spending_3m"] * 1.1, "increasing",
        np.where(df["monthly_expenditure"] < df["average_monthly_spending_3m"] * 0.9, "decreasing", "stable")
    )

    # 3. Financial and Physical Progress Mismatch
    df["progress_mismatch_gap"] = df["financial_progress"] - df["physical_progress"]
    df["mismatch_status"] = df["progress_mismatch_gap"].apply(compute_mismatch_status)

    # 4. Project Duration & Timing Features
    df["project_age_months"] = df.apply(
        lambda r: max(0.0, diff_in_months(r["report_date"], r["start_date"]) or 0.0) if pd.notna(r["start_date"]) else 0.0,
        axis=1
    )

    df["planned_duration_months"] = df.apply(
        lambda r: max(1.0, diff_in_months(r["original_completion_date"], r["start_date"]) or 12.0)
        if pd.notna(r["start_date"]) and pd.notna(r["original_completion_date"]) else 24.0,
        axis=1
    )

    df["elapsed_duration_months"] = df["project_age_months"]
    df["expected_delay_months"] = df["delay_months"].fillna(0.0)

    df["completion_date_difference_days"] = df.apply(
        lambda r: (r["revised_completion_date"] - r["original_completion_date"]).days
        if pd.notna(r["revised_completion_date"]) and pd.notna(r["original_completion_date"]) else 0,
        axis=1
    )

    df["prev_report_date"] = grouped["report_date"].shift(1)
    df["reporting_gap_days"] = (df["report_date"] - df["prev_report_date"]).dt.days.fillna(30)

    # Progress velocity
    safe_age = np.where(df["project_age_months"] > 0, df["project_age_months"], 1.0)
    df["progress_velocity"] = np.where(
        df["project_age_months"] > 0,
        df["physical_progress"] / safe_age,
        df["average_monthly_progress_3m"].fillna(1.0)
    )

    # Drop temporary calculation columns
    df = df.drop(columns=["prev_monthly_progress", "prev_report_date"], errors="ignore")

    logger.info(f"Feature engineering completed for {len(df)} records.")
    return df


def get_last_3_months(project_id: str, df: pd.DataFrame = None) -> dict:
    """
    Extracts the latest 3 chronological monthly records for a project along with
    summary statistics for rapid dashboard rendering and Node.js ingestion.
    """
    if df is None:
        try:
            df = pd.read_csv("data/processed/processed_monthly_data.csv")
        except Exception:
            return {"project_id": str(project_id), "last_3_months": [], "summary": {}}

    proj_rows = df[df["project_id"].astype(str) == str(project_id)].sort_values(by="report_date")
    if proj_rows.empty:
        return {"project_id": str(project_id), "last_3_months": [], "summary": {}}

    latest_3 = proj_rows.tail(3)

    records = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for _, r in latest_3.iterrows():
        dt = pd.to_datetime(r["report_date"])
        phys_prog = float(r.get("physical_progress", 0.0) or 0.0)
        fin_prog = float(r.get("financial_progress", 0.0) or 0.0)
        gap = float(r.get("progress_mismatch_gap", fin_prog - phys_prog) or 0.0)
        m_prog = float(r.get("monthly_progress", 0.0) or 0.0)
        if pd.isna(m_prog):
            m_prog = 0.0
        c_exp = float(r.get("cumulative_expenditure", 0.0) or 0.0)
        if pd.isna(c_exp):
            c_exp = 0.0
        m_exp = float(r.get("monthly_expenditure", 0.0) or 0.0)
        if pd.isna(m_exp):
            m_exp = 0.0

        # Quick monthly risk status
        m_risk = "Low"
        if gap > 20 or (r.get("progress_slowdown", 0) == 1):
            m_risk = "Medium"
        if gap > 30 or float(r.get("delay_months", 0) or 0) > 12:
            m_risk = "High"

        records.append({
            "month": month_names[dt.month - 1] if 1 <= dt.month <= 12 else str(dt.month),
            "year": int(dt.year),
            "physical_progress": round(phys_prog, 2),
            "monthly_progress": round(m_prog, 2),
            "cumulative_expenditure": round(c_exp, 2),
            "monthly_expenditure": round(m_exp, 2),
            "financial_progress": round(fin_prog, 2),
            "progress_mismatch_gap": round(gap, 2),
            "risk_level": m_risk
        })

    # Compute trajectory summaries
    if len(records) > 1:
        prog_change = records[-1]["physical_progress"] - records[0]["physical_progress"]
    elif len(records) == 1:
        prog_change = records[0]["monthly_progress"]
    else:
        prog_change = 0.0

    tot_spending = sum(rec["monthly_expenditure"] for rec in records)
    avg_prog = sum(rec["monthly_progress"] for rec in records) / max(len(records), 1)
    avg_spend = tot_spending / max(len(records), 1)

    return {
        "project_id": str(project_id),
        "last_3_months": records,
        "summary": {
            "progress_change": round(float(prog_change), 2),
            "total_spending": round(float(tot_spending), 2),
            "average_monthly_progress": round(float(avg_prog), 2),
            "average_monthly_spending": round(float(avg_spend), 2),
            "progress_slowdown": bool(records[-1]["monthly_progress"] < avg_prog * 0.7 if len(records) >= 2 else False),
            "expenditure_trend": classify_trend([rec["monthly_expenditure"] for rec in records])
        }
    }


if __name__ == "__main__":
    df_raw = pd.read_csv("data/processed/processed_monthly_data.csv")
    df_feat = extract_point_in_time_features(df_raw)
    df_feat.to_csv("data/processed/processed_monthly_data.csv", index=False)
    print("Features extracted successfully. Sample shape:", df_feat.shape)
    sample_id = df_feat["project_id"].iloc[0]
    print("Sample Last 3 Months for", sample_id, ":", get_last_3_months(sample_id, df_feat))
