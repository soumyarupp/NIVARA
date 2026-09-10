import re
import pandas as pd

INPUT = "data/paimana_2026_27/table6_april_2026.txt"
OUTPUT = "data/nivara_paima_2026_27_april.csv"

with open(INPUT, encoding="utf-8") as f:
    lines = [x.strip() for x in f if x.strip()]

# Every project has a six-digit project-code line.
codes = [i for i, x in enumerate(lines) if re.fullmatch(r"\(\d{6}\)", x)]

rows = []

def clean(x):
    return x.strip().strip("()").strip()

def num(x):
    x = clean(x).replace(",", "")
    try:
        return float(x)
    except:
        return None

def is_date(x):
    return bool(re.fullmatch(r"\(?\d{2}/\d{4}\)?", x))

for k, code_i in enumerate(codes):
    prev = codes[k - 1] if k else -1
    next_i = codes[k + 1] if k + 1 < len(codes) else len(lines)

    # Find serial number immediately before this project.
    serial_i = None
    for j in range(code_i - 1, prev, -1):
        if re.fullmatch(r"\d+", lines[j]):
            serial_i = j
            break

    if serial_i is None:
        continue

    sl_no = int(lines[serial_i])
    project_code = int(clean(lines[code_i]))
    agency = clean(lines[code_i - 1])

    project_name = " ".join(
        lines[serial_i + 1:code_i - 1]
    ).strip()

    tail = lines[code_i + 1:next_i]

    # legacy OCMS / PMGID
    # state comes immediately after it
    state = clean(tail[1]) if len(tail) > 1 else ""

    # Four date fields, allowing "-"
    dates = []
    date_positions = []

    for i, x in enumerate(tail[2:], start=2):
        if is_date(x):
            dates.append(clean(x))
            date_positions.append(i)
        elif x in ("-", "(-)"):
            dates.append(None)
            date_positions.append(i)

        if len(dates) == 4:
            break

    while len(dates) < 4:
        dates.append(None)

    approval_date, start_date, target_doc, revised_doc = dates

    # Numerical fields follow the four date fields.
    start = date_positions[-1] + 1 if len(date_positions) == 4 else 6

    values = []
    for x in tail[start:]:
        v = num(x)
        if v is not None:
            values.append(v)
        if len(values) == 4:
            break

    while len(values) < 4:
        values.append(None)

    original_cost, revised_cost, expenditure, physical_progress = values

    rows.append({
        "report_month": "2026-04",
        "sl_no": sl_no,
        "project_code": project_code,
        "project_name": project_name,
        "agency": agency,
        "state": state,
        "approval_date": approval_date,
        "start_date": start_date,
        "target_doc": target_doc,
        "revised_doc": revised_doc,
        "original_cost_crore": original_cost,
        "revised_cost_crore": revised_cost,
        "cumulative_expenditure_crore": expenditure,
        "physical_progress_pct": physical_progress,
    })

df = pd.DataFrame(rows)

df["expenditure_ratio"] = (
    df["cumulative_expenditure_crore"] /
    df["revised_cost_crore"].replace(0, pd.NA)
).fillna(0)

df["cost_change_ratio"] = (
    (df["revised_cost_crore"] - df["original_cost_crore"]) /
    df["original_cost_crore"].replace(0, pd.NA)
).fillna(0)

def months_between(start, end):
    if not start or not end:
        return 0.0
    try:
        sm, sy = map(int, start.split("/"))
        em, ey = map(int, end.split("/"))
        return float((ey - sy) * 12 + (em - sm))
    except:
        return 0.0

df["schedule_delay_months"] = df.apply(
    lambda r: months_between(r["start_date"], r["revised_doc"]),
    axis=1
)
df["month_num"] = 4

df.to_csv(OUTPUT, index=False)

print("PROJECT CODE RECORDS:", len(codes))
print("ROWS EXTRACTED:", len(df))
print("UNIQUE PROJECT CODES:", df["project_code"].nunique())
print("OUTPUT:", OUTPUT)
print()
print(df.head(3).to_string(index=False))
