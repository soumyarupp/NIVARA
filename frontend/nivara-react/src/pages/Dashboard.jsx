import React, { useEffect } from 'react';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  useEffect(() => {
    /**
 * script.js
 * -----------------------------------------------------------------------
 * Handles:
 *  - Pulling data from api.js and rendering it into the page
 *  - Font size (A- / A+) accessibility controls
 * -----------------------------------------------------------------------
 */

// ---- Icon SVGs for each feature card ----
const ICONS = {
  radar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>
          </svg>`,
  simulator: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
          </svg>`,
  telemetry: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 15l3-4 3 2 4-6"/>
          </svg>`,
  gateway: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/>
          </svg>`
};

/**
 * Renders the two stat cards in the hero section.
 */
async function renderStats() {
  const stats = await NivaraAPI.getStats();
  document.getElementById("stat-outlay").textContent = stats.totalMonitoredOutlay;
  document.getElementById("stat-risk").textContent = stats.activeRiskSignals;
}

/**
 * Renders the 4 feature cards on the right side of the hero.
 */
async function renderFeatures() {
  const features = await NivaraAPI.getFeatures();
  const grid = document.getElementById("feature-grid");

  grid.innerHTML = features.map(feature => `
    <div class="feature-card">
      <div class="feature-icon">${ICONS[feature.icon] || ""}</div>
      <h3 class="feature-title">${feature.title}</h3>
      <p class="feature-desc">${feature.description}</p>
      ${feature.icon === "radar" ? `
        <button class="btn-view-prediction" style="margin-top: 10px; width: fit-content;" onclick="ReportsUI.openModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Generate Report
        </button>
      ` : ""}
    </div>
  `).join("");
}

/**
 * Simple accessibility font-size control (A- / A+ buttons).
 */
function setupFontControls() {
  const root = document.documentElement;
  let fontScale = 1;
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.3;
  const STEP = 0.1;

  document.getElementById("font-increase").addEventListener("click", () => {
    fontScale = Math.min(MAX_SCALE, fontScale + STEP);
    root.style.fontSize = `${fontScale * 100}%`;
  });

  document.getElementById("font-decrease").addEventListener("click", () => {
    fontScale = Math.max(MIN_SCALE, fontScale - STEP);
    root.style.fontSize = `${fontScale * 100}%`;
  });
}

// ---- Initialize page ----
// document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderFeatures();
  setupFontControls();

  // Navigation to Login / Add Project portal
  const btnAdd = document.querySelector(".btn-add");
  if (btnAdd) {
    btnAdd.addEventListener("click", (e) => {
      if (btnAdd.tagName === "BUTTON") {
        e.preventDefault();
        /* window.location.href = "login.html" */;
      }
    });
  }
// });

  }, []);

  return (
    <>
      {/* ===== Header ===== */}
  <header className="site-header">
    <div className="header-left">
      <div className="logo-badge">
        <img src="NIVARA logo.png" alt="NIVARA Logo" className="logo-img" />
      </div>
      <div className="header-titles">
        <p className="header-eyebrow">Government of India</p>
        <p className="header-title">National Infrastructure Vigilance and Risk Analytics</p>
      </div>
    </div>

    <nav className="header-nav">
      <a href="#" className="nav-link">Home</a>
      <a href="#" className="nav-link">Publications</a>
      <a href="#" className="nav-link">Dashboard</a>
    </nav>

    <div className="header-right">
      <button className="btn btn-add">Add Project / Update</button>
      <button className="btn btn-reports">Reports</button>
      <div className="font-controls">
        <button className="font-btn" id="font-decrease">A-</button>
        <button className="font-btn" id="font-increase">A+</button>
      </div>
    </div>
  </header>

  {/* ===== Main Hero Section ===== */}
  <main>
    <section className="hero">
      <div className="hero-left">
        <span className="hero-pill">
          <svg className="pill-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
          </svg>
          National Infrastructure Intelligence Portal
        </span>

        <h1 className="hero-title">NIVARA: National Infrastructure Vigilance and Risk Analytics</h1>

        <p className="hero-subtitle">
          Next-Generation Predictive Governance &amp; Infrastructure Intelligence Platform
          for Central Sector Mega Projects, backed by advanced ML forecasting.
        </p>

        <div className="stat-cards">
          <div className="stat-card stat-card--outlay">
            <p className="stat-label">Total Monitored Outlay</p>
            <p className="stat-value" id="stat-outlay">₹ 48.2 Lakh Cr</p>
          </div>
          <div className="stat-card stat-card--risk" style={{cursor: 'pointer'}} title="Click to view AI Prediction Reports" onClick="ReportsUI.openModal()">
            <p className="stat-label">Active Risk Signals</p>
            <p className="stat-value stat-value--risk" id="stat-risk">118 Projects</p>
            <span style={{fontSize: '11.5px', color: 'var(--color-red)', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
              View Prediction Reports &rarr;
            </span>
          </div>
        </div>
      </div>

      <div className="hero-right" id="feature-grid">
        {/* Feature cards injected by script.js */}
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
      <a href="#">Terms of Service</a>
      <a href="#">Privacy Policy</a>
      <a href="#">Helpdesk / Support</a>
    </div>
  </footer>

  {/* ===== Reports Modal (AI Predictive Risk & Delay Reports) ===== */}
  <div className="reports-modal-backdrop" id="reports-modal" role="dialog" aria-modal="true" aria-labelledby="reports-modal-title">
    <div className="reports-modal-card">

      {/* Modal Top Header */}
      <div className="reports-modal-header">
        <div className="modal-header-left">
          <div className="modal-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div className="modal-header-titles">
            <h2 id="reports-modal-title">NIVARA AI Predictive Risk &amp; Delay Reports</h2>
            <p>Machine learning early-warning engine for Central Sector Mega Projects</p>
          </div>
        </div>
        <button className="modal-close-btn" id="reports-modal-close" title="Close Reports (Esc)" aria-label="Close Reports">&times;</button>
      </div>

      {/* Modal Scrollable Body */}
      <div className="reports-modal-body">

        {/* VIEW 1: PROJECTS DIRECTORY TABLE */}
        <div id="reports-list-view">
          <div className="reports-directory-toolbar">
            <div className="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" id="reports-search-input" className="reports-search-input" placeholder="Search project by name, ID, or ministry agency..." />
            </div>
            <div className="reports-filters-group">
              <select id="reports-sector-filter" className="sector-filter-select">
                <option value="ALL">All Sectors</option>
              </select>
            </div>
          </div>

          <div className="projects-table-container">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Monitored Project</th>
                  <th>Sector</th>
                  <th>Outlay</th>
                  <th>Current Status</th>
                  <th style={{textAlign: 'right'}}>AI Inference</th>
                </tr>
              </thead>
              <tbody id="projects-table-body">
                {/* Injected dynamically by reports.js */}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW 2: LOADING STATE */}
        <div className="reports-loading-container" id="reports-loading-view">
          <div className="radar-spinner"></div>
          <h3 className="loading-title">Running Predictive ML Inferences...</h3>
          <p className="loading-desc">Synthesizing budget expenditure telemetry, timeline slippage factors, and historical contract risks via NIVARA-XGB-v2.4-GovRisk engine.</p>
        </div>

        {/* VIEW 3: ERROR STATE */}
        <div className="reports-error-container" id="reports-error-view">
          <div className="error-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="loading-title" style={{color: '#b91c1c'}}>Prediction Inference Failed</h3>
          <p className="loading-desc" id="error-message-text">Unable to complete model inference for the requested project telemetry dataset.</p>
          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
            <button className="btn-back-list" id="btn-retry-prediction">Retry Inference</button>
            <button className="btn-action-outline" onClick="ReportsUI.init()">Back to Directory</button>
          </div>
        </div>

        {/* VIEW 4: REPORT DETAIL VIEW */}
        <div className="reports-detail-container" id="reports-detail-view">

          {/* Detail Top Bar */}
          <div className="detail-top-bar">
            <button type="button" className="btn-back-list" id="btn-back-to-list">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Projects Directory
            </button>
            <div className="detail-actions">
              <button type="button" className="btn-action-outline" id="btn-export-report" title="Print or save PDF report">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print / Export
              </button>
            </div>
          </div>

          {/* Project Banner Card */}
          <div className="project-banner-card">
            <div>
              <h3 className="project-banner-title" id="detail-project-name">Project Title</h3>
              <div className="project-banner-meta">
                <span><strong>ID:</strong> <span id="detail-project-id">--</span></span>
                <span>&bull;</span>
                <span><strong>Sector:</strong> <span id="detail-project-sector">--</span></span>
                <span>&bull;</span>
                <span><strong>Total Outlay:</strong> <span id="detail-project-outlay">--</span></span>
              </div>
            </div>
            <div>
              <span className="sector-badge" id="detail-project-planned" style={{background: '#f1f5f9', color: '#475569', fontSize: '12.5px'}}>Planned: --</span>
            </div>
          </div>

          {/* 3-Metrics Grid */}
          <div className="detail-metrics-grid">

            {/* Card 1: Risk Score Circular Gauge */}
            <div className="metric-card">
              <span className="metric-card-header">Predicted Risk Score</span>
              <div className="risk-gauge-box">
                <div className="gauge-svg-wrap">
                  <svg viewBox="0 0 100 100">
                    <circle className="gauge-circle-bg" cx="50" cy="50" r="40" />
                    <circle className="gauge-circle-progress" id="detail-gauge-circle" cx="50" cy="50" r="40" />
                  </svg>
                  <div className="gauge-center-text">
                    <span className="gauge-number" id="detail-risk-number">--</span>
                    <span className="gauge-unit">/ 100</span>
                  </div>
                </div>
                <div className="risk-level-badge-box">
                  <div className="risk-level-pill critical" id="detail-risk-level-pill">
                    <span style={{width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor'}}></span>
                    CRITICAL RISK
                  </div>
                  <span style={{fontSize: '11px', color: '#64748b'}}>Higher score implies elevated delay probability</span>
                </div>
              </div>
            </div>

            {/* Card 2: Predicted Timeline Slippage */}
            <div className="metric-card">
              <span className="metric-card-header">Predicted Delay vs. Schedule</span>
              <div className="delay-stat-val" id="detail-delay-value">+-- Mos</div>
              <p className="delay-subtext" id="detail-delay-subtext">
                Timeline slippage projection relative to baseline milestone targets.
              </p>
            </div>

            {/* Card 3: Model Confidence & Accuracy */}
            <div className="metric-card">
              <span className="metric-card-header">Prediction Confidence</span>
              <div className="confidence-stat-val" id="detail-confidence-value">--%</div>
              <div className="confidence-bar-wrap">
                <div className="confidence-bar-fill" id="detail-confidence-bar" style={{width: '0%'}}></div>
              </div>
              <p className="model-meta-sub">
                Based on historical multi-sector regression &amp; outlay utilization benchmarks.
              </p>
            </div>

          </div>

          {/* 2-Column Analytics: Contributing Factors + Trend */}
          <div className="detail-analytics-grid">

            {/* Factors */}
            <div className="analytics-card">
              <h4 className="analytics-card-title">Key Contributing Risk Factors</h4>
              <p className="analytics-card-sub">Ranked feature importance breakdown derived from project telemetry</p>
              <div className="factors-list" id="detail-factors-list">
                {/* Dynamically populated */}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="analytics-card">
              <h4 className="analytics-card-title">Risk Trajectory Trend (Recent Months)</h4>
              <p className="analytics-card-sub">Historical monthly ML score progression</p>
              <div className="trend-chart-box" id="detail-trend-chart-box">
                {/* SVG injected dynamically */}
              </div>
            </div>

          </div>

          {/* Strategic AI Recommendations */}
          <div className="recommendations-card">
            <h4 className="analytics-card-title">Strategic Action Recommendations</h4>
            <p className="analytics-card-sub">AI-driven actionable mitigation steps to avert timeline escalation</p>
            <div className="rec-list">
              <div className="rec-item">
                <div className="rec-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="rec-text">
                  <h4>Expedite Statutory Clearances</h4>
                  <p>Trigger fast-track inter-ministerial coordination for critical section right-of-way and forest clearances.</p>
                </div>
              </div>
              <div className="rec-item">
                <div className="rec-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div className="rec-text">
                  <h4>Mobilize Secondary Contractors</h4>
                  <p>Implement sub-contractor capacity enhancements on lagging milestone packages to recover critical path.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="detail-footer-meta">
            <span>Model Serving Engine: <strong id="detail-model-version">NIVARA-XGB-v2.4-GovRisk</strong></span>
            <span>Last Inferred: <strong id="detail-last-updated">--</strong></span>
          </div>

        </div>

      </div>
    </div>
  </div>
    </>
  );
};

export default Dashboard;
