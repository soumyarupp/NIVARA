import React, { useEffect } from 'react';
import './Reports.css';
import { Link } from 'react-router-dom';

const Reports = () => {
  useEffect(() => {
    /**
 * reports.js
 * -------------------------------------------------------------------------------------
 * Controller for the NIVARA AI Predictive Reports UI.
 * Handles project listing, search/filter, prediction fetching, and detail view rendering.
 * -------------------------------------------------------------------------------------
 */

const ReportsUI = (function () {
  let allProjects = [];
  let currentActiveProjectId = null;

  // DOM Elements
  const modalBackdrop = document.getElementById("reports-modal");
  const modalCloseBtn = document.getElementById("reports-modal-close");
  const listView = document.getElementById("reports-list-view");
  const loadingView = document.getElementById("reports-loading-view");
  const errorView = document.getElementById("reports-error-view");
  const detailView = document.getElementById("reports-detail-view");
  const tableBody = document.getElementById("projects-table-body");
  const searchInput = document.getElementById("reports-search-input");
  const sectorFilter = document.getElementById("reports-sector-filter");
  const btnBackToList = document.getElementById("btn-back-to-list");
  const btnRetryPrediction = document.getElementById("btn-retry-prediction");
  const btnExportReport = document.getElementById("btn-export-report");

  /**
   * Initializes the Reports module.
   */
  async function init() {
    bindEvents();
    await loadProjects();
    showListView();
  }

  /**
   * Attaches all click, input, and keyboard listeners.
   */
  function bindEvents() {
    // Open reports from header button
    document.querySelectorAll(".btn-reports").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Make hero stat risk card clickable to open reports
    const riskStatCard = document.querySelector(".stat-card--risk");
    if (riskStatCard) {
      riskStatCard.style.cursor = "pointer";
      riskStatCard.title = "Click to inspect active risk predictions";
      riskStatCard.addEventListener("click", () => {
        openModal();
      });
    }

    // Close modal
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
          closeModal();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("active")) {
        closeModal();
      }
    });

    // Back to projects directory
    if (btnBackToList) {
      btnBackToList.addEventListener("click", showListView);
    }

    // Search and Sector filters
    if (searchInput) {
      searchInput.addEventListener("input", filterAndRenderProjects);
    }

    if (sectorFilter) {
      sectorFilter.addEventListener("change", filterAndRenderProjects);
    }

    // Retry button on error
    if (btnRetryPrediction) {
      btnRetryPrediction.addEventListener("click", () => {
        if (currentActiveProjectId) {
          loadProjectReport(currentActiveProjectId);
        }
      });
    }

    // Export / Print button
    if (btnExportReport) {
      btnExportReport.addEventListener("click", () => {
        window.print();
      });
    }
  }

  /**
   * Loads projects from predictionApi.js
   */
  async function loadProjects() {
    if (typeof PredictionAPI === "undefined") {
      console.error("PredictionAPI not found. Ensure predictionApi.js is loaded.");
      return;
    }
    try {
      allProjects = await PredictionAPI.getMonitoredProjects();
      populateSectorDropdown();
      filterAndRenderProjects();
    } catch (err) {
      console.error("Failed to load monitored projects:", err);
    }
  }

  /**
   * Populates sector filter dropdown dynamically.
   */
  function populateSectorDropdown() {
    if (!sectorFilter) return;
    const sectors = Array.from(new Set(allProjects.map(p => p.sector))).sort();
    sectorFilter.innerHTML = `<option value="ALL">All Sectors (${allProjects.length})</option>` +
      sectors.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  /**
   * Filters and renders projects in table view.
   */
  function filterAndRenderProjects() {
    if (!tableBody) return;

    const query = (searchInput?.value || "").toLowerCase().trim();
    const selectedSector = sectorFilter?.value || "ALL";

    const filtered = allProjects.filter(project => {
      const matchesQuery = project.name.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query) ||
        project.agency.toLowerCase().includes(query);
      const matchesSector = selectedSector === "ALL" || project.sector === selectedSector;
      return matchesQuery && matchesSector;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">
            <p style="font-weight: 700; font-size: 15px; color: #0f172a;">No monitored projects match your filter.</p>
            <p style="font-size: 13px; margin-top: 4px;">Try searching for a different project name or reset sector filter.</p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(p => {
      let statusClass = "active";
      if (p.status.toLowerCase().includes("delayed")) statusClass = "delayed";
      if (p.status.toLowerCase().includes("critical") || p.status.toLowerCase().includes("severe")) statusClass = "critical";
      if (p.status.toLowerCase().includes("schedule") || p.status.toLowerCase().includes("near")) statusClass = "ontrack";

      return `
        <tr>
          <td>
            <div class="project-name-cell">
              <span class="project-title-text">${p.name}</span>
              <span class="project-id-badge">${p.id} &bull; ${p.agency}</span>
            </div>
          </td>
          <td>
            <span class="sector-badge">${p.sector}</span>
          </td>
          <td>
            <span class="outlay-text">${p.outlay}</span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              <span style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
              ${p.status}
            </span>
          </td>
          <td>
            <button class="btn-view-prediction" data-project-id="${p.id}" onclick="ReportsUI.loadProjectReport('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              View Prediction Report
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Opens the reports modal.
   * @param {string|null} [projectId] - Optional project ID to jump directly to prediction view.
   */
  function openModal(projectId = null) {
    if (modalBackdrop) {
      modalBackdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    if (projectId) {
      loadProjectReport(projectId);
    } else {
      showListView();
    }
  }

  /**
   * Closes the reports modal.
   */
  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  /**
   * Switches to the list directory view.
   */
  function showListView() {
    if (listView) listView.style.display = "block";
    if (loadingView) loadingView.classList.remove("active");
    if (errorView) errorView.classList.remove("active");
    if (detailView) detailView.classList.remove("active");
    currentActiveProjectId = null;
  }

  /**
   * Loads and renders the prediction report for a specific project.
   * @param {string} projectId 
   */
  async function loadProjectReport(projectId) {
    currentActiveProjectId = projectId;

    // Show loading state
    if (listView) listView.style.display = "none";
    if (errorView) errorView.classList.remove("active");
    if (detailView) detailView.classList.remove("active");
    if (loadingView) loadingView.classList.add("active");

    try {
      // Call the model-agnostic function
      const prediction = await PredictionAPI.getProjectPrediction(projectId);
      const projectMeta = allProjects.find(p => p.id === projectId) || {
        name: `Project ${projectId}`,
        sector: "Infrastructure",
        outlay: "N/A",
        plannedCompletion: "2027",
        agency: "Implementing Agency"
      };

      renderReportDetail(projectMeta, prediction);

      // Hide loading, show detail
      if (loadingView) loadingView.classList.remove("active");
      if (detailView) detailView.classList.add("active");

    } catch (err) {
      console.error("Error fetching project prediction:", err);
      if (loadingView) loadingView.classList.remove("active");
      if (errorView) {
        errorView.classList.add("active");
        const errMsg = document.getElementById("error-message-text");
        if (errMsg) errMsg.textContent = err.message || "Unable to compute predictive inferences.";
      }
    }
  }

  /**
   * Renders the complete Report Detail View with Gauge, Delay, Factors, and Trend.
   * @param {Object} project - Project metadata
   * @param {Object} pred - JSON contract matching prediction output
   */
  function renderReportDetail(project, pred) {
    // 1. Project Info Banner
    const bannerTitle = document.getElementById("detail-project-name");
    const bannerId = document.getElementById("detail-project-id");
    const bannerSector = document.getElementById("detail-project-sector");
    const bannerOutlay = document.getElementById("detail-project-outlay");
    const bannerPlanned = document.getElementById("detail-project-planned");

    if (bannerTitle) bannerTitle.textContent = project.name;
    if (bannerId) bannerId.textContent = pred.projectId;
    if (bannerSector) bannerSector.textContent = project.sector;
    if (bannerOutlay) bannerOutlay.textContent = project.outlay;
    if (bannerPlanned) bannerPlanned.textContent = project.plannedCompletion;

    // 2. Risk Gauge & Score
    const gaugeNum = document.getElementById("detail-risk-number");
    const gaugeCircle = document.getElementById("detail-gauge-circle");
    const riskPill = document.getElementById("detail-risk-level-pill");

    if (gaugeNum) gaugeNum.textContent = pred.riskScore;

    // Circular stroke offset: 2 * PI * 40 ≈ 251.2
    const circumference = 251.2;
    const progressOffset = circumference - (pred.riskScore / 100) * circumference;

    let strokeColor = "#10b981"; // Low (emerald)
    let levelClass = "low";

    if (pred.riskScore >= 75) {
      strokeColor = "#dc2626"; // Critical (red)
      levelClass = "critical";
    } else if (pred.riskScore >= 50) {
      strokeColor = "#ea580c"; // High (orange)
      levelClass = "high";
    } else if (pred.riskScore >= 25) {
      strokeColor = "#ca8a04"; // Medium (amber)
      levelClass = "medium";
    }

    if (gaugeCircle) {
      gaugeCircle.style.stroke = strokeColor;
      gaugeCircle.style.strokeDashoffset = progressOffset;
    }

    if (riskPill) {
      riskPill.className = `risk-level-pill ${levelClass}`;
      riskPill.innerHTML = `
        <span style="width:8px;height:8px;border-radius:50%;background:currentColor;"></span>
        ${pred.riskLevel.toUpperCase()} RISK
      `;
    }

    // 3. Predicted Delay
    const delayVal = document.getElementById("detail-delay-value");
    const delaySubtext = document.getElementById("detail-delay-subtext");
    if (delayVal) {
      delayVal.textContent = `+${pred.predictedDelayMonths.toFixed(1)} Mos`;
      delayVal.style.color = strokeColor;
    }

    if (delaySubtext) {
      delaySubtext.innerHTML = `
        Planned Completion: <strong>${project.plannedCompletion}</strong><br>
        Predicted Slippage: <strong>+${pred.predictedDelayMonths.toFixed(1)} months</strong> timeline deviation.
      `;
    }

    // 4. Model Confidence
    const confVal = document.getElementById("detail-confidence-value");
    const confBar = document.getElementById("detail-confidence-bar");
    const confPercent = Math.round(pred.confidence * 100);

    if (confVal) confVal.textContent = `${confPercent}%`;
    if (confBar) confBar.style.width = `${confPercent}%`;

    // 5. Model Metadata
    const modelVer = document.getElementById("detail-model-version");
    const lastUpdated = document.getElementById("detail-last-updated");
    if (modelVer) modelVer.textContent = pred.modelVersion;
    if (lastUpdated) {
      const dt = new Date(pred.lastUpdated);
      lastUpdated.textContent = isNaN(dt.getTime()) ? pred.lastUpdated : dt.toLocaleString();
    }

    // 6. Contributing Factors Bar Chart
    renderContributingFactors(pred.topFactors);

    // 7. Historical Risk Trend SVG Chart
    renderRiskTrendChart(pred.riskTrend);
  }

  /**
   * Renders the contributing factors list with percentage impact bars.
   * @param {Array<{factor: string, impact: number}>} factors 
   */
  function renderContributingFactors(factors) {
    const listElem = document.getElementById("detail-factors-list");
    if (!listElem) return;

    listElem.innerHTML = factors.map(f => {
      const pct = Math.round(f.impact * 100);
      return `
        <div class="factor-item">
          <div class="factor-item-top">
            <span>${f.factor}</span>
            <span class="factor-impact-badge">${pct}% Impact</span>
          </div>
          <div class="factor-bar-track">
            <div class="factor-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Generates a smooth interactive SVG trend chart of risk scores over recent months.
   * @param {Array<{month: string, score: number}>} trend 
   */
  function renderRiskTrendChart(trend) {
    const chartContainer = document.getElementById("detail-trend-chart-box");
    if (!chartContainer || !trend || trend.length === 0) return;

    const width = 500;
    const height = 150;
    const padding = { top: 20, right: 30, bottom: 30, left: 35 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const stepX = chartW / (trend.length - 1 || 1);

    // Calculate coordinates
    const points = trend.map((d, i) => {
      const x = padding.left + i * stepX;
      // Score ranges 0 to 100 (invert y)
      const y = padding.top + chartH - (d.score / 100) * chartH;
      return { x, y, score: d.score, month: d.month };
    });

    // Generate Path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    // Area path for gradient fill
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Trend trajectory delta
    const firstScore = trend[0].score;
    const lastScore = trend[trend.length - 1].score;
    const delta = lastScore - firstScore;
    const trendText = delta > 0
      ? `<span style="color:#dc2626;">&uarr; Escalating (+${delta} pts over 6 mos)</span>`
      : delta < 0
        ? `<span style="color:#16a34a;">&darr; Improving (${delta} pts over 6 mos)</span>`
        : `<span>&bull; Stable trajectory</span>`;

    chartContainer.innerHTML = `
      <svg class="trend-svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
          </linearGradient>
          <linearGradient id="trendLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0ea5e9"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
        </defs>

        <!-- Y Axis Grid Lines -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#f1f5f9" stroke-dasharray="3 3"/>
        <line x1="${padding.left}" y1="${padding.top + chartH / 2}" x2="${width - padding.right}" y2="${padding.top + chartH / 2}" stroke="#f1f5f9" stroke-dasharray="3 3"/>
        <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="#cbd5e1"/>

        <!-- Y Labels -->
        <text x="${padding.left - 8}" y="${padding.top + 4}" fill="#94a3b8" font-size="9" text-anchor="end">100</text>
        <text x="${padding.left - 8}" y="${padding.top + chartH / 2 + 3}" fill="#94a3b8" font-size="9" text-anchor="end">50</text>
        <text x="${padding.left - 8}" y="${padding.top + chartH + 3}" fill="#94a3b8" font-size="9" text-anchor="end">0</text>

        <!-- Area Fill -->
        <path d="${areaD}" fill="url(#trendAreaGrad)" />

        <!-- Line Curve -->
        <path d="${pathD}" fill="none" stroke="url(#trendLineGrad)" stroke-width="3" stroke-linecap="round" />

        <!-- Plotted Data Circles & Month Labels -->
        ${points.map((pt, idx) => `
          <g>
            <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="2">
              <title>${pt.month}: Risk Score ${pt.score}/100</title>
            </circle>
            <!-- Score Bubble on point -->
            <text x="${pt.x}" y="${pt.y - 8}" fill="#0f172a" font-size="10" font-weight="700" text-anchor="middle">${pt.score}</text>
            <!-- Month Label on X axis -->
            <text x="${pt.x}" y="${padding.top + chartH + 16}" fill="#64748b" font-size="9.5" text-anchor="middle">${pt.month.slice(5)}</text>
          </g>
        `).join("")}
      </svg>
      <div class="trend-summary-pill">
        <span>Trajectory Analysis: ${trendText}</span>
      </div>
    `;
  }

  return {
    init,
    openModal,
    closeModal,
    loadProjectReport
  };
})();

// Auto-initialize when document is ready
// document.addEventListener("DOMContentLoaded", () => {
  ReportsUI.init();
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
      <a href="index.html" className="nav-link">Home</a>
      <a href="reports.html" className="nav-link active">Reports</a>
      <a href="index.html" className="nav-link">Dashboard</a>
    </nav>

    <div className="header-right">
      <a href="login.html" className="btn btn-add">Add Project / Update</a>
      <a href="reports.html" className="btn btn-reports">Reports</a>
      <div className="font-controls">
        <button className="font-btn" id="font-decrease">A-</button>
        <button className="font-btn" id="font-increase">A+</button>
      </div>
    </div>
  </header>

  {/* ===== Main Standalone Content ===== */}
  <main className="standalone-reports-page">
    <div className="page-title-banner">
      <h1>AI Predictive Risk &amp; Delay Reports</h1>
      <p>
        Pre-trained machine learning forecasting engine for Central Sector Mega Projects.
        Evaluates historical spend trajectory, contractor milestone slippage, and statutory clearance delays to forecast overruns before they occur.
      </p>
    </div>

    <div className="standalone-card-wrap">

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
      <a href="index.html">Home</a>
    </div>
  </footer>
    </>
  );
};

export default Reports;
