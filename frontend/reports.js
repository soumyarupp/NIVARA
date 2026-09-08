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
document.addEventListener("DOMContentLoaded", () => {
  ReportsUI.init();
});
