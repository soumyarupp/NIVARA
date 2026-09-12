"""
api.py
-------------------------------------------------------------------------
NIVARA AI Platform - Production FastAPI Prediction & Monitoring Service.
Provides RESTful endpoints for Node.js backend integration, Render
cloud deployment, interactive What-If simulation, and delay NLP analysis.
-------------------------------------------------------------------------
"""

import os
import logging
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
from src.utils import logger, sanitize_for_json
from src.prediction import predictor
from src.feature_engineering import get_last_3_months
from src.train_delay_nlp import classify_delay_reason

# -----------------------------------------------------------------------
# FASTAPI APP INITIALIZATION
# -----------------------------------------------------------------------
app = FastAPI(
    title="NIVARA AI Model Service",
    description="Production Machine Learning & Risk Intelligence Engine for Government Infrastructure Monitoring",
    version="2.0.0"
)

# CORS configuration for Node.js backend & Next.js/React frontend
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True if CORS_ORIGINS != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------
# PYDANTIC REQUEST & RESPONSE SCHEMAS
# -----------------------------------------------------------------------

class ProjectPredictRequest(BaseModel):
    project_id: Optional[str] = Field(default="PRJ001", description="Unique Project ID or OCMS Code")
    project_code: Optional[str] = None
    report_date: Optional[str] = Field(default=None, description="Report date (YYYY-MM-DD or Month YYYY)")
    state: Optional[str] = Field(default="National", description="Indian State / UT")
    sector: Optional[str] = Field(default="Infrastructure", description="Project Sector (Road, Rail, Energy...)")
    agency: Optional[str] = Field(default="Implementation Agency", description="Executing Agency")
    project_status: Optional[str] = Field(default="Ongoing", description="Current Status")

    # Financials (₹ Crore)
    original_cost: Optional[float] = Field(default=None, ge=0)
    original_cost_crore: Optional[float] = Field(default=None, ge=0)
    sanctionedCost: Optional[float] = None

    revised_cost: Optional[float] = Field(default=None, ge=0)
    revised_cost_crore: Optional[float] = Field(default=None, ge=0)
    revisedCost: Optional[float] = None

    cumulative_expenditure: Optional[float] = Field(default=None, ge=0)
    cumulative_expenditure_crore: Optional[float] = Field(default=None, ge=0)
    expenditure: Optional[float] = None

    # Progress (%)
    physical_progress: Optional[float] = Field(default=None, ge=0, le=100)
    physical_progress_pct: Optional[float] = Field(default=None, ge=0, le=100)

    financial_progress: Optional[float] = Field(default=None, ge=0, le=100)
    financial_progress_pct: Optional[float] = None

    # History vectors
    monthly_progress_history: Optional[List[float]] = Field(default_factory=list)
    monthly_expenditure_history: Optional[List[float]] = Field(default_factory=list)

    # Dates & Delays
    original_completion_date: Optional[str] = None
    originalCompletionDate: Optional[str] = None
    start_date: Optional[str] = None
    startDate: Optional[str] = None
    delay_months: Optional[float] = Field(default=0.0, ge=0)
    schedule_delay_months: Optional[float] = None


class ProjectHistoryRequest(BaseModel):
    project_id: str
    months: Optional[int] = 3
    records: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class DelayClassificationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Officer remark or delay reason explanation")


class DelaySimulationRequest(BaseModel):
    project_id: str
    additional_delay_months: float = Field(default=3.0, ge=0)
    current_prediction: Optional[Dict[str, Any]] = None


# -----------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "NIVARA AI Model Service",
        "status": "online",
        "version": "2.0.0",
        "endpoints": [
            "GET /health",
            "POST /predict",
            "POST /project-history",
            "POST /classify-delay",
            "POST /simulate-delay",
            "GET /projects",
            "GET /projects/{project_id}"
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "NIVARA AI Model"
    }


@app.post("/predict")
def predict_project(payload: ProjectPredictRequest):
    """
    Main prediction endpoint.
    Computes forecasted completion date, remaining months, expected final expenditure,
    cost overrun, multi-factor risk score, warnings, and past 3 months summary.
    """
    try:
        data_dict = payload.model_dump(exclude_none=True)
        # Ensure project_id is populated
        if not data_dict.get("project_id") and data_dict.get("project_code"):
            data_dict["project_id"] = data_dict["project_code"]

        result = predictor.predict(data_dict)
        return result
    except Exception as e:
        logger.error(f"Error during /predict: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/project-history")
def project_history(payload: ProjectHistoryRequest):
    """
    Retrieves chronological monthly history records and rolling summary
    statistics for the requested project.
    """
    try:
        p_id = payload.project_id
        if payload.records and len(payload.records) > 0:
            # If records are provided directly in payload
            df_custom = pd.DataFrame(payload.records)
            df_custom["project_id"] = p_id
            return get_last_3_months(p_id, df_custom)

        return get_last_3_months(p_id, predictor.historical_df)
    except Exception as e:
        logger.error(f"Error in /project-history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/classify-delay")
def classify_delay(payload: DelayClassificationRequest):
    """
    NLP classification of project delay bottlenecks and constraints into
    12 standard infrastructure categories.
    """
    try:
        result = classify_delay_reason(payload.text)
        return {
            "category": result.get("category", "Other"),
            "confidence": result.get("confidence", 0.5)
        }
    except Exception as e:
        logger.error(f"Error in /classify-delay: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate-delay")
def simulate_delay(payload: DelaySimulationRequest):
    """
    What-If delay simulation calculating timeline shift and additional burn-rate expenditure.
    """
    try:
        result = predictor.simulate_delay(
            project_id=payload.project_id,
            additional_delay_months=payload.additional_delay_months,
            current_prediction=payload.current_prediction
        )
        return result
    except Exception as e:
        logger.error(f"Error in /simulate-delay: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects")
def get_all_projects(limit: int = 100, offset: int = 0):
    """
    Lists unique projects from historical dataset with latest status summary.
    """
    if predictor.historical_df is None:
        raise HTTPException(status_code=404, detail="Processed project dataset not loaded.")

    df = predictor.historical_df
    latest_projects = df.groupby("project_id", as_index=False).tail(1).copy()
    total_count = len(latest_projects)

    paginated = latest_projects.iloc[offset: offset + limit]
    fields = [
        "project_id", "project_name", "agency", "state", "sector",
        "original_cost", "revised_cost", "cumulative_expenditure",
        "physical_progress", "financial_progress", "delay_months",
        "report_date", "project_status"
    ]
    avail_fields = [f for f in fields if f in paginated.columns]
    records = paginated[avail_fields].fillna(0).to_dict(orient="records")

    return {
        "total_count": total_count,
        "offset": offset,
        "limit": limit,
        "projects": sanitize_for_json(records)
    }


@app.get("/projects/{project_id}")
def get_project_by_id(project_id: str):
    """
    Fetches full chronological history and current prediction for a project.
    """
    if predictor.historical_df is None:
        raise HTTPException(status_code=404, detail="Dataset not loaded.")

    df = predictor.historical_df
    matches = df[df["project_id"].astype(str) == str(project_id)].sort_values("report_date")
    if matches.empty:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found.")

    history_records = matches.fillna(0).to_dict(orient="records")
    latest_snapshot = history_records[-1]
    prediction = predictor.predict(latest_snapshot)

    return {
        "project_id": str(project_id),
        "history_count": len(history_records),
        "history": sanitize_for_json(history_records),
        "current_prediction": prediction
    }


# -----------------------------------------------------------------------
# ENTRY POINT FOR LOCAL RUN & RENDER DEPLOYMENT
# -----------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting NIVARA AI Server on {host}:{port}")
    uvicorn.run("api:app", host=host, port=port, reload=False)
