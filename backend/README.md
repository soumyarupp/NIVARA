# 🏛️ NIVARA - National Infrastructure Verification & Accountability Reporting Authority

> **Smart India Hackathon (SIH) Backend Platform**  
> Built strictly adhering to the official **MoSPI / IPMD (Infrastructure and Project Monitoring Division) Concept Note**.  
> An enterprise-grade, explainable AI-powered infrastructure project monitoring and risk surveillance platform.

---

## 📋 System Architecture & Workflow

```
                        IPMD / Super Admin
                                ↓
                          Line Ministry
                                ↓
                     Implementation Agency
                                ↓
                             Project
                                ↓
                          Nodal Officer
                                ↓
                    Multiple Reporting Officers
                                ↓
                     Monthly Progress Reports
                                ↓
      ┌─────────────────────────┴─────────────────────────┐
      ↓                                                   ↓
Explainable Multi-Factor                             NLP Delay
   Risk Engine                                       Classifier
      ↓                                                   ↓
Fund-Progress Mismatch                               Early Warning
   Detector                                             Alerts
      └─────────────────────────┬─────────────────────────┘
                                ↓
       Nodal Officer / Ministry Officer / IPMD Central Authority
                                ↓
              Automated Email & In-App Notifications
```

---

## ⚡ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **Security & Auth**: Argon2id password hashing, Rotating JWTs, HttpOnly Cookies, Role-Based Access Control (RBAC), Helmet, CORS
- **File Uploads**: Multer (Supporting up to 5 files at 40MB each)
- **Email & Alerts**: Nodemailer (Automated HTML dispatches for High/Critical alerts)
- **Scheduled Background Tasks**: node-cron (Daily 90-day reporting delay & risk recalculations)
- **Validation**: express-validator & Zod

---

## 👥 User Roles & Permissions

| Role | Scope | Key Permissions |
|---|---|---|
| **`SUPER_ADMIN`** | System Wide | Full administrative access, manages ministries & users, views national dashboards & audits. |
| **`IPMD_ADMIN`** | National Monitoring | Accesses all national projects, views aggregate risk heatmaps, monitors clearance delays & time/cost overruns. |
| **`MINISTRY_OFFICER`** | Line Ministry | Oversees projects under their ministry (e.g. MoRTH, MoR), assigns/manages Nodal Officers, tracks project progress. |
| **`IMPLEMENTATION_AGENCY`** | Implementing Agency | Creates CUF projects, manages drafts, submits projects for approval, assigns Nodal & Reporting Officers, manages tenders & milestones. |
| **`NODAL_OFFICER`** | Assigned Projects | Reviews monthly reports, acknowledges and resolves early warning alerts, coordinates clearance escalations. |
| **`REPORTING_OFFICER`** | Assigned Projects | Submits monthly physical and financial progress, inputs delay remarks, uploads field photos & documents. |

---

## 🔑 Pre-Seeded Development Credentials

Run `npm run seed` to populate pre-configured test accounts across all roles:

| Role | Email | Password | Scope / Organization |
|---|---|---|---|
| **Super Admin** | `super.admin@nivara.gov.in` | `Admin@12345` | Global Central Authority |
| **IPMD Admin** | `ipmd.admin@nivara.gov.in` | `Admin@12345` | IPMD Central Division |
| **Ministry Officer** | `ministry.admin@morth.gov.in` | `Officer@12345` | Ministry of Road Transport (MoRTH) |
| **Agency Admin** | `agency.admin@nhai.gov.in` | `Officer@12345` | NHAI (Implementing Agency) |
| **Nodal Officer** | `nodal.officer@nhai.gov.in` | `Officer@12345` | Flagship Project (NH-27 Bihar) |
| **Reporting Officer** | `reporting.officer@nhai.gov.in` | `Officer@12345` | Field Reporting Officer |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env` file in the root directory:
```ini
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://<USER>:<PASS>@cluster0.mongodb.net/nivara_data
JWT_ACCESS_SECRET=d8f7e2a6b4c190835fe7a9b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2
JWT_REFRESH_SECRET=a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
MAIL_FROM=NIVARA Early Warning <noreply@nivara.gov.in>
```

### 3. Seed Database with SIH Demo Dataset
```bash
npm run seed
```

### 4. Run Automated Test Suite (All 31 Tests)
```bash
npm test
```

### 5. Start Backend Server
```bash
npm run dev
# Server runs on: http://localhost:5001
# Health Check:  http://localhost:5001/api/health
```

---

## 🌟 Core AI & Analytics Modules

### 1. Explainable Multi-Factor Risk Engine (`services/riskEngine.js`)
Calculates an explainable composite risk score ($0 - 100$) and assigns a risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) using weighted dimensions:
- **Financial vs Physical Mismatch (35%)**: Discrepancy between expenditure % and on-ground completion.
- **Physical Progress Gap (25%)**: Lag between scheduled and actual milestones.
- **Pending Critical Clearances (10%)**: Statutory forest, environmental, or railway approvals pending.
- **Land Acquisition Possession (10%)**: Percentage of right-of-way pending possession.
- **Time Overrun (10%)**: Official MoSPI formula computing timeline slippage.
- **Cost Overrun (5%)**: Cost escalation relative to original/revised sanction.
- **Reporting Inactivity (5%)**: Overdue monthly submissions.

### 2. NLP Delay Reason Classifier (`services/delayClassifier.js`)
Analyzes plain-text progress remarks and classifies delay reasons into official MoSPI categories:
- `FOREST_CLEARANCE`
- `ENVIRONMENTAL_CLEARANCE`
- `LAND_ACQUISITION`
- `LITIGATION`
- `FUND_SHORTAGE`
- `CONTRACTOR_ISSUE`
- `UTILITY_SHIFTING`
- `APPROVAL_DELAY`
- `WEATHER`
- `OTHER`

### 3. Fund vs Physical Progress Mismatch Detector (`services/mismatchDetector.js`)
Identifies financial over-utilization when funds are expended without corresponding physical completion:
$$\text{Difference} = \text{FinancialProgress (\%)} - \text{PhysicalProgress (\%)}$$
Triggers `HIGH` severity reviews when difference exceeds $30\%$.

### 4. Pre-Approval Risk Simulator (`api/pre-approval/predict`)
Allows authorities to simulate the risk score, predicted delay months, and major bottlenecks of proposed projects before fund sanction.

### 5. What-If Delay & Cost Escalator (`api/simulator/project/:id`)
Allows interactive simulation of timeline delays and compound cost escalations using dynamic interest rates.

### 6. Natural Language Query Chatbot (`api/chatbot/query`)
Parses natural language requests into structured intents (`SEARCH_PROJECTS`, `DASHBOARD_SUMMARY`, `DELAY_SUMMARY`, `RISK_SUMMARY`) and queries MongoDB safely without dynamic `eval`.

---

## 📡 API Reference Overview

Base URL: `http://localhost:5001/api`

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` - Officer login (returns JWT token & HttpOnly cookie)
- `GET /api/auth/me` - Get current officer profile

### 🏗️ Projects & CUF Workflow (`/api/projects`)
- `POST /api/projects` - Create project with CUF fields
- `POST /api/projects/draft` - Save incomplete project draft
- `PATCH /api/projects/:id/draft` - Update project draft
- `POST /api/projects/:id/submit` - Validate and submit project for review
- `GET /api/projects` - Paginated & filtered project list (`?page=1&limit=20&search=NH-27&state=Bihar&sector=ROAD&riskLevel=HIGH`)
- `GET /api/projects/:id` - Full project details with clearances, tenders, milestones, land, and reports
- `POST /api/projects/:id/reporting-officers` - Add Reporting Officer to project
- `DELETE /api/projects/:id/reporting-officers/:userId` - Remove Reporting Officer from project
- `GET /api/projects/:id/reporting-officers` - List assigned Reporting Officers
- `PATCH /api/projects/:id/nodal-officer` - Assign/update Nodal Officer

### 📊 Monthly Progress Reports (`/api/reports`)
- `POST /api/reports` - Submit monthly progress (calculates financials, runs delay classifier, mismatch detector, risk engine, and creates alerts)
- `GET /api/reports/project/:projectId` - Historical progress reports

### 📑 Project Sub-Components
- `GET | POST /api/projects/:id/land` - Land details
- `GET | POST /api/projects/:id/clearances` - Clearances
- `GET | POST /api/projects/:id/tenders` - Tenders
- `GET | POST /api/projects/:id/milestones` - Milestones & timeline
- `GET | POST /api/projects/:id/partners` - Partners
- `GET | POST /api/projects/:id/documents` - Multer file uploads (PDF/DOCX/Photos up to 40MB)

### 🚨 Early Warning Alerts & Notifications
- `GET /api/alerts` - List active risk alerts
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert with remediation remarks
- `GET /api/notifications` - In-app officer notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

### 📈 National Dashboard Aggregations (`/api/dashboard`)
- `GET /api/dashboard/summary` - Total projects, ongoing, completed, high-risk, total cost & expenditure
- `GET /api/dashboard/risk-distribution` - Risk breakdown (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `GET /api/dashboard/delay-reasons` - NLP delay causes breakdown
- `GET /api/dashboard/state-summary` - State-wise metrics
- `GET /api/dashboard/sector-summary` - Sector-wise metrics
- `GET /api/dashboard/ministry-summary` - Ministry-wise metrics

### 🤖 AI Simulators & Chatbot
- `POST /api/pre-approval/predict` - Pre-approval feasibility simulator
- `POST /api/simulator/project/:id` - What-if delay & cost escalation simulator
- `POST /api/chatbot/query` - Safe natural language query engine

---

## 🎯 SIH Flagship Demo Scenario: "4-Laning of NH-27, Bihar"

1. **Login** as Reporting Officer (`reporting.officer@nhai.gov.in` / `Officer@12345`).
2. **Submit Monthly Report**:
   - Original Sanctioned Cost: **₹850 Cr**
   - Expenditure: **₹790 Cr**
   - Physical Progress: **55%** (Planned: 70%)
   - Delay Remark: *"Forest clearance pending from state forest department."*
3. **Backend Automatically Executes**:
   - Financial progress calculated: **92.94%**
   - Fund-Progress Mismatch detected: **37.94%** (`HIGH` severity)
   - NLP Classifier maps remark to: **`FOREST_CLEARANCE`** (Confidence 98%)
   - Multi-Factor Risk Engine evaluates: **Score 78 / 100 (`HIGH` Risk)**
   - Generates `FUND_PROGRESS_MISMATCH` & `HIGH_RISK` alerts.
   - Dispatches in-app notification & Nodemailer HTML email to Nodal Officer.
4. **Login** as Nodal Officer (`nodal.officer@nhai.gov.in` / `Officer@12345`):
   - Views the High Risk Alert on dashboard and acknowledges it.
5. **Interactive Chatbot Query**:
   - Send: `"Show all high risk road projects in Bihar above 500 crore"`
   - Chatbot parses filters: `state: Bihar`, `sector: ROAD`, `riskLevel: HIGH`, `minCost: 500` and returns the project breakdown.
6. **What-If Delay Simulator**:
   - Adjust slider by +6 months with 2.5% escalation rate $\rightarrow$ Predicts new completion date and projected ₹10.63 Cr cost escalation.

---

## 🛡️ License
Built for the **Smart India Hackathon (SIH)**. Developed by the NIVARA Team.
