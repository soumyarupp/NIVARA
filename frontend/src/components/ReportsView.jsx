import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PredictionAPI from '../api/predictionApi';

const ReportsView = ({ isModal = false, onClose = null, initialProjectId = null }) => {
  const [allProjects, setAllProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'loading' | 'error' | 'detail'
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load Projects on mount
  useEffect(() => {
    let isMounted = true;
    async function initProjects() {
      try {
        const projects = await PredictionAPI.getMonitoredProjects();
        if (isMounted) {
          setAllProjects(projects);
          if (initialProjectId) {
            loadProjectReport(initialProjectId);
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    initProjects();
    return () => { isMounted = false; };
  }, [initialProjectId]);

  const loadProjectReport = useCallback(async (projectId) => {
    setActiveProjectId(projectId);
    setCurrentView('loading');
    setErrorMessage(null);
    try {
      const pred = await PredictionAPI.getProjectPrediction(projectId);
      setPredictionData(pred);
      setCurrentView('detail');
    } catch (err) {
      console.error("Prediction inference error:", err);
      setErrorMessage(err.message || "Unable to compute predictive inferences.");
      setCurrentView('error');
    }
  }, []);

  const handleBackToList = () => {
    setCurrentView('list');
    setActiveProjectId(null);
    setPredictionData(null);
  };

  const handleRetry = () => {
    if (activeProjectId) {
      loadProjectReport(activeProjectId);
    }
  };

  const handleExport = () => {
    window.print();
  };

  // Derive unique sectors for dropdown filter
  const sectors = useMemo(() => {
    const set = new Set(allProjects.map(p => p.sector));
    return Array.from(set).sort();
  }, [allProjects]);

  // Filter projects by query and sector
  const filteredProjects = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return allProjects.filter(p => {
      const matchesQuery = !query || 
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.agency.toLowerCase().includes(query);
      const matchesSector = selectedSector === 'ALL' || p.sector === selectedSector;
      return matchesQuery && matchesSector;
    });
  }, [allProjects, searchTerm, selectedSector]);

  // Active project metadata matching prediction
  const activeProjectMeta = useMemo(() => {
    if (!activeProjectId) return null;
    return allProjects.find(p => p.id === activeProjectId) || {
      name: `Project ${activeProjectId}`,
      sector: "Infrastructure",
      outlay: "N/A",
      plannedCompletion: "2027",
      agency: "Implementing Agency"
    };
  }, [allProjects, activeProjectId]);

  // Render Risk Trend SVG Curve
  const renderTrendChart = (trend) => {
    if (!trend || trend.length === 0) return null;
    const width = 500;
    const height = 150;
    const padding = { top: 20, right: 30, bottom: 30, left: 35 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const stepX = chartW / (trend.length - 1 || 1);

    const points = trend.map((d, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (d.score / 100) * chartH;
      return { x, y, score: d.score, month: d.month };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    const firstScore = trend[0].score;
    const lastScore = trend[trend.length - 1].score;
    const delta = lastScore - firstScore;

    return (
      <div className="trend-chart-box">
        <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0"/>
            </linearGradient>
            <linearGradient id="trendLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9"/>
              <stop offset="100%" stopColor="#0284c7"/>
            </linearGradient>
          </defs>

          {/* Y Axis Grid Lines */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#f1f5f9" strokeDasharray="3 3"/>
          <line x1={padding.left} y1={padding.top + chartH / 2} x2={width - padding.right} y2={padding.top + chartH / 2} stroke="#f1f5f9" strokeDasharray="3 3"/>
          <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="#cbd5e1"/>

          {/* Y Labels */}
          <text x={padding.left - 8} y={padding.top + 4} fill="#94a3b8" fontSize="9" textAnchor="end">100</text>
          <text x={padding.left - 8} y={padding.top + chartH / 2 + 3} fill="#94a3b8" fontSize="9" textAnchor="end">50</text>
          <text x={padding.left - 8} y={padding.top + chartH + 3} fill="#94a3b8" fontSize="9" textAnchor="end">0</text>

          {/* Area Fill & Curve Line */}
          <path d={areaD} fill="url(#trendAreaGrad)" />
          <path d={pathD} fill="none" stroke="url(#trendLineGrad)" strokeWidth="3" strokeLinecap="round" />

          {/* Points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2">
                <title>{pt.month}: Risk Score {pt.score}/100</title>
              </circle>
              <text x={pt.x} y={pt.y - 8} fill="#0f172a" fontSize="10" fontWeight="700" textAnchor="middle">{pt.score}</text>
              <text x={pt.x} y={padding.top + chartH + 16} fill="#64748b" fontSize="9.5" textAnchor="middle">{pt.month.slice(5)}</text>
            </g>
          ))}
        </svg>

        <div className="trend-summary-pill">
          <span>
            Trajectory Analysis: {delta > 0 ? (
              <span style={{color: '#dc2626'}}>&uarr; Escalating (+{delta} pts over 6 mos)</span>
            ) : delta < 0 ? (
              <span style={{color: '#16a34a'}}>&darr; Improving ({delta} pts over 6 mos)</span>
            ) : (
              <span>&bull; Stable trajectory</span>
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={isModal ? "reports-modal-body" : "standalone-card-wrap"}>

      {/* VIEW 1: PROJECTS DIRECTORY TABLE */}
      {currentView === 'list' && (
        <div id="reports-list-view">
          <div className="reports-directory-toolbar">
            <div className="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                className="reports-search-input"
                placeholder="Search project by name, ID, or ministry agency..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="reports-filters-group">
              <select
                className="sector-filter-select"
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
              >
                <option value="ALL">All Sectors ({allProjects.length})</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                      <p style={{fontWeight: '700', fontSize: '15px', color: '#0f172a'}}>No monitored projects match your filter.</p>
                      <p style={{fontSize: '13px', marginTop: '4px'}}>Try searching for a different project name or reset sector filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(p => {
                    let statusClass = "active";
                    const lowerStatus = p.status.toLowerCase();
                    if (lowerStatus.includes("delayed")) statusClass = "delayed";
                    if (lowerStatus.includes("critical") || lowerStatus.includes("severe")) statusClass = "critical";
                    if (lowerStatus.includes("schedule") || lowerStatus.includes("near")) statusClass = "ontrack";

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="project-name-cell">
                            <span className="project-title-text">{p.name}</span>
                            <span className="project-id-badge">{p.id} &bull; {p.agency}</span>
                          </div>
                        </td>
                        <td>
                          <span className="sector-badge">{p.sector}</span>
                        </td>
                        <td>
                          <span className="outlay-text">{p.outlay}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'}}></span>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-view-prediction"
                            onClick={() => loadProjectReport(p.id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                            View Prediction Report
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: LOADING STATE */}
      {currentView === 'loading' && (
        <div className="reports-loading-container active">
          <div className="radar-spinner"></div>
          <h3 className="loading-title">Running Predictive ML Inferences...</h3>
          <p className="loading-desc">Synthesizing budget expenditure telemetry, timeline slippage factors, and historical contract risks via NIVARA-XGB-v2.4-GovRisk engine.</p>
        </div>
      )}

      {/* VIEW 3: ERROR STATE */}
      {currentView === 'error' && (
        <div className="reports-error-container active">
          <div className="error-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="loading-title" style={{color: '#b91c1c'}}>Prediction Inference Failed</h3>
          <p className="loading-desc">{errorMessage || "Unable to complete model inference for the requested project telemetry dataset."}</p>
          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
            <button className="btn-back-list" onClick={handleRetry}>Retry Inference</button>
            <button className="btn-action-outline" onClick={handleBackToList}>Back to Directory</button>
          </div>
        </div>
      )}

      {/* VIEW 4: REPORT DETAIL VIEW */}
      {currentView === 'detail' && predictionData && (
        <div className="reports-detail-container active">

          {/* Detail Top Bar */}
          <div className="detail-top-bar">
            <button type="button" className="btn-back-list" onClick={handleBackToList}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Projects Directory
            </button>
            <div className="detail-actions">
              <button type="button" className="btn-action-outline" onClick={handleExport} title="Print or save PDF report">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print / Export
              </button>
            </div>
          </div>

          {/* Project Banner Card */}
          <div className="project-banner-card">
            <div>
              <h3 className="project-banner-title">{activeProjectMeta?.name || predictionData.projectId}</h3>
              <div className="project-banner-meta">
                <span><strong>ID:</strong> {predictionData.projectId}</span>
                <span>&bull;</span>
                <span><strong>Sector:</strong> {activeProjectMeta?.sector}</span>
                <span>&bull;</span>
                <span><strong>Total Outlay:</strong> {activeProjectMeta?.outlay}</span>
              </div>
            </div>
            <div>
              <span className="sector-badge" style={{background: '#f1f5f9', color: '#475569', fontSize: '12.5px'}}>
                Planned: {activeProjectMeta?.plannedCompletion}
              </span>
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
                    <circle
                      className="gauge-circle-progress"
                      cx="50" cy="50" r="40"
                      style={{
                        stroke: predictionData.riskScore >= 75 ? '#dc2626' : predictionData.riskScore >= 50 ? '#ea580c' : predictionData.riskScore >= 25 ? '#ca8a04' : '#10b981',
                        strokeDashoffset: 251.2 - (predictionData.riskScore / 100) * 251.2
                      }}
                    />
                  </svg>
                  <div className="gauge-center-text">
                    <span className="gauge-number">{predictionData.riskScore}</span>
                    <span className="gauge-unit">/ 100</span>
                  </div>
                </div>
                <div className="risk-level-badge-box">
                  <div className={`risk-level-pill ${predictionData.riskScore >= 75 ? 'critical' : predictionData.riskScore >= 50 ? 'high' : predictionData.riskScore >= 25 ? 'medium' : 'low'}`}>
                    <span style={{width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor'}}></span>
                    {predictionData.riskLevel.toUpperCase()} RISK
                  </div>
                  <span style={{fontSize: '11px', color: '#64748b'}}>Higher score implies elevated delay probability</span>
                </div>
              </div>
            </div>

            {/* Card 2: Predicted Timeline Slippage */}
            <div className="metric-card">
              <span className="metric-card-header">Predicted Delay vs. Schedule</span>
              <div
                className="delay-stat-val"
                style={{
                  color: predictionData.riskScore >= 75 ? '#dc2626' : predictionData.riskScore >= 50 ? '#ea580c' : predictionData.riskScore >= 25 ? '#ca8a04' : '#10b981'
                }}
              >
                +{predictionData.predictedDelayMonths.toFixed(1)} Mos
              </div>
              <p className="delay-subtext">
                Planned Completion: <strong>{activeProjectMeta?.plannedCompletion}</strong><br />
                Predicted Slippage: <strong>+{predictionData.predictedDelayMonths.toFixed(1)} months</strong> timeline deviation.
              </p>
            </div>

            {/* Card 3: Model Confidence & Accuracy */}
            <div className="metric-card">
              <span className="metric-card-header">Prediction Confidence</span>
              <div className="confidence-stat-val">{Math.round(predictionData.confidence * 100)}%</div>
              <div className="confidence-bar-wrap">
                <div className="confidence-bar-fill" style={{width: `${Math.round(predictionData.confidence * 100)}%`}}></div>
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
              <div className="factors-list">
                {predictionData.topFactors.map((f, idx) => {
                  const pct = Math.round(f.impact * 100);
                  return (
                    <div key={idx} className="factor-item">
                      <div className="factor-item-top">
                        <span>{f.factor}</span>
                        <span className="factor-impact-badge">{pct}% Impact</span>
                      </div>
                      <div className="factor-bar-track">
                        <div className="factor-bar-fill" style={{width: `${pct}%`}}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="analytics-card">
              <h4 className="analytics-card-title">Risk Trajectory Trend (Recent Months)</h4>
              <p className="analytics-card-sub">Historical monthly ML score progression</p>
              {renderTrendChart(predictionData.riskTrend)}
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
            <span>Model Serving Engine: <strong>{predictionData.modelVersion}</strong></span>
            <span>Last Inferred: <strong>{new Date(predictionData.lastUpdated).toLocaleString()}</strong></span>
          </div>

        </div>
      )}

    </div>
  );
};

export default ReportsView;
