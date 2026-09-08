import React, { useState, useMemo } from 'react';

/**
 * ProjectDashboard – Full project monitoring dashboard with:
 *  - Search bar across all categories
 *  - Filters by Sector, State, Risk Level
 *  - Project cards with Progress %, Cost Used %, Delay (months), Weekly Report
 *  - Risk categorization: HIGH/CRITICAL = Red, MEDIUM = Yellow, LOW = Green
 */
const ProjectDashboard = ({ projects, onInspect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [expandedReports, setExpandedReports] = useState({});

  // Derive unique filter options from projects
  const sectors = useMemo(() => [...new Set(projects.map(p => p.sector).filter(Boolean))].sort(), [projects]);
  const states = useMemo(() => [...new Set(projects.map(p => p.state).filter(Boolean))].sort(), [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Search across all text fields
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [p.name, p.id, p.agency, p.state, p.sector, p.primaryRisk, p.status].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (filterSector && p.sector !== filterSector) return false;
      if (filterState && p.state !== filterState) return false;
      if (filterRisk && p.riskLevel !== filterRisk) return false;
      return true;
    });
  }, [projects, searchQuery, filterSector, filterState, filterRisk]);

  // Compute summary counts
  const counts = useMemo(() => {
    const c = { total: filteredProjects.length, high: 0, medium: 0, low: 0 };
    filteredProjects.forEach(p => {
      const r = (p.riskLevel || '').toUpperCase();
      if (r === 'HIGH' || r === 'CRITICAL') c.high++;
      else if (r === 'MEDIUM') c.medium++;
      else c.low++;
    });
    return c;
  }, [filteredProjects]);

  const toggleReport = (id) => {
    setExpandedReports(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Risk color helpers
  const getRiskColor = (level) => {
    const r = (level || '').toUpperCase();
    if (r === 'HIGH' || r === 'CRITICAL') return '#dc2626';
    if (r === 'MEDIUM') return '#eab308';
    return '#16a34a';
  };

  const getProgressColor = (pct) => {
    if (pct >= 70) return '#16a34a';
    if (pct >= 40) return '#0284c7';
    return '#ea580c';
  };

  const getCostColor = (pct, progress) => {
    // Cost significantly higher than progress = warning
    if (pct > progress + 20) return '#dc2626';
    if (pct > progress + 10) return '#ea580c';
    return '#0284c7';
  };

  const getDelayColor = (months) => {
    if (months >= 12) return '#dc2626';
    if (months >= 3) return '#ea580c';
    if (months >= 1) return '#eab308';
    return '#16a34a';
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterSector('');
    setFilterState('');
    setFilterRisk('');
  };

  return (
    <section className="dashboard-section" id="project-dashboard">
      <div className="section-header">
        <div className="section-title-row">
          <h2 className="section-title">Project Dashboard</h2>
          <span className="demo-pill">Live Monitoring</span>
        </div>
        <p className="section-subtitle">
          Comprehensive project-wise monitoring — track progress, cost utilization, delay, and weekly status reports with automated risk classification.
        </p>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="proj-dash-toolbar">
        <div className="proj-dash-search-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="proj-dash-search"
            placeholder="Search by project name, ID, agency, state, sector..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="proj-dash-filter" value={filterSector} onChange={e => setFilterSector(e.target.value)}>
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="proj-dash-filter" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="proj-dash-filter" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="CRITICAL">🔴 Critical</option>
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>
      </div>

      {/* Summary Chips */}
      <div className="proj-dash-stats-row">
        <div className="proj-dash-stat-chip">
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{counts.total}</span>
          <span style={{ color: '#64748b' }}>Total Projects</span>
        </div>
        <div className="proj-dash-stat-chip">
          <span className="stat-dot" style={{ background: '#dc2626' }}></span>
          <span style={{ fontWeight: 800, color: '#dc2626' }}>{counts.high}</span>
          <span style={{ color: '#64748b' }}>High / Critical Risk</span>
        </div>
        <div className="proj-dash-stat-chip">
          <span className="stat-dot" style={{ background: '#eab308' }}></span>
          <span style={{ fontWeight: 800, color: '#a16207' }}>{counts.medium}</span>
          <span style={{ color: '#64748b' }}>Medium Risk</span>
        </div>
        <div className="proj-dash-stat-chip">
          <span className="stat-dot" style={{ background: '#16a34a' }}></span>
          <span style={{ fontWeight: 800, color: '#15803d' }}>{counts.low}</span>
          <span style={{ color: '#64748b' }}>Low Risk</span>
        </div>
        {(searchQuery || filterSector || filterState || filterRisk) && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Project Cards Grid */}
      <div className="proj-dash-grid">
        {filteredProjects.length === 0 ? (
          <div className="proj-dash-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <h3>No Projects Found</h3>
            <p>Try adjusting your search query or filters to see results.</p>
          </div>
        ) : (
          filteredProjects.map(p => {
            const riskKey = (p.riskLevel || 'low').toLowerCase();
            const riskColor = getRiskColor(p.riskLevel);
            const isExpanded = expandedReports[p.id] || false;

            return (
              <div key={p.id} className={`proj-card proj-card--${riskKey}`}>
                {/* Card Header: Name, ID, Tags, Risk Badge */}
                <div className="proj-card-header">
                  <div className="proj-card-info">
                    <div className="proj-card-name">{p.name}</div>
                    <div className="proj-card-id">{p.id}</div>
                    <div className="proj-card-meta">
                      <span className="proj-card-tag">{p.sector}</span>
                      <span className="proj-card-tag">{p.state}</span>
                      <span className="proj-card-tag">{p.agency}</span>
                    </div>
                  </div>
                  <span className={`proj-card-risk-badge proj-card-risk-badge--${riskKey}`}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: riskColor, display: 'inline-block' }}></span>
                    {p.riskLevel}
                  </span>
                </div>

                {/* Metrics: Progress, Cost Used, Delay */}
                <div className="proj-card-metrics">
                  {/* Progress % */}
                  <div className="proj-metric">
                    <span className="proj-metric-label">Progress</span>
                    <span className="proj-metric-val" style={{ color: getProgressColor(p.progress || 0) }}>
                      {p.progress || 0}<span style={{ fontSize: '14px', fontWeight: 700 }}>%</span>
                    </span>
                    <div className="proj-metric-bar-track">
                      <div
                        className="proj-metric-bar-fill"
                        style={{ width: `${p.progress || 0}%`, background: getProgressColor(p.progress || 0) }}
                      ></div>
                    </div>
                  </div>

                  {/* Cost Used % */}
                  <div className="proj-metric">
                    <span className="proj-metric-label">Cost Used</span>
                    <span className="proj-metric-val" style={{ color: getCostColor(p.costUsed || 0, p.progress || 0) }}>
                      {p.costUsed || 0}<span style={{ fontSize: '14px', fontWeight: 700 }}>%</span>
                    </span>
                    <div className="proj-metric-bar-track">
                      <div
                        className="proj-metric-bar-fill"
                        style={{ width: `${p.costUsed || 0}%`, background: getCostColor(p.costUsed || 0, p.progress || 0) }}
                      ></div>
                    </div>
                  </div>

                  {/* Delay in Months */}
                  <div className="proj-metric">
                    <span className="proj-metric-label">Delay</span>
                    <div className="proj-delay-value">
                      <span className="proj-metric-val" style={{ color: getDelayColor(p.delayMonths || 0) }}>
                        {p.delayMonths || 0}
                      </span>
                      <span className="unit">months</span>
                    </div>
                    <div className="proj-metric-bar-track">
                      <div
                        className="proj-metric-bar-fill"
                        style={{
                          width: `${Math.min((p.delayMonths || 0) / 36 * 100, 100)}%`,
                          background: getDelayColor(p.delayMonths || 0)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Weekly Report */}
                {p.weeklyReport && (
                  <div className={`proj-card-report ${isExpanded ? 'expanded' : ''}`}>
                    <div className="proj-report-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Weekly Report
                    </div>
                    <p className="proj-report-text">{p.weeklyReport}</p>
                    <button type="button" className="proj-report-toggle" onClick={() => toggleReport(p.id)}>
                      {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ProjectDashboard;
