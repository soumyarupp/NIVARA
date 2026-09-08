# NIVARA Platform — Backend API Specification & Documentation

This document outlines the REST API contracts required by the **NIVARA (National Infrastructure Vigilance and Risk Analytics)** frontend platform. All endpoints are configured to connect to a downstream backend server specified via `VITE_API_BASE_URL` (e.g. `http://localhost:8000`).

---

## Configuration & Environment Variables

- **`VITE_API_BASE_URL`**: Base URL for backend server (default: `http://localhost:8000`)
- **`VITE_USE_MOCK_DATA`**: Toggle between development mock data (`true`) and real backend mode (`false`)

---

## 1. Dashboard API

### `GET /api/dashboard/overview`
- **Purpose**: Retrieves top-line infrastructure statistics, system operational health status, and state-level risk breakdown.
- **Query Parameters**: None
- **Example Response**:
```json
{
  "success": true,
  "systemStatus": "OPERATIONAL",
  "lastUpdated": "08 Sep 2026, 21:50 IST",
  "summary": {
    "totalProjects": 186,
    "onTrack": 124,
    "atRisk": 44,
    "critical": 18,
    "totalMonitoredOutlay": "₹48.2 Lakh Crore",
    "projectsAtRisk": "118 Projects"
  },
  "riskDistribution": {
    "low": 124,
    "medium": 26,
    "high": 18,
    "critical": 18
  }
}
```
- **Possible Errors**: `500 Internal Server Error`

---

## 2. Early Warning & Alert System APIs

### `GET /api/alerts`
- **Purpose**: Fetches active early warning alerts generated across monitored projects.
- **Query Parameters**: `severity` (optional: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`), `projectId` (optional)
- **Example Response**:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "ALT-001",
      "projectId": "NH27-BR-001",
      "severity": "HIGH",
      "type": "FUND_PROGRESS_MISMATCH",
      "message": "85% of funds disbursed while reported physical progress is only 40%.",
      "createdAt": "2026-09-08T18:30:00Z",
      "acknowledged": false
    }
  ]
}
```

### `POST /api/alerts/:id/acknowledge`
- **Purpose**: Marks an alert as acknowledged by a nodal official.
- **Example Response**:
```json
{
  "success": true,
  "message": "Alert ALT-001 acknowledged successfully."
}
```

### `POST /api/alerts/generate`
- **Purpose**: Triggers telemetry evaluation to generate an alert for a specific project.
- **Request Body**:
```json
{
  "projectId": "NH27-BR-001"
}
```
- **Example Response**:
```json
{
  "success": true,
  "alert": {
    "id": "ALT-005",
    "projectId": "NH27-BR-001",
    "severity": "HIGH",
    "type": "FUND_PROGRESS_MISMATCH",
    "message": "Project expenditure is significantly higher than reported physical progress.",
    "createdAt": "2026-09-08T20:00:00Z",
    "acknowledged": false
  }
}
```

---

## 3. Interactive AI Chatbot API

### `POST /api/chat/query`
- **Purpose**: Processes natural language queries regarding project risks, delays, costs, and actions.
- **Request Body**:
```json
{
  "query": "Show me all high-risk road projects in Bihar over ₹500 crore"
}
```
- **Example Response**:
```json
{
  "success": true,
  "answer": "There are 2 high-risk road projects matching your criteria in Bihar over ₹500 crore.",
  "projects": [
    {
      "id": "NH27-BR-001",
      "name": "NH-27 4-Laning (Forbesganj - Muzaffarpur)",
      "cost": 850,
      "riskLevel": "HIGH",
      "delayDays": 47,
      "riskReason": "Fund-Progress Mismatch"
    }
  ]
}
```

---

## 4. NLP Delay Reason Classifier APIs

### `POST /api/delay/classify`
- **Purpose**: Analyzes textual official delay remarks and classifies them into structured risk categories.
- **Request Body**:
```json
{
  "projectId": "NH27-BR-001",
  "remark": "Delay due to pending forest clearance from state forest department."
}
```
- **Example Response**:
```json
{
  "success": true,
  "classification": {
    "category": "STATUTORY_ENVIRONMENTAL_CLEARANCE",
    "label": "Statutory & Environmental Clearance",
    "confidence": 0.95
  }
}
```

### `POST /api/delay/classify-batch`
- **Purpose**: Batch classifies multiple project delay remarks.
- **Request Body**:
```json
{
  "remarks": [
    { "projectId": "P001", "remark": "Land acquisition case pending in district court" },
    { "projectId": "P002", "remark": "Contractor mobilization is slow" }
  ]
}
```
- **Example Response**:
```json
{
  "success": true,
  "results": [
    { "projectId": "P001", "category": "LAND_ACQUISITION_LITIGATION", "label": "Land Acquisition / Litigation", "confidence": 0.92 },
    { "projectId": "P002", "category": "CONTRACTOR_MOBILIZATION", "label": "Contractor Capacity & Mobilization", "confidence": 0.91 }
  ]
}
```

---

## 5. Fund vs Physical Progress Mismatch Detector API

### `POST /api/risk/mismatch`
- **Purpose**: Evaluates discrepancy between financial expenditure and reported physical milestone progress.
- **Request Body**:
```json
{
  "projectId": "OD-CRP-001",
  "totalBudget": 800,
  "expenditure": 680,
  "physicalProgress": 40
}
```
- **Example Response**:
```json
{
  "success": true,
  "analysis": {
    "expenditurePercentage": 85,
    "physicalProgressPercentage": 40,
    "mismatchPercentage": 45,
    "riskLevel": "HIGH",
    "flagged": true,
    "reason": "85% of funds have been utilized while physical progress is only 40%.",
    "recommendation": "Recommend project review and physical site audit by nodal technical team."
  }
}
```

---

## 6. Pre-Approval Risk Simulator API

### `POST /api/simulator/pre-approval`
- **Purpose**: Forecasts baseline risk before administrative approval based on sector, state, agency, and project scale.
- **Request Body**:
```json
{
  "sector": "Energy",
  "state": "Odisha",
  "agency": "NTPC",
  "estimatedCost": 2500,
  "projectDurationMonths": 36
}
```
- **Example Response**:
```json
{
  "success": true,
  "prediction": {
    "riskLevel": "HIGH",
    "predictedDelayMonths": 12,
    "majorRiskFactor": "Environmental Clearances & Contractor Capacity",
    "historicalAverageDelayMonths": 18,
    "recommendation": "Consider completing critical land and statutory clearances in Odisha before formal administrative approval."
  }
}
```

---

## 7. What-If Delay Impact Simulator API

### `POST /api/simulator/delay-impact`
- **Purpose**: Simulates timeline escalation impact on completion date and capital outlay overruns.
- **Request Body**:
```json
{
  "projectId": "NH27-BR-001",
  "additionalDelayMonths": 6
}
```
- **Example Response**:
```json
{
  "success": true,
  "simulation": {
    "originalCompletionDate": "2028-06-30",
    "newCompletionDate": "2028-12-31",
    "additionalCostPercentage": 12.9,
    "estimatedAdditionalCost": 110.4,
    "riskLevel": "HIGH"
  }
}
```

---

## 8. Projects REST API

### `GET /api/projects`
- **Query Parameters**: `state`, `riskLevel`, `sector`
- **Response**:
```json
{
  "success": true,
  "total": 6,
  "projects": [ ... ]
}
```

### `POST /api/projects`
- **Request Body**: Project JSON payload
- **Response**: `{ "success": true, "projectId": "NIV-2026-PRJ-8812", "trackingNumber": "TRK-98124012" }`

---

## 9. Report Generation API

### `POST /api/reports/generate`
- **Request Body**: `{ "projectId": "NH27-BR-001", "reportType": "RISK_ASSESSMENT" }`
- **Response**: `{ "success": true, "reportId": "REP-8912", "status": "GENERATED", "downloadUrl": null }`
