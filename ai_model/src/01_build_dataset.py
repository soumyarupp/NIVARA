"""
NIVARA — Step 1: build the dataset (synthetic), engineer features, create labels.

Run:  python src/01_build_dataset.py

What this does, in plain terms:
  1. Invents a realistic set of government infrastructure projects, each tracked
     month by month (like PAIMANA/OCMS monthly progress reports).
  2. Cleans the data.
  3. Builds "features" — numbers derived from the raw columns that help a model
     spot trouble (e.g. how far behind schedule a project is).
  4. Builds "labels" — the thing we want to predict: will this project be
     delayed 3 / 6 / 12 months from now?

Output: data/nivara_features.csv   (one row = one project in one month, ready to train on)

DONE looks like: it prints the final shape and "STEP 1 DONE", and the CSV exists.
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)          # fixed seed => same data every run (reproducible)
DATA = Path(__file__).resolve().parents[1] / "data"
DATA.mkdir(exist_ok=True)

N_PROJECTS = 400        # how many projects
MONTHS     = 30         # how many monthly records per project
DELAY_GAP  = 15.0       # a project is "delayed" if planned% - actual% exceeds this

SECTORS = ["Roads", "Bridges", "Buildings", "Water", "Power", "Irrigation"]
STATES  = ["Bihar", "UP", "Maharashtra", "Rajasthan", "Odisha", "Assam"]

# Free-text remark templates, grouped by the delay-reason category they represent.
# (These become the labels for the DistilBERT text model in step 3.)
REMARKS = {
    "land_acquisition":  ["land acquisition pending", "farmers protesting land handover",
                           "land dispute in court", "right of way not cleared",
                           "acquisition of private land delayed", "encroachment on project land",
                           "compensation to landowners not settled", "land records under verification",
                           "villagers refused to vacate", "alignment changed due to land issue"],
    "contractor_issue":  ["contractor mobilisation slow", "contractor dispute over payment",
                           "contractor abandoned site", "labour shortage at site",
                           "contractor lacks machinery", "sub-contractor quit midway",
                           "poor workmanship, rework ordered", "contractor blacklisted, retendering",
                           "shortage of skilled workers", "contractor missed the deadline again"],
    "funds_delay":       ["fund release delayed", "budget sanction awaited",
                           "payment to vendor stuck", "grant instalment not received",
                           "state share not released", "bills pending at treasury",
                           "cost revision approval awaited", "funds diverted to other scheme",
                           "central assistance delayed", "cash flow crunch stalled work"],
    "environmental":     ["forest clearance pending", "monsoon flooding halted work",
                           "environmental NOC awaited", "heavy rain damaged approach road",
                           "wildlife clearance pending", "pollution board approval delayed",
                           "landslide blocked the site", "site waterlogged after storms",
                           "tree felling permission awaited", "extreme heat stopped concreting"],
    "on_track":          ["work progressing as planned", "milestone achieved on schedule",
                           "no issues reported this month", "steady progress this month",
                           "ahead of schedule this quarter", "all clearances in place",
                           "materials delivered on time", "site work running smoothly",
                           "phase completed successfully", "inspection passed without remarks"],
}
REMARK_CATS = list(REMARKS.keys())


def build_one_project(pid: int) -> pd.DataFrame:
    """Create one project's full monthly history."""
    sector = RNG.choice(SECTORS)
    state  = RNG.choice(STATES)
    # Sanctioned cost in crores; some projects are inherently riskier.
    base_cost = float(RNG.uniform(5, 500))
    contractor_rating = float(np.clip(RNG.normal(3.0, 0.9), 1, 5))   # 1=bad .. 5=good

    # "risk propensity" drives whether this project tends to slip.
    # Lower contractor rating -> more likely to fall behind.
    risk = np.clip(RNG.normal(0.5, 0.25) + (3.0 - contractor_rating) * 0.12, 0.02, 0.95)

    rows = []
    physical = 0.0
    planned  = 0.0
    cost      = base_cost
    expenditure = 0.0
    total_ms  = int(RNG.integers(4, 12))     # total milestones for the project
    delayed_ms = 0

    for m in range(MONTHS):
        # planned progress climbs smoothly toward 100 over the schedule
        planned_step = RNG.uniform(2.5, 4.0)
        planned = min(100.0, planned + planned_step)
        # actual progress tracks the plan times an "efficiency":
        #   healthy projects keep up (efficiency ~1), risky ones lag (efficiency <1),
        #   and a few over-perform and catch up (efficiency >1). This spread is what
        #   makes the future delay-labels balanced instead of "everyone slips".
        efficiency = np.clip(RNG.normal(1.0, 0.15) - risk * 0.55, 0.35, 1.25)
        step = planned_step * efficiency
        physical = min(100.0, max(0.0, physical + step))

        # expenditure tends to track (and sometimes outrun) physical progress
        expenditure = min(cost * 1.4,
                          expenditure + cost * (step / 100.0) * RNG.uniform(0.8, 1.5))

        # occasional cost revision upward on risky projects
        if RNG.random() < 0.02 + risk * 0.03:
            cost *= RNG.uniform(1.02, 1.10)

        gap = planned - physical
        # milestone slips more often when behind schedule
        if gap > DELAY_GAP and RNG.random() < 0.35 and delayed_ms < total_ms:
            delayed_ms += 1

        # pick a remark: behind schedule -> a problem remark; else usually on-track
        if gap > DELAY_GAP:
            cat = RNG.choice(["land_acquisition", "contractor_issue",
                              "funds_delay", "environmental"])
        else:
            cat = "on_track" if RNG.random() < 0.8 else RNG.choice(REMARK_CATS)
        remark = RNG.choice(REMARKS[cat])

        rows.append(dict(
            project_id=f"P{pid:04d}", month_index=m, sector=sector, state=state,
            contractor_rating=round(contractor_rating, 2),
            sanctioned_cost=round(cost, 2), expenditure=round(expenditure, 2),
            physical_pct=round(physical, 2), planned_pct=round(planned, 2),
            milestones_total=total_ms, milestones_delayed=delayed_ms,
            remark=remark, remark_category=cat,
        ))
    return pd.DataFrame(rows)


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive model-friendly features. Velocities are per-project month-over-month."""
    df = df.sort_values(["project_id", "month_index"]).copy()

    df["progress_gap"]         = df["planned_pct"] - df["physical_pct"]
    df["expenditure_ratio"]    = df["expenditure"] / df["sanctioned_cost"]
    df["milestone_delay_ratio"] = df["milestones_delayed"] / df["milestones_total"]

    g = df.groupby("project_id", group_keys=False)
    df["progress_velocity"]    = g["physical_pct"].diff().fillna(0)
    df["expenditure_velocity"] = g["expenditure"].diff().fillna(0)
    first_cost = g["sanctioned_cost"].transform("first")
    df["cost_growth"]          = df["sanctioned_cost"] / first_cost - 1.0

    # running count of months this project has been "behind"
    behind = (df["progress_gap"] > DELAY_GAP).astype(int)
    df["delay_count"] = behind.groupby(df["project_id"]).cumsum()
    return df


def add_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Label = will the project be delayed N months in the FUTURE.
    'delayed' at a month = progress_gap that month > DELAY_GAP.
    For a row at month t, label_Nm = delayed-status at month t+N (same project).
    Rows without a real future (near the end) are dropped so we never guess.
    """
    df = df.sort_values(["project_id", "month_index"]).copy()
    delayed_now = (df["progress_gap"] > DELAY_GAP).astype(int)
    df["_delayed_now"] = delayed_now.values

    for horizon in (3, 6, 12):
        df[f"label_{horizon}m"] = (
            df.groupby("project_id")["_delayed_now"].shift(-horizon)
        )
    # keep only rows where ALL three future labels exist
    df = df.dropna(subset=["label_3m", "label_6m", "label_12m"]).copy()
    for horizon in (3, 6, 12):
        df[f"label_{horizon}m"] = df[f"label_{horizon}m"].astype(int)

    # regression target for the cost model: final cost overrun ratio of the project
    final_cost = df.groupby("project_id")["sanctioned_cost"].transform("last")
    first_cost = df.groupby("project_id")["sanctioned_cost"].transform("first")
    df["cost_overrun_ratio"] = final_cost / first_cost - 1.0

    return df.drop(columns=["_delayed_now"])


def main():
    print("Building synthetic project histories ...")
    df = pd.concat([build_one_project(i) for i in range(N_PROJECTS)], ignore_index=True)

    # --- light cleaning (data is clean by construction, but show the habit) ---
    df = df.drop_duplicates(subset=["project_id", "month_index"])
    df = df.dropna(subset=["physical_pct", "planned_pct", "sanctioned_cost"])

    df = add_features(df)
    df = add_labels(df)

    out = DATA / "nivara_features.csv"
    df.to_csv(out, index=False)

    print(f"Projects: {df['project_id'].nunique()}  Rows: {len(df)}")
    print("Label balance (share delayed in the future):")
    for h in (3, 6, 12):
        print(f"  label_{h}m: {df[f'label_{h}m'].mean():.2%} delayed")
    print(f"Saved -> {out}")
    print("STEP 1 DONE")


if __name__ == "__main__":
    main()

