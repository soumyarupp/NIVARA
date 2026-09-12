"""
data_preprocessing.py
-------------------------------------------------------------------------
NIVARA AI Platform - Robust Excel Data Loading, Column Normalization,
Cleaning, Unit Standardization, and Anomaly Logging.
-------------------------------------------------------------------------
"""

import os
import re
import glob
import logging
import pandas as pd
import numpy as np
from src.utils import parse_numeric, parse_date_safe, diff_in_months, logger

# Priority-Ordered Column Mappings
COLUMN_CANDIDATES = {
    "project_id": [
        "project code", "project_code", "project id", "project_id",
        "projectcode", "projectid", "pmgid", "legacy ocms code"
    ],
    "project_name": [
        "project name", "project_name", "projectname", "name of project"
    ],
    "state": [
        "state", "state/ut", "location", "states"
    ],
    "sector": [
        "sector", "infrastructure sector", "category"
    ],
    "agency": [
        "agency", "implementing agency", "implementation agency",
        "ministry / department", "ministry/department", "ministry", "department"
    ],
    "project_status": [
        "project status", "status", "report type", "current status"
    ],
    "start_date": [
        "start date", "start_date", "revised start date",
        "date of approval (start date)", "approval date", "date of approval"
    ],
    "original_completion_date": [
        "original/target doc", "original doc", "original completion date",
        "original_completion_date", "target doc", "scheduled completion date"
    ],
    "revised_completion_date": [
        "revised doc", "revised_completion_date", "revised completion date",
        "anticipated doc", "revised target date"
    ],
    "actual_completion_date": [
        "actual date of completion", "actual completion date",
        "actual_completion_date", "completed date", "completion date"
    ],
    "report_date": [
        "month & year", "month-year", "month_year", "report date", "report_date"
    ],
    "original_cost": [
        "original cost (rs. crore)", "original cost (rs crore)",
        "original cost", "original_cost", "sanctioned cost"
    ],
    "revised_cost": [
        "revised cost (rs. crore)", "revised cost (rs crore)",
        "revised cost", "revised_cost", "anticipated cost"
    ],
    "cumulative_expenditure": [
        "cumulative expenditure (rs. crore)", "cumulative expenditure (rs crore)",
        "cumulative expenditure", "cumulative_expenditure", "expenditure (rs. crore)", "expenditure"
    ],
    "monthly_expenditure": [
        "monthly expenditure", "monthly_expenditure", "expenditure during month",
        "monthly spending (rs. crore)", "monthly spending"
    ],
    "actual_final_expenditure": [
        "actual final expenditure", "actual_final_expenditure", "final cost",
        "actual completion cost", "completed cost (rs. crore)"
    ],
    "physical_progress": [
        "physical progress (%)", "physical progress", "physical_progress",
        "progress (%)", "physical progress pct"
    ],
    "financial_progress": [
        "financial progress (%)", "financial progress", "financial_progress",
        "financial progress pct"
    ],
    "delay_months": [
        "delay months", "delay_months", "schedule delay (months)", "delay (months)"
    ],
    "delay_reason": [
        "delay reason", "delay_reason", "reasons for delay", "remarks",
        "major constraints", "bottlenecks", "cause of delay"
    ]
}


def find_best_matching_column(df_columns, candidate_aliases):
    """Finds the best matching column name in df_columns given candidate aliases in order."""
    cleaned_df_cols = {re.sub(r"\s+", " ", str(c).strip().lower().replace("_", " ")): c for c in df_columns}
    for alias in candidate_aliases:
        alias_cleaned = re.sub(r"\s+", " ", alias.lower())
        if alias_cleaned in cleaned_df_cols:
            return cleaned_df_cols[alias_cleaned]
    # Try partial starts_with
    for alias in candidate_aliases:
        alias_cleaned = re.sub(r"\s+", " ", alias.lower())
        for cleaned_col, original_col in cleaned_df_cols.items():
            if cleaned_col.startswith(alias_cleaned):
                return original_col
    return None


def extract_project_id_and_agency_from_text(row):
    """
    Extracts embedded project code or agency name from Project Name string when missing.
    e.g., 'Construction of NTB ... at Kadapa Airport (Airport Authority of India [AAI]) (612786)'
    """
    p_id = row.get("project_id")
    p_name = str(row.get("project_name", "") or "")
    agency = row.get("agency")

    # If project_id is null/nan
    if pd.isna(p_id) or str(p_id).strip() in ("", "nan", "None", "-", "0", "0.0"):
        # Match 6-digit or 7-digit numbers at end or in parentheses
        m = re.findall(r"\b(\d{5,8})\b", p_name)
        if m:
            p_id = m[-1]
        else:
            # Fallback deterministic pseudo ID based on project name
            if p_name.strip():
                clean_name = re.sub(r"[^\w\s]", "", p_name).strip().upper()
                p_id = f"PRJ_{abs(hash(clean_name)) % 1000000:06d}"
            else:
                p_id = "UNKNOWN_PRJ"

    # If agency is null/nan
    if pd.isna(agency) or str(agency).strip() in ("", "nan", "None", "-"):
        # Look for [AAI], [NHAI], [NTPC], etc. or (Agency Name)
        m_bracket = re.search(r"\[([^\]]+)\]", p_name)
        if m_bracket:
            agency = m_bracket.group(1).strip()
        else:
            m_paren = re.search(r"\(([^)]+)\)", p_name)
            if m_paren:
                candidate = m_paren.group(1).strip()
                if not candidate.isdigit() and len(candidate) > 2:
                    agency = candidate

    clean_id = str(p_id).split(".")[0].strip()
    return pd.Series([clean_id, str(agency) if pd.notna(agency) else "Unknown Agency"])


def extract_report_date_from_file_or_row(row, raw_df, row_idx, filename=""):
    """
    Derives standard report_date (YYYY-MM-01) from row data or Excel filename.
    """
    # 1. Try explicit report_date in row
    rep_val = row.get("report_date")
    if pd.notna(rep_val):
        parsed = parse_date_safe(rep_val)
        if parsed is not None:
            return pd.Timestamp(year=parsed.year, month=parsed.month, day=1)

    # 2. Try Month and Year separate columns from raw df
    for m_col in ["Month", "month", "Month & Year", "Month-Year"]:
        if m_col in raw_df.columns:
            m_val = raw_df.at[row_idx, m_col]
            if pd.notna(m_val):
                parsed = parse_date_safe(str(m_val))
                if parsed is not None:
                    return pd.Timestamp(year=parsed.year, month=parsed.month, day=1)

    # 3. Fallback to filename parsing
    fn_clean = os.path.basename(filename).replace("_", " ")
    parsed_fn = parse_date_safe(fn_clean)
    if parsed_fn is not None:
        return pd.Timestamp(year=parsed_fn.year, month=parsed_fn.month, day=1)

    return pd.Timestamp("2026-01-01")


def preprocess_excel_file(file_path: str) -> pd.DataFrame:
    """
    Reads a single Flash Report Excel file, normalizes columns, cleans formats,
    and returns a standardized DataFrame.
    """
    logger.info(f"Reading and cleaning file: {file_path}")
    try:
        raw_df = pd.read_excel(file_path)
    except Exception as e:
        logger.error(f"Failed to read Excel {file_path}: {e}")
        return pd.DataFrame()

    # Drop completely empty rows and columns
    raw_df = raw_df.dropna(how="all").dropna(axis=1, how="all").reset_index(drop=True)
    if raw_df.empty:
        return pd.DataFrame()

    # Map columns accurately using priority lookup
    mapped_data = {}
    for standard_col, candidates in COLUMN_CANDIDATES.items():
        matched_col = find_best_matching_column(raw_df.columns, candidates)
        if matched_col is not None:
            mapped_data[standard_col] = raw_df[matched_col].copy()
        else:
            mapped_data[standard_col] = pd.Series([np.nan] * len(raw_df))

    df = pd.DataFrame(mapped_data)

    # Clean project_name
    df["project_name"] = df["project_name"].fillna("Unnamed Project").astype(str).str.strip()

    # Extract ID & Agency if missing
    extracted = df.apply(extract_project_id_and_agency_from_text, axis=1)
    df["project_id"] = extracted[0]
    df["agency"] = extracted[1]

    # Report Date extraction
    report_dates = [
        extract_report_date_from_file_or_row(df.iloc[i], raw_df, i, file_path)
        for i in range(len(df))
    ]
    df["report_date"] = report_dates

    # Clean numeric fields
    numeric_cols = [
        "original_cost", "revised_cost", "cumulative_expenditure",
        "monthly_expenditure", "physical_progress", "financial_progress",
        "delay_months", "actual_final_expenditure"
    ]
    for ncol in numeric_cols:
        df[ncol] = df[ncol].apply(parse_numeric)

    # Clean date fields
    date_cols = ["start_date", "original_completion_date", "revised_completion_date", "actual_completion_date"]
    for dcol in date_cols:
        df[dcol] = df[dcol].apply(parse_date_safe)

    # Fill & bound costs & expenditure
    df["original_cost"] = df["original_cost"].fillna(0.0)
    df["revised_cost"] = df["revised_cost"].fillna(df["original_cost"])
    df["revised_cost"] = np.where(df["revised_cost"] <= 0, df["original_cost"], df["revised_cost"])
    df["cumulative_expenditure"] = df["cumulative_expenditure"].fillna(0.0)

    # Bound physical progress to [0, 100]
    df["physical_progress"] = df["physical_progress"].clip(lower=0.0, upper=100.0)

    # Compute financial progress if missing
    calc_fin_prog = np.where(
        df["revised_cost"] > 0,
        (df["cumulative_expenditure"] / df["revised_cost"]) * 100.0,
        0.0
    )
    df["financial_progress"] = df["financial_progress"].fillna(pd.Series(calc_fin_prog, index=df.index)).clip(lower=0.0, upper=100.0)

    # Clean string fields
    df["state"] = df["state"].fillna("National").astype(str).str.strip()
    df["sector"] = df["sector"].fillna("Infrastructure").astype(str).str.strip()
    df["agency"] = df["agency"].fillna("Implementation Agency").astype(str).str.strip()
    df["project_status"] = df["project_status"].fillna("Ongoing").astype(str).str.strip()
    df["delay_reason"] = df["delay_reason"].fillna("").astype(str).str.strip()

    # Calculate delay months from dates if missing
    calc_delay = df.apply(
        lambda r: max(0.0, diff_in_months(r["revised_completion_date"], r["original_completion_date"]) or 0.0),
        axis=1
    )
    df["delay_months"] = df["delay_months"].fillna(calc_delay).clip(lower=0.0)

    # If actual completion date exists and physical progress is null/low, mark physical_progress = 100.0
    completed_mask = df["actual_completion_date"].notna() | (df["project_status"].str.lower().isin(["completed", "complete"]))
    df.loc[completed_mask & df["physical_progress"].isna(), "physical_progress"] = 100.0

    standard_columns = [
        "project_id", "project_name", "state", "sector", "agency", "project_status",
        "start_date", "original_completion_date", "revised_completion_date",
        "original_cost", "revised_cost", "physical_progress", "financial_progress",
        "cumulative_expenditure", "monthly_expenditure", "report_date",
        "delay_months", "delay_reason", "actual_completion_date", "actual_final_expenditure"
    ]

    return df[standard_columns]


def load_and_preprocess_all(
    data_dir: str = "data/raw",
    output_path: str = "data/processed/processed_monthly_data.csv"
) -> pd.DataFrame:
    """
    Loads all monthly flash reports, standardizes columns, sorts chronologically,
    validates data consistency, and saves to CSV.
    """
    search_dirs = [data_dir, "data", "../data", os.path.join(os.path.dirname(__file__), "..", "data", "raw")]
    excel_files = []
    for sdir in search_dirs:
        if os.path.exists(sdir):
            found = glob.glob(os.path.join(sdir, "*.xlsx"))
            if found:
                excel_files = sorted(found)
                break

    if not excel_files:
        if os.path.exists(output_path):
            logger.info(f"Loading existing processed data from {output_path}")
            return pd.read_csv(output_path, parse_dates=["report_date", "start_date", "original_completion_date", "revised_completion_date", "actual_completion_date"])
        else:
            raise FileNotFoundError(f"No Excel files found in {search_dirs} and no processed file at {output_path}")

    logger.info(f"Processing {len(excel_files)} Excel files: {[os.path.basename(f) for f in excel_files]}")

    all_dfs = []
    for f in excel_files:
        df_month = preprocess_excel_file(f)
        if not df_month.empty:
            all_dfs.append(df_month)

    if not all_dfs:
        raise ValueError("Failed to extract data from raw Excel files.")

    combined_df = pd.concat(all_dfs, ignore_index=True)

    # Sort strictly by project_id and report_date
    combined_df["report_date"] = pd.to_datetime(combined_df["report_date"])
    combined_df = combined_df.sort_values(by=["project_id", "report_date"]).reset_index(drop=True)

    # Deduplicate on (project_id, report_date)
    init_count = len(combined_df)
    combined_df = combined_df.drop_duplicates(subset=["project_id", "report_date"], keep="last").reset_index(drop=True)
    dropped_dupes = init_count - len(combined_df)
    if dropped_dupes > 0:
        logger.info(f"Deduplicated {dropped_dupes} records.")

    # Quality and Anomaly checks across time
    combined_df["exp_diff"] = combined_df.groupby("project_id")["cumulative_expenditure"].diff()
    neg_exp_count = (combined_df["exp_diff"] < -0.01).sum()
    if neg_exp_count > 0:
        logger.warning(
            f"Detected {neg_exp_count} instances where cumulative expenditure decreased across successive months. "
            f"Logged for monitoring (preserving records)."
        )

    combined_df = combined_df.drop(columns=["exp_diff"], errors="ignore")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    combined_df.to_csv(output_path, index=False)
    logger.info(f"Successfully processed {len(combined_df)} records across {combined_df['project_id'].nunique()} unique projects.")
    logger.info(f"Saved processed data to {output_path}")

    return combined_df


if __name__ == "__main__":
    load_and_preprocess_all()
