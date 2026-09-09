import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';
import dashboardApi from '../api/dashboardApi';
import projectApi from '../api/projectApi';
import ProjectDashboard from '../components/ProjectDashboard';
import ReportsView from '../components/ReportsView';

const DashboardPage = () => {
  const [overview, setOverview] = useState({
    summary: {
      totalProjects: 186,
      onTrack: 124,
      atRisk: 44,
      critical: 18,
      totalMonitoredOutlay: "₹48.2 Lakh Crore",
      projectsAtRisk: "118 Projects"
    }
  });

  const [attentionProjects, setAttentionProjects] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    async function loadData() {
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
        console.error("DashboardPage fetch error:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="dashboard-page-wrapper">
      <HeaderNav activeKey="/dashboard" />

      <main className="page-container">
        {/* ===== PAGE TITLE BANNER ===== */}
        <div className="standalone-reports-page" style={{ padding: '0 0 20px 0' }}>
          <div className="page-title-banner" style={{ margin: '20px 0' }}>
            <h1>National Infrastructure Dashboard</h1>
            <p>
              Real-time aggregated health breakdown, portfolio cost evolution, sector-wise expenditure analysis, and risk distribution across 186 monitored Central Sector Mega Projects.
            </p>
          </div>
        </div>

        {/* ===== NATIONAL INFRASTRUCTURE RISK OVERVIEW ===== */}
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

        {/* ===== PROJECT DASHBOARD COMPONENT ===== */}
        <ProjectDashboard projects={attentionProjects} onInspect={() => setActiveModal('reports')} />
      </main>

      <Footer />

      {/* Reports Modal */}
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

export default DashboardPage;
