import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import { Link, useNavigate } from 'react-router-dom';
import dashboardApi from '../api/dashboardApi';
import projectApi from '../api/projectApi';
import simulatorApi from '../api/simulatorApi';

// Modal Components for the 6 AI Features
import AlertsModal from '../components/AlertsModal';
import AIChatModal from '../components/AIChatModal';
import DelayClassifierModal from '../components/DelayClassifierModal';
import MismatchDetectorModal from '../components/MismatchDetectorModal';
import PreApprovalSimulatorModal from '../components/PreApprovalSimulatorModal';
import WhatIfSimulatorModal from '../components/WhatIfSimulatorModal';
import ReportsView from '../components/ReportsView';
import ProjectDashboard from '../components/ProjectDashboard';

const Dashboard = () => {
  const navigate = useNavigate();

  // Overview Data
  const [overview, setOverview] = useState({
    systemStatus: "OPERATIONAL",
    lastUpdated: "08 Sep 2026, 21:50 IST",
    summary: {
      totalProjects: 186,
      onTrack: 124,
      atRisk: 44,
      critical: 18,
      totalMonitoredOutlay: "₹48.2 Lakh Crore",
      projectsAtRisk: "118 Projects"
    },
    riskDistribution: { low: 124, medium: 26, high: 18, critical: 18 },
    stateRiskOverview: []
  });

  // Projects table data
  const [attentionProjects, setAttentionProjects] = useState([]);
  const [fontScale, setFontScale] = useState(1);

  // Active Modals state
  const [activeModal, setActiveModal] = useState(null); // 'alerts' | 'chat' | 'delay' | 'mismatch' | 'preapproval' | 'whatif' | 'reports'

  // Embedded Slider State for Feature #6 (What-If Simulator inline preview)
  const [inlineDelayMonths, setInlineDelayMonths] = useState(6);
  const [inlineSimResult, setInlineSimResult] = useState({
    estimatedAdditionalCost: 110.4,
    additionalCostPercentage: 12.9,
    newCompletionDate: "2028-12-31"
  });

  useEffect(() => {
    async function initData() {
      try {
        const data = await dashboardApi.getOverview();
        if (data && data.summary) {
          setOverview(data);
        }

        const projRes = await projectApi.getProjects();
        if (projRes && projRes.projects) {
          setAttentionProjects(projRes.projects);
        }
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
      }
    }
    initData();
  }, []);

  // Update inline slider preview
  useEffect(() => {
    async function updateInlineSim() {
      try {
        const res = await simulatorApi.simulateDelayImpact({
          projectId: 'NH27-BR-001',
          additionalDelayMonths: inlineDelayMonths
        });
        if (res.success) {
          setInlineSimResult(res.simulation);
        }
      } catch (e) {}
    }
    const t = setTimeout(updateInlineSim, 100);
    return () => clearTimeout(t);
  }, [inlineDelayMonths]);

  const handleFontIncrease = () => {
    const newScale = Math.min(1.3, fontScale + 0.1);
    setFontScale(newScale);
    document.documentElement.style.fontSize = `${newScale * 100}%`;
  };

  const handleFontDecrease = () => {
    const newScale = Math.max(0.85, fontScale - 0.1);
    setFontScale(newScale);
    document.documentElement.style.fontSize = `${newScale * 100}%`;
  };

  return (
    <div className="dashboard-page-wrapper">
      {/* ===== Header Navigation (Task 7) ===== */}
      <header className="site-header">
        <div className="header-left">
          <Link to="/" className="logo-badge" style={{ textDecoration: 'none' }}>
            <img src="NIVARA logo.png" alt="NIVARA Logo" className="logo-img" />
          </Link>
          <div className="header-titles">
            <p className="header-eyebrow">Government of India</p>
            <p className="header-title">National Infrastructure Vigilance and Risk Analytics</p>
          </div>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <a href="#projects-attention" className="nav-link">Projects</a>
          <a href="#project-dashboard" className="nav-link">Dashboard</a>
          <a href="#ai-features" className="nav-link">Risk Intelligence</a>
          <Link to="/reports" className="nav-link">Reports</Link>
        </nav>

        <div className="header-right">
          <Link to="/login" className="btn btn-add">
            + Add Project / Update
          </Link>
          <button type="button" className="btn btn-reports" onClick={() => setActiveModal('reports')}>
            Reports
          </button>
          <div className="font-controls">
            <button type="button" className="font-btn" onClick={handleFontDecrease}>A-</button>
            <button type="button" className="font-btn" onClick={handleFontIncrease}>A+</button>
          </div>
        </div>
      </header>

      {/* ===== Main Page Container ===== */}
      <main className="page-container">

        {/* ===== HERO SECTION (Task 1 & Task 2) ===== */}
        <section className="hero">
          <div className="hero-left">
            <div className="status-badge-row">
              <div className="system-status-pill">
                <span className="status-pulse-dot"></span>
                ● SYSTEM STATUS: OPERATIONAL
              </div>
              <div className="timestamp-pill">
                Data last updated: {overview.lastUpdated}
              </div>
            </div>

            <h1 className="hero-title">NIVARA: National Infrastructure Vigilance and Risk Analytics</h1>

            <p className="hero-subtitle">
              Next-Generation Predictive Governance &amp; Infrastructure Intelligence Platform
              for Central Sector Mega Projects, backed by advanced ML forecasting.
            </p>

            <div className="hero-supporting-line">
              AI-powered monitoring, early warning and decision support for Central Sector infrastructure projects.
            </div>

            <div className="stat-cards">
              <div className="stat-card">
                <p className="stat-label">Total Monitored Outlay</p>
                <p className="stat-value">{overview.summary.totalMonitoredOutlay}</p>
              </div>
              <div
                className="stat-card stat-card--risk"
                style={{ cursor: 'pointer' }}
                title="Click to view AI Prediction Reports"
                onClick={() => setActiveModal('reports')}
              >
                <p className="stat-label">Projects at Risk</p>
                <p className="stat-value stat-value--risk">{overview.summary.projectsAtRisk}</p>
                <span style={{ fontSize: '11.5px', color: 'var(--color-red)', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View Prediction Reports &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: Live Infrastructure Telemetry Monitor Box (Task 1 Replacement) */}
          <div className="hero-right">
            <div className="hero-visual-card">
              <div className="visual-card-top">
                <div className="visual-badge">
                  <span className="status-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                  LIVE NATIONAL TELEMETRY RADAR
                </div>
                <span className="visual-accuracy">99.4% Forecast Accuracy</span>
              </div>

              {/* Animated Live Telemetry SVG Curve */}
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: '140px' }} fill="none">
                <defs>
                  <linearGradient id="heroChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="heroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9"/>
                    <stop offset="50%" stopColor="#14b8a6"/>
                    <stop offset="100%" stopColor="#38bdf8"/>
                  </linearGradient>
                </defs>

                <line x1="20" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.1)"/>

                <path d="M 30 135 Q 100 115, 160 100 T 290 75 T 400 42 T 470 28 L 470 140 L 30 140 Z" fill="url(#heroChartGrad)"/>
                <path d="M 30 135 Q 100 115, 160 100 T 290 75 T 400 42 T 470 28" stroke="url(#heroLineGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

                <circle cx="30" cy="135" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="160" cy="100" r="4.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="290" cy="75" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="400" cy="42" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5"/>
                <circle cx="470" cy="28" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>

                <text x="35" y="125" fill="#94a3b8" fontSize="10">Baseline</text>
                <text x="265" y="62" fill="#94a3b8" fontSize="10">Telemetry Influx</text>
                <text x="375" y="28" fill="#38bdf8" fontSize="10" fontWeight="700">AI Forecast</text>
              </svg>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Central Sector</span>
                  <strong style={{ color: '#ffffff', fontSize: '13px' }}>186 Projects</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Risk Signals</span>
                  <strong style={{ color: '#f87171', fontSize: '13px' }}>118 Mitigated</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Model Latency</span>
                  <strong style={{ color: '#38bdf8', fontSize: '13px' }}>12ms</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TASK 3: NATIONAL INFRASTRUCTURE RISK OVERVIEW ===== */}
        <section className="dashboard-section" id="risk-overview">
          <div className="section-header">
            <div className="section-title-row">
              <h2 className="section-title">National Infrastructure Risk Overview</h2>
              <span className="demo-pill">Demo Data</span>
            </div>
            <p className="section-subtitle">
              Real-time aggregated health breakdown across 186 monitored Central Sector Mega Projects.
            </p>
          </div>

          {/* 4 Clean Statistic Cards */}
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-card-header">
                <span className="overview-card-title">Total Projects</span>
                <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>100%</span>
              </div>
              <div className="overview-card-val">{overview.summary.totalProjects}</div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Monitored Central Sector Infrastructure</span>
            </div>

            <div className="overview-card">
              <div className="overview-card-header">
                <span className="overview-card-title">On Track</span>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>66.7%</span>
              </div>
              <div className="overview-card-val" style={{ color: '#16a34a' }}>{overview.summary.onTrack}</div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Progressing within scheduled timeline</span>
            </div>

            <div className="overview-card">
              <div className="overview-card-header">
                <span className="overview-card-title">At Risk</span>
                <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>23.7%</span>
              </div>
              <div className="overview-card-val" style={{ color: '#ea580c' }}>{overview.summary.atRisk}</div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Moderate slippage / warning indicators</span>
            </div>

            <div className="overview-card">
              <div className="overview-card-header">
                <span className="overview-card-title">Critical</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>9.7%</span>
              </div>
              <div className="overview-card-val" style={{ color: '#dc2626' }}>{overview.summary.critical}</div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Severe delay &amp; cost escalation risk</span>
            </div>
          </div>

          {/* Visual Risk Distribution Bar */}
          <div className="risk-dist-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>National Portfolio Risk Level Distribution</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>186 Projects Analyzed</span>
            </div>

            <div className="dist-bar-track">
              <div className="dist-bar-seg" style={{ width: '66.7%', background: '#10b981' }} title="Low Risk: 124 projects"></div>
              <div className="dist-bar-seg" style={{ width: '14.0%', background: '#eab308' }} title="Medium Risk: 26 projects"></div>
              <div className="dist-bar-seg" style={{ width: '9.7%', background: '#f97316' }} title="High Risk: 18 projects"></div>
              <div className="dist-bar-seg" style={{ width: '9.7%', background: '#dc2626' }} title="Critical Risk: 18 projects"></div>
            </div>

            <div className="dist-legend">
              <div className="dist-legend-item">
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                <span>Low Risk: <strong>124 Projects (66.7%)</strong></span>
              </div>
              <div className="dist-legend-item">
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
                <span>Medium Risk: <strong>26 Projects (14.0%)</strong></span>
              </div>
              <div className="dist-legend-item">
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }}></span>
                <span>High Risk: <strong>18 Projects (9.7%)</strong></span>
              </div>
              <div className="dist-legend-item">
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }}></span>
                <span>Critical Risk: <strong>18 Projects (9.7%)</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PROJECT DASHBOARD ===== */}
        <ProjectDashboard projects={attentionProjects} onInspect={() => setActiveModal('reports')} />

        {/* ===== TASK 4: THE SIX ACTUAL NIVARA AI FEATURES ===== */}
        <section className="dashboard-section" id="ai-features">
          <div className="section-header">
            <h2 className="section-title">AI-Powered Infrastructure Intelligence</h2>
            <p className="section-subtitle">
              Operational machine learning engines for automated anomaly detection, NLP remarks parsing, and delay impact simulation.
            </p>
          </div>

          <div className="ai-features-grid">

            {/* Feature 1 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <h3 className="ai-feature-title">1. AI-Powered Early Warning &amp; Alert System</h3>
                <p className="ai-feature-desc">
                  Automatically monitors project indicators and raises alerts when abnormal spending, progress or reporting delays are detected.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('alerts')}>
                <span>View Alerts</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 2 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="ai-feature-title">2. Interactive Dashboard with AI Chatbot</h3>
                <p className="ai-feature-desc">
                  Ask questions in natural language and instantly retrieve project risks, delays, costs and performance insights.
                </p>
                <div className="query-example-pill">
                  “Show me all high-risk road projects in Bihar over ₹500 crore”
                </div>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('chat')}>
                <span>Open AI Dashboard</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 3 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="ai-feature-title">3. NLP-Based Delay Reason Classifier</h3>
                <p className="ai-feature-desc">
                  Automatically analyzes officials' delay remarks and classifies them into categories such as land acquisition, litigation, clearance, contractor issues and funding.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('delay')}>
                <span>Analyze Delays</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 4 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                </div>
                <h3 className="ai-feature-title">4. Fund vs Physical Progress Mismatch Detector</h3>
                <p className="ai-feature-desc">
                  Compares financial expenditure with reported physical progress and flags suspicious or inconsistent project performance.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('mismatch')}>
                <span>Detect Mismatches</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 5 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="ai-feature-icon" style={{ backgroundColor: '#fae8ff', color: '#a21caf' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <span className="feature-prevent-badge">PREVENT BEFORE IT STARTS</span>
                </div>
                <h3 className="ai-feature-title">5. Pre-Approval Risk Simulator</h3>
                <p className="ai-feature-desc">
                  Predicts potential project risks before approval using historical patterns across sector, state, agency and project size.
                </p>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('preapproval')}>
                <span>Simulate Project Risk</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Feature 6 */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="ai-feature-title">6. What-If Delay Impact Simulator</h3>
                <p className="ai-feature-desc">
                  Simulate additional delays and instantly see their estimated impact on completion date and project cost.
                </p>

                {/* Inline Slider Demo Element */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    <span>Land Clearance Delay</span>
                    <span style={{ color: '#ea580c' }}>{inlineDelayMonths} months</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={inlineDelayMonths}
                    onChange={e => setInlineDelayMonths(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Estimated Cost Impact</span>
                      <strong style={{ color: '#c2410c' }}>+₹{inlineSimResult.estimatedAdditionalCost} Cr ({inlineSimResult.additionalCostPercentage}%)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>New Completion Date</span>
                      <strong style={{ color: '#0f172a' }}>{inlineSimResult.newCompletionDate}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" className="btn-feature-action" onClick={() => setActiveModal('whatif')}>
                <span>Run Simulation</span>
                <span>&rarr;</span>
              </button>
            </div>

          </div>
        </section>

        {/* ===== TASK 5: PROJECTS REQUIRING ATTENTION ===== */}
        <section className="dashboard-section" id="projects-attention">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="section-title-row">
                <h2 className="section-title">Projects Requiring Attention</h2>
                <span className="demo-pill">Sample Data</span>
              </div>
              <p className="section-subtitle">
                High-priority infrastructure assets flagged for immediate ministerial review and intervention.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-reports"
              onClick={() => setActiveModal('reports')}
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
            >
              View All Projects &rarr;
            </button>
          </div>

          <div className="table-container-card">
            <table className="gov-dashboard-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Ministry / Agency</th>
                  <th>State</th>
                  <th>Risk Level</th>
                  <th>Delay</th>
                  <th>Primary Risk Factor</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attentionProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{p.id}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{p.agency}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{p.state}</span>
                    </td>
                    <td>
                      <span className={`risk-level-pill ${p.riskLevel.toLowerCase()}`}>
                        {p.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#b91c1c' }}>+{p.delayDays} days</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#334155' }}>{p.primaryRisk}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setActiveModal('reports')}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== TASK 6: NATIONAL INFRASTRUCTURE RISK MAP ===== */}
        <section className="dashboard-section" id="risk-map">
          <div className="section-header">
            <div className="section-title-row">
              <h2 className="section-title">National Infrastructure Risk Map</h2>
              <span className="demo-pill">Demo Visual</span>
            </div>
            <p className="section-subtitle">
              Spatial distribution of project risks across Indian States and Union Territories.
            </p>
          </div>

          <div className="risk-map-card">
            {/* Map Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>State &amp; Corridor Risk Clusters</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: '700' }}>● Critical (18)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', fontWeight: '700' }}>● High (44)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ca8a04', fontWeight: '700' }}>● Medium (52)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '700' }}>● Low (72)</span>
              </div>
            </div>

            {/* State Risk Placeholder Chips Grid */}
            <div className="map-placeholder-grid">
              {overview.stateRiskOverview.map((item, idx) => (
                <div key={idx} className="state-risk-chip">
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{item.state} State Cluster</strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Primary Concern: {item.primaryIssue}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="risk-level-pill critical" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {item.criticalCount} Critical
                    </span>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{item.activeProjects} Projects</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <p className="footer-copy">
          © Content Owned by Ministry of Statistics and Programme Implementation, Government of India.
          Developed by National Informatics Centre (NIC).
        </p>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Standard Government of India Open Data License."); }}>Terms of Service</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: NIVARA Platform Data Privacy Protocol."); }}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Helpdesk / Support: Contact support@nivara.gov.in"); }}>Helpdesk / Support</a>
        </div>
      </footer>

      {/* ===== Interactive AI Modals (Tasks 4, 8 & 13) ===== */}
      <AlertsModal isOpen={activeModal === 'alerts'} onClose={() => setActiveModal(null)} />
      <AIChatModal isOpen={activeModal === 'chat'} onClose={() => setActiveModal(null)} />
      <DelayClassifierModal isOpen={activeModal === 'delay'} onClose={() => setActiveModal(null)} />
      <MismatchDetectorModal isOpen={activeModal === 'mismatch'} onClose={() => setActiveModal(null)} />
      <PreApprovalSimulatorModal isOpen={activeModal === 'preapproval'} onClose={() => setActiveModal(null)} />
      <WhatIfSimulatorModal isOpen={activeModal === 'whatif'} onClose={() => setActiveModal(null)} />

      {/* ===== Reports Modal ===== */}
      {activeModal === 'reports' && (
        <div className="reports-modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('reports-modal-backdrop')) setActiveModal(null); }}>
          <div className="reports-modal-card">
            <div className="reports-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div className="modal-header-titles">
                  <h2>NIVARA AI Predictive Risk &amp; Delay Reports</h2>
                  <p>Machine learning early-warning engine for Central Sector Mega Projects</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)} title="Close Reports">&times;</button>
            </div>
            <ReportsView isModal={true} onClose={() => setActiveModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
