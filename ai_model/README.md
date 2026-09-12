# NIVARA AI Prediction & Monitoring Service 🚀

Production-ready machine learning, timeline forecasting, cost escalation estimation, risk scoring, and bottleneck classification engine for **NIVARA** — India's Infrastructure Project Monitoring Platform.

---

## 🏛️ Project Purpose

NIVARA empowers government authorities, project directors, and monitoring officers to track central and state infrastructure projects across India. This service processes monthly Flash Reports, extracts chronological progress & spending trajectories, detects early warning signs, forecasts completion timelines, estimates budget overruns, and categorizes project delay bottlenecks.

---

## 📂 Project Structure

```
new_model_ai/
│
├── data/
│   ├── raw/                              # Raw Flash Report Excel files (Jan 2026 – Jul 2026)
│   │   ├── FlashReport_January_2026...xlsx
│   │   ├── FlashReport_February_2026...xlsx
│   │   ├── FlashReport_March_2026...xlsx
│   │   ├── FlashReport_April2026...xlsx
│   │   ├── FlashReport_May2026...xlsx
│   │   ├── FlashReport_June_2026...xlsx
│   │   ├── FlashReport_July2026...xlsx
│   │   └── projects_template.xlsx        # Standard input template
│   └── processed/
│       ├── processed_monthly_data.csv    # 13,400+ point-in-time snapshots with 50 features
│       ├── completion_training_data.csv  # Verified completion training snapshots
│       └── cost_training_data.csv        # Completed project cost training snapshots
│
├── models/
│   ├── completion_model.cbm              # CatBoost completion timeline regressor
│   ├── cost_model.cbm                    # CatBoost final expenditure regressor
│   ├── risk_model.cbm                    # CatBoost high-risk classifier
│   ├── delay_vectorizer.joblib           # TF-IDF bottleneck text vectorizer
│   ├── delay_classifier.joblib           # LogisticRegression delay reason classifier
│   └── model_metadata.json               # Full evaluation metrics and audit trail
│
├── src/
│   ├── __init__.py
│   ├── data_preprocessing.py             # Column normalization, cleaning, currency parsing
│   ├── feature_engineering.py            # Point-in-time features, velocities, mismatches
│   ├── train_completion.py               # Completion date & duration model trainer
│   ├── train_cost.py                     # Final cost & overrun model trainer
│   ├── train_risk.py                     # Multi-factor rule + ML risk scoring
│   ├── train_delay_nlp.py                # Delay constraint NLP classifier
│   ├── prediction.py                     # Unified inference engine & what-if simulator
│   ├── generate_template.py              # Sample Excel template generator
│   └── utils.py                          # Date math, numeric parsing, JSON sanitization
│
├── tests/
│   └── test_api.py                       # Automated unit & integration tests
│
├── api.py                                # Production FastAPI REST service
├── train_all.py                          # Master end-to-end training pipeline
├── requirements.txt                      # Pinned Python package dependencies
├── .env.example                          # Environment variable configuration
└── README.md                             # Comprehensive documentation
```

---

## 📊 Excel Format & Column Normalization

The preprocessing engine handles heterogeneous MoSPI / Ministry Excel formats. Incoming column headers are normalized into standard snake_case attributes:

| Standard Column Name | Typical Excel Aliases |
| :--- | :--- |
| `project_id` | `Project Code`, `Project ID`, `PMGID`, `Legacy OCMS Code` *(also extracted from Project Name)* |
| `project_name` | `Project Name`, `Name of Project` |
| `state` | `State`, `State/UT`, `Location` |
| `sector` | `Sector`, `Infrastructure Sector` |
| `agency` | `Agency`, `Implementing Agency`, `Ministry / Department` |
| `project_status` | `Status`, `Project Status`, `Report Type` |
| `start_date` | `Start Date`, `Date of Approval (Start Date)`, `Approval Date` |
| `original_completion_date` | `Original/Target DoC`, `Original DoC`, `Target DoC` |
| `revised_completion_date` | `Revised DoC`, `Anticipated DoC` |
| `actual_completion_date` | `Actual Date of Completion`, `Actual Completion Date` |
| `report_date` | `Month & Year`, `Month-Year`, `Month` + `Year` |
| `original_cost` | `Original Cost (Rs. Crore)`, `Sanctioned Cost` |
| `revised_cost` | `Revised Cost (Rs. Crore)`, `Anticipated Cost` |
| `cumulative_expenditure` | `Cumulative Expenditure (Rs. Crore)`, `Expenditure` |
| `monthly_expenditure` | `Monthly Expenditure`, `Expenditure during month` |
| `actual_final_expenditure` | `Actual Final Expenditure`, `Completed Cost` |
| `physical_progress` | `Physical Progress (%)`, `Physical Progress Pct` |
| `financial_progress` | `Financial Progress (%)` *(auto-computed if absent)* |
| `delay_months` | `Delay Months`, `Schedule Delay (Months)` |
| `delay_reason` | `Delay Reason`, `Reasons for Delay`, `Remarks` |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Virtual environment (`venv` or `conda`)

### 2. Install Dependencies
```bash
cd new_model_ai
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
```

---

## 🔄 End-to-End Pipeline Execution

Run the complete ingestion, feature engineering, and model training pipeline with a single command:

```bash
python train_all.py
```

This will:
1. Scan `data/raw/*.xlsx` and clean 13,400+ monthly project records.
2. Calculate 50 chronological point-in-time features with **zero future data leakage**.
3. Train and evaluate:
   - **Completion Regressor** (`models/completion_model.cbm`)
   - **Cost Overrun Regressor** (`models/cost_model.cbm`)
   - **Risk Classifier** (`models/risk_model.cbm`)
   - **NLP Delay Classifier** (`models/delay_classifier.joblib`)
4. Export full audit metrics to `models/model_metadata.json`.

---

## 🧠 Feature Engineering Overview

For each monthly snapshot of every project, the following features are computed strictly from available historical records:

- **Progress Dynamics**:
  - `monthly_progress`: Current physical progress minus previous month.
  - `progress_change_3_months` & `progress_change_6_months`.
  - `average_monthly_progress_3m` & `average_monthly_progress_6m`.
  - `progress_trend`: `increasing`, `stable`, or `decreasing`.
  - `progress_acceleration`: Second derivative of physical progress.
  - `progress_slowdown`: Flagged (1/0) when recent progress drops below 65% of historical average.
  - `remaining_progress`: `100 - physical_progress`.
- **Financial Dynamics**:
  - `calculated_monthly_expenditure`: Month-over-month expenditure increment in ₹ Crore.
  - `average_monthly_spending_3m` & `average_monthly_spending_6m`.
  - `expenditure_growth_rate`: Point-in-time spending acceleration.
  - `monthly_spending_trend`: `increasing`, `stable`, or `decreasing`.
- **Financial vs Physical Mismatch**:
  - `progress_mismatch_gap`: `financial_progress - physical_progress`.
  - `mismatch_status`: `Normal` (≤10%), `Monitor` (10–20%), `Warning` (20–30%), `High Alert` (>30%).
- **Duration & Timing**:
  - `project_age_months`, `planned_duration_months`, `elapsed_duration_months`.
  - `expected_delay_months`, `completion_date_difference_days`, `reporting_gap_days`.

---

## 🚀 Running the FastAPI Service

### Start Local Server
```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

Or via direct python execution:
```bash
python api.py
```

---

## 📡 API Endpoints Reference

### 1. Health Check
`GET /health`
```json
{
  "status": "ok",
  "service": "NIVARA AI Model"
}
```

---

### 2. Project Prediction & Risk Analysis
`POST /predict`

#### Request Payload
```json
{
  "project_id": "PRJ001",
  "report_date": "2026-07-01",
  "state": "West Bengal",
  "sector": "Road",
  "agency": "Example Agency",
  "original_cost": 40.0,
  "revised_cost": 42.0,
  "physical_progress": 58.0,
  "financial_progress": 62.0,
  "cumulative_expenditure": 26.0,
  "monthly_progress_history": [4.0, 4.0, 4.0, 4.0, 4.0, 3.0],
  "monthly_expenditure_history": [2.0, 2.5, 2.5, 2.0, 2.5, 2.5],
  "original_completion_date": "2026-12-31",
  "delay_months": 0
}
```

#### Response Payload
```json
{
  "project_id": "PRJ001",
  "report_date": "2026-07-01",
  "prediction_status": "supervised",
  "predicted_remaining_months": 6.9,
  "predicted_completion_date": "2027-01-28",
  "expected_delay_months": 0.9,
  "current_expenditure": 26.0,
  "predicted_final_expenditure": 131.5,
  "expected_additional_expenditure": 105.5,
  "expected_cost_overrun": 91.5,
  "expected_cost_overrun_percentage": 228.75,
  "original_cost": 40.0,
  "revised_cost": 42.0,
  "risk_score": 40,
  "risk_level": "Medium",
  "warnings": [
    "Recent physical progress has slowed or is trending downward.",
    "Anticipated cost escalation exceeds sanctioned budget by 5.0%."
  ],
  "last_3_months": [],
  "model_type": "supervised",
  "model_version": "NIVARA-v2.0-Production",
  "prediction_created_at": "2026-09-11T12:35:00.000Z",
  "decision": "HEALTHY",
  "next_action": "Continue monitoring"
}
```

---

### 3. Project Chronological History
`POST /project-history`

#### Request
```json
{
  "project_id": "400005",
  "months": 3
}
```

#### Response
```json
{
  "project_id": "400005",
  "last_3_months": [
    {
      "month": "May",
      "year": 2026,
      "physical_progress": 98.0,
      "monthly_progress": 2.0,
      "cumulative_expenditure": 412.3,
      "monthly_expenditure": 14.5,
      "financial_progress": 96.0,
      "progress_mismatch_gap": -2.0,
      "risk_level": "Low"
    },
    {
      "month": "Jun",
      "year": 2026,
      "physical_progress": 99.5,
      "monthly_progress": 1.5,
      "cumulative_expenditure": 425.0,
      "monthly_expenditure": 12.7,
      "financial_progress": 98.5,
      "progress_mismatch_gap": -1.0,
      "risk_level": "Low"
    },
    {
      "month": "Jul",
      "year": 2026,
      "physical_progress": 100.0,
      "monthly_progress": 0.5,
      "cumulative_expenditure": 431.2,
      "monthly_expenditure": 6.2,
      "financial_progress": 100.0,
      "progress_mismatch_gap": 0.0,
      "risk_level": "Low"
    }
  ],
  "summary": {
    "progress_change": 2.0,
    "total_spending": 33.4,
    "average_monthly_progress": 1.33,
    "average_monthly_spending": 11.13,
    "progress_slowdown": false,
    "expenditure_trend": "decreasing"
  }
}
```

---

### 4. NLP Delay Bottleneck Classification
`POST /classify-delay`

#### Request
```json
{
  "text": "Work delayed due to land acquisition problem and slow compensation disbursement."
}
```

#### Response
```json
{
  "category": "Land Acquisition",
  "confidence": 0.9124
}
```

Supported categories:
1. `Land Acquisition`
2. `Fund Shortage`
3. `Contractor Issue`
4. `Material Shortage`
5. `Labour Shortage`
6. `Environmental Clearance`
7. `Design Change`
8. `Legal Issue`
9. `Weather or Natural Disaster`
10. `Administrative Approval`
11. `Utility Shifting`
12. `Other`

---

### 5. Interactive What-If Delay Simulator
`POST /simulate-delay`

#### Request
```json
{
  "project_id": "PRJ001",
  "additional_delay_months": 3,
  "current_prediction": {
    "predicted_completion_date": "2027-01-28",
    "predicted_final_expenditure": 44.8,
    "current_expenditure": 26.0,
    "original_cost": 40.0
  }
}
```

#### Response
```json
{
  "project_id": "PRJ001",
  "simulation_status": "scenario_estimate",
  "additional_delay_months": 3.0,
  "original_predicted_completion_date": "2027-01-28",
  "new_predicted_completion_date": "2027-04-28",
  "average_monthly_spending_rate": 2.17,
  "estimated_additional_expenditure": 6.5,
  "new_expected_final_expenditure": 51.3,
  "new_expected_cost_overrun": 11.3,
  "notes": "This is an interactive what-if simulation based on point-in-time burn rates."
}
```

---

## 🔗 Node.js Backend Integration

The Python FastAPI microservice is designed to be called directly by the Node.js Express backend (`backend/src/services/ai.service.js`).

### Workflow:
1. **Report Submission**: Field reporting officer submits monthly progress in NIVARA web portal.
2. **Backend Storage**: Node.js backend validates and stores the record in MongoDB / PostgreSQL.
3. **AI Inference Query**: Node.js queries `POST ${AI_MODEL_URL}/predict` with the project's point-in-time data and historical monthly vectors.
4. **Forecast & Alert Trigger**: AI service returns completion date, cost overrun, risk score, and warning reasons.
5. **Dashboard & Notification**: If `risk_score >= 60`, automated email and system alerts are dispatched to nodal officers.

```javascript
// Example Node.js call
const AI_MODEL_URL = process.env.AI_MODEL_URL || 'http://127.0.0.1:8000';

const response = await fetch(`${AI_MODEL_URL}/predict`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(projectPayload)
});

const prediction = await response.json();
```

---

## ☁️ Render Cloud Deployment

This service is optimized for seamless deployment as a **Web Service on Render**.

### Render Settings:
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt && python train_all.py`
- **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `PORT`: (Auto-set by Render)
  - `HOST`: `0.0.0.0`
  - `CORS_ORIGINS`: `*` or your frontend domain

---

## 🔬 Supervised ML vs Baseline Forecasting

| Dimension | Supervised CatBoost Models | Baseline Forecasters |
| :--- | :--- | :--- |
| **Trigger** | Verified historical completion & cost records | Sparse history / newly added projects |
| **Method** | Non-linear tree ensemble with categorical encoding & SHAP | Point-in-time burn rate & duration extrapolation |
| **Output Flag** | `model_type: "supervised"` | `model_type: "baseline"` |
| **Safety Guard** | Project-level GroupKFold to eliminate data leakage | Clamped bounds: `remaining_months ∈ [0, 360]`, `expenditure ≥ 0` |

---

## 🧪 Testing & Verification

Run the automated test suite:
```bash
python tests/test_api.py
```
Expected output:
```
✓ /health passed
✓ /predict passed
✓ /predict backend compatibility passed
✓ /project-history passed
✓ /classify-delay passed
✓ /simulate-delay passed
✓ /projects list passed
ALL AUTOMATED TESTS PASSED SUCCESSFULLY!
```
