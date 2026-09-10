# NIVARA ML API

Machine-learning service for NIVARA infrastructure project monitoring.

## What this service provides

- 3-month project risk prediction - CatBoost
- 6-month project risk prediction - CatBoost
- Anomaly detection - Isolation Forest
- Similar-project retrieval - KNN
- Risk explainability - SHAP
- Project data endpoints for 2025-26 and April 2026

## Model validation

The primary 3-month CatBoost model was evaluated using a temporal holdout:

- Training: July-September 2025
- Testing: October-December 2025
- AUC: 0.8863
- Precision: 0.7015
- Recall: 0.7928
- F1: 0.7443

The temporal split is not completely project-independent because projects can have multiple monthly observations.

## Installation

pip install -r requirements.txt

## Run the API

From the ai_model directory:

uvicorn api:app --host 0.0.0.0 --port 8000

Swagger docs: http://<host>:8000/docs

## Endpoints

- GET /
- GET /health
- GET /model-info
- GET /projects
- GET /projects/{project_id}
- GET /projects-2026-27
- POST /predict

### POST /predict required fields

project_id, original_cost_crore, revised_cost_crore, cumulative_expenditure_crore, physical_progress_pct, expenditure_ratio, cost_change_ratio, schedule_delay_months, month_num, agency, state

Response includes 3-month risk, 6-month risk, anomaly result, SHAP factors, similar projects, overall decision, and next action.

## Integration architecture

MongoDB -> NIVARA Backend -> NIVARA ML API -> ML results -> Backend -> Frontend

The ML service should not connect directly to MongoDB.

## Important limitations

Cost prediction - not included; validation performance was not strong enough to justify serving it.

NLP - the DistilBERT experiment used synthetic/template remarks, not real PAIMANA text, and is not included as a validated service.

LLM - any LLM layer is for explanation/summarization only. Numerical predictions come from the ML models, not the LLM.

Guardrail - validates structured evidence, schema, and value ranges. It is not a complete hallucination detector.

April 2026 data - a current snapshot, not used as a future supervised validation set since outcome labels for it do not exist yet.

## Included models

models/real_2025_26/
- risk_3m_catboost_temporal.joblib
- risk_6m_catboost.joblib
- anomaly_iforest.joblib
- similarity_knn.joblib
