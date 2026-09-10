from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import os
import shap

app = FastAPI(
    title="NIVARA API",
    description="AI-driven Government Infrastructure Project Monitoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "real_2025_26")
DATA_PATH = "data/nivara_real_paima_2025_26.csv"

# --------------------------------------------------
# LOAD REAL 2025-26 MODELS
# --------------------------------------------------

risk_3m = joblib.load(
    os.path.join(MODEL_DIR, "risk_3m_catboost_temporal.joblib")
)

shap_explainer = shap.TreeExplainer(risk_3m)

risk_6m = joblib.load(
    os.path.join(MODEL_DIR, "risk_6m_catboost.joblib")
)

anomaly_artifact = joblib.load(
    os.path.join(MODEL_DIR, "anomaly_iforest.joblib")
)

knn_artifact = joblib.load(
    os.path.join(MODEL_DIR, "similarity_knn.joblib")
)

anomaly_scaler = anomaly_artifact["scaler"]
anomaly_model = anomaly_artifact["model"]

knn_scaler = knn_artifact["scaler"]
knn_model = knn_artifact["model"]
knn_project_ids = knn_artifact["index_project_ids"]

# --------------------------------------------------
# INPUT FEATURES
# --------------------------------------------------

FEATURES = [
    "original_cost_crore",
    "revised_cost_crore",
    "cumulative_expenditure_crore",
    "physical_progress_pct",
    "expenditure_ratio",
    "cost_change_ratio",
    "schedule_delay_months",
    "month_num",
    "agency",
    "state"
]

NUMERIC_FEATURES = [
    "original_cost_crore",
    "revised_cost_crore",
    "cumulative_expenditure_crore",
    "physical_progress_pct",
    "expenditure_ratio",
    "cost_change_ratio",
    "schedule_delay_months",
    "month_num"
]

# --------------------------------------------------
# REQUEST SCHEMA
# --------------------------------------------------

class ProjectInput(BaseModel):

    project_id: str

    original_cost_crore: float = Field(ge=0)
    revised_cost_crore: float = Field(ge=0)
    cumulative_expenditure_crore: float = Field(ge=0)

    physical_progress_pct: float = Field(ge=0, le=100)

    expenditure_ratio: float = Field(ge=0)
    cost_change_ratio: float

    schedule_delay_months: float
    month_num: int = Field(ge=1, le=12)

    agency: str
    state: str


# --------------------------------------------------
# DATAFRAME
# --------------------------------------------------

def make_dataframe(data: ProjectInput):

    row = {
        "original_cost_crore": data.original_cost_crore,
        "revised_cost_crore": data.revised_cost_crore,
        "cumulative_expenditure_crore":
            data.cumulative_expenditure_crore,
        "physical_progress_pct":
            data.physical_progress_pct,
        "expenditure_ratio":
            data.expenditure_ratio,
        "cost_change_ratio":
            data.cost_change_ratio,
        "schedule_delay_months":
            data.schedule_delay_months,
        "month_num":
            data.month_num,
        "agency": str(data.agency),
        "state": str(data.state)
    }

    return pd.DataFrame(
        [row],
        columns=FEATURES
    )


# --------------------------------------------------
# RISK
# --------------------------------------------------

def predict_risk(model, X):

    probability = float(
        model.predict_proba(X)[0][1]
    )

    if probability >= 0.70:
        label = "HIGH_RISK"
    elif probability >= 0.40:
        label = "MEDIUM_RISK"
    else:
        label = "LOW_RISK"

    return {
        "probability": round(probability, 4),
        "prediction": label
    }


# --------------------------------------------------
# ANOMALY
# --------------------------------------------------

def detect_anomaly(X):

    numeric = X[NUMERIC_FEATURES]

    scaled = anomaly_scaler.transform(numeric)

    prediction = int(
        anomaly_model.predict(scaled)[0]
    )

    score = float(
        anomaly_model.decision_function(scaled)[0]
    )

    return {
        "is_anomaly": prediction == -1,
        "score": round(score, 4)
    }


# --------------------------------------------------
# SIMILAR PROJECTS
# --------------------------------------------------

def find_similar(X, current_project_id, n=5):

    numeric = X[NUMERIC_FEATURES]

    scaled = knn_scaler.transform(numeric)

    distances, indices = knn_model.kneighbors(
        scaled,
        n_neighbors=min(n + 1, len(knn_project_ids))
    )

    results = []
    seen = set()

    for distance, index in zip(
        distances[0],
        indices[0]
    ):

        project_id = str(
            knn_project_ids[index]
        )

        if project_id == str(current_project_id):
            continue

        if project_id in seen:
            continue

        seen.add(project_id)

        results.append({
            "project_id": project_id,
            "distance": round(
                float(distance), 4
            )
        })

        if len(results) == n:
            break

    return results


# --------------------------------------------------
# SHAP EXPLANATION
# --------------------------------------------------
def explain_risk(X):
    shap_values = shap_explainer.shap_values(X)
    values = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
    factors = sorted(zip(FEATURES, values), key=lambda x: abs(x[1]), reverse=True)
    return [{"feature": name, "impact": round(float(value), 4)} for name, value in factors[:5]]

# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "service": "NIVARA",
        "status": "online",
        "model_data": "2025-26",
        "message": "NIVARA API is running"
    }


# --------------------------------------------------
# MAIN AI ANALYSIS
# --------------------------------------------------

@app.post("/predict")
def predict(data: ProjectInput):

    try:

        X = make_dataframe(data)

        risk3 = predict_risk(
            risk_3m,
            X
        )

        risk6 = predict_risk(
            risk_6m,
            X
        )


        anomaly = detect_anomaly(X)
        shap_factors = explain_risk(X)

        similar = find_similar(
            X,
            data.project_id
        )

        # Overall decision follows NIVARA flowchart
        if (
            risk3["prediction"] == "HIGH_RISK"
            or risk6["prediction"] == "HIGH_RISK"
            or anomaly["is_anomaly"]
        ):
            decision = "AT_RISK"
        else:
            decision = "HEALTHY"

        return {
            "project_id": data.project_id,

            "risk": {
                "3_month": risk3,
                "6_month": risk6
            },

            "anomaly": anomaly,
            "shap_factors": shap_factors,

            "similar_projects": similar,

            "decision": decision,

            "next_action": (
                "Generate warning and notify officer"
                if decision == "AT_RISK"
                else "Continue monitoring"
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# PROJECT LIST
# --------------------------------------------------

@app.get("/projects-2026-27")
def get_projects_2026_27():
    path = "data/nivara_paima_2026_27_april.csv"

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="April 2026 PAIMANA dataset not found")

    df = pd.read_csv(path)

    fields = [
        "project_code", "project_name", "agency", "state",
        "original_cost_crore", "revised_cost_crore",
        "cumulative_expenditure_crore", "physical_progress_pct",
        "expenditure_ratio", "cost_change_ratio",
        "schedule_delay_months", "month_num", "report_month"
    ]

    df = df[fields].fillna(0)
    df["agency"] = df["agency"].astype(str)
    df["state"] = df["state"].astype(str)

    return {
        "count": len(df),
        "report_month": "2026-04",
        "projects": df.to_dict(orient="records")
    }


@app.get("/projects/{project_id}")
def get_project(project_id: str):
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="PAIMANA dataset not found")

    df = pd.read_csv(DATA_PATH)
    matches = df[df["project_code"].astype(str) == str(project_id)]

    if matches.empty:
        raise HTTPException(status_code=404, detail="Project not found")

    matches = matches.sort_values("report_month")

    return {
        "project_id": project_id,
        "history": matches.fillna(0).to_dict(orient="records")
    }


@app.get("/projects")
def get_projects():
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="PAIMANA dataset not found")

    df = pd.read_csv(DATA_PATH)
    df = df.sort_values("report_month")
    projects = df.groupby("project_code", as_index=False).tail(1).copy()

    fields = [
        "project_code", "project_name", "agency", "state",
        "original_cost_crore", "revised_cost_crore",
        "cumulative_expenditure_crore", "physical_progress_pct",
        "expenditure_ratio", "cost_change_ratio",
        "schedule_delay_months", "month_num", "report_month"
    ]

    projects = projects[fields].fillna(0)
    projects["agency"] = projects["agency"].astype(str)
    projects["state"] = projects["state"].astype(str)

    return {
        "count": len(projects),
        "projects": projects.to_dict(orient="records")
    }



@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "NIVARA ML API",
        "model": "CatBoost",
        "validation": {
            "type": "temporal_holdout",
            "train_period": "2025-07 to 2025-09",
            "test_period": "2025-10 to 2025-12",
            "auc": 0.8863,
            "recall": 0.7928,
            "f1": 0.7443
        }
    }

@app.get("/model-info")
def model_info():
    return {
        "model": "NIVARA-CatBoost-Temporal-v1",
        "task": "3-month infrastructure project risk prediction",
        "features": FEATURES,
        "risk_thresholds": {
            "low": "< 0.40",
            "medium": "0.40 - 0.69",
            "high": ">= 0.70"
        },
        "validation": {
            "train": "July-September 2025",
            "test": "October-December 2025",
            "auc": 0.8863,
            "precision": 0.7015,
            "recall": 0.7928,
            "f1": 0.7443
        }
    }
