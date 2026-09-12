"""
utils.py
-------------------------------------------------------------------------
NIVARA AI Platform - Utility functions for date parsing, numerical 
cleaning, safe arithmetic, and structured logging.
-------------------------------------------------------------------------
"""

import re
import logging
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import numpy as np
import pandas as pd

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("NIVARA_AI")


def parse_numeric(val, default=None):
    """
    Safely converts input values (strings with currencies, commas, percentages,
    parentheses, dashes, or nulls) into a clean Python float.
    """
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float, np.integer, np.floating)):
        if np.isnan(val) or np.isinf(val):
            return default
        return float(val)

    s = str(val).strip()
    if not s or s in ("-", "--", "NA", "N/A", "nan", "None", "nil"):
        return default

    # Handle parenthesized numbers e.g. "(255.69)" -> 255.69
    # In some tables parentheses denote revision or comments
    match = re.search(r"[-+]?\d+(?:,\d+)*(?:\.\d+)?", s.replace(",", ""))
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return default
    return default


def parse_date_safe(val):
    """
    Parses various date strings and datetime objects into pd.Timestamp or None.
    Handles formats like:
    - '03/2026' or '3/2026' (MM/YYYY)
    - '2026-07-01' (YYYY-MM-DD)
    - 'April 2026' or 'Feb 2026'
    - '03/2026 (03/2026)'
    - Excel integer date serials
    """
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (pd.Timestamp, datetime, date)):
        return pd.Timestamp(val)

    s = str(val).strip()
    if not s or s in ("-", "--", "NA", "N/A", "nan", "None", "nil"):
        return None

    # Clean off trailing parentheses or extra comments like "03/2026 (03/2026)"
    s_clean = s.split("(")[0].strip()

    # Try standard month/year formats
    for fmt in ("%m/%Y", "%Y-%m-%d", "%d/%m/%Y", "%m-%Y", "%Y/%m/%d", "%B %Y", "%b %Y", "%B_%Y", "%b_%Y"):
        try:
            dt = datetime.strptime(s_clean, fmt)
            return pd.Timestamp(dt)
        except ValueError:
            continue

    # Try extracting MM/YYYY with regex
    m = re.search(r"(\d{1,2})[/.-](\d{4})", s)
    if m:
        try:
            month = int(m.group(1))
            year = int(m.group(2))
            if 1 <= month <= 12 and 1970 <= year <= 2100:
                return pd.Timestamp(year=year, month=month, day=1)
        except Exception:
            pass

    # Try extracting Month YYYY with regex e.g. "April 2026"
    m2 = re.search(r"([A-Za-z]+)\s*[-_]?\s*(\d{4})", s)
    if m2:
        try:
            dt = datetime.strptime(f"{m2.group(1)} {m2.group(2)}", "%B %Y")
            return pd.Timestamp(dt)
        except Exception:
            try:
                dt = datetime.strptime(f"{m2.group(1)} {m2.group(2)}", "%b %Y")
                return pd.Timestamp(dt)
            except Exception:
                pass

    return None


def add_months_to_date(base_date, months):
    """
    Safely adds a number of months (float or int) to a base date.
    Returns ISO date string 'YYYY-MM-DD'.
    """
    if base_date is None:
        return None
    ts = pd.Timestamp(base_date)
    m_int = int(months)
    remaining_fraction = float(months) - m_int
    days_extra = int(remaining_fraction * 30.4375)

    try:
        new_date = ts + relativedelta(months=m_int, days=days_extra)
        return new_date.strftime("%Y-%m-%d")
    except Exception as e:
        logger.warning(f"Error in add_months_to_date: {e}")
        return None


def diff_in_months(date_later, date_earlier):
    """
    Computes elapsed months between two dates as a float.
    """
    if date_later is None or date_earlier is None:
        return None
    t1 = pd.Timestamp(date_later)
    t0 = pd.Timestamp(date_earlier)
    return float((t1.year - t0.year) * 12 + (t1.month - t0.month) + (t1.day - t0.day) / 30.4375)


def sanitize_for_json(obj):
    """
    Recursively converts numpy/pandas data types, NaNs, and Timestamps to JSON-safe Python natives.
    """
    if obj is None:
        return None
    if isinstance(obj, (pd.Timestamp, datetime, date)):
        return obj.isoformat()
    if isinstance(obj, (np.floating, float)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(float(obj), 4)
    if isinstance(obj, (np.integer, int)):
        return int(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(x) for x in obj]
    return obj
