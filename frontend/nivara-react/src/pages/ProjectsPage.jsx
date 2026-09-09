import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import dashboardApi from '../api/dashboardApi';
import ReportsView from '../components/ReportsView';

const ProjectsPage = () => {
  const [attentionProjects, setAttentionProjects] = useState([]);
  const [overview, setOverview] = useState({ stateRiskOverview: [] });
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const projRes = await projectApi.getProjects();
        if (projRes && projRes.projects) {
          setAttentionProjects(projRes.projects);
        }
        const ovRes = await dashboardApi.getOverview();
        if (ovRes) {
          setOverview(ovRes);
        }
      } catch (err) {
        console.error("ProjectsPage fetch error:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="dashboard-page-wrapper">
      <HeaderNav activeKey="/projects" />

      <main className="page-container">
        {/* ===== PAGE TITLE BANNER ===== */}
        <div className="standalone-reports-page" style={{ padding: '0 0 20px 0' }}>
          <div className="page-title-banner" style={{ margin: '20px 0' }}>
            <h1>Central Sector Projects Workspace</h1>
            <p>
              High-priority Central Sector infrastructure assets flagged for immediate ministerial review, state risk cluster analysis, and statutory clearance tracking.
            </p>
          </div>
        </div>

        {/* ===== PROJECTS REQUIRING ATTENTION TABLE ===== */}
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
              View Full Prediction Reports &rarr;
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
                      <span className={`risk-level-pill ${p.riskLevel ? p.riskLevel.toLowerCase() : ''}`}>
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
                          fontWeight: '700',
                          cursor: 'pointer'
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

        {/* ===== NATIONAL INFRASTRUCTURE RISK MAP ===== */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>State &amp; Corridor Risk Clusters</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: '700' }}>● Critical (18)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', fontWeight: '700' }}>● High (44)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ca8a04', fontWeight: '700' }}>● Medium (52)</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '700' }}>● Low (72)</span>
              </div>
            </div>

            <div className="map-placeholder-grid">
              {overview.stateRiskOverview && overview.stateRiskOverview.map((item, idx) => (
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

export default ProjectsPage;
