import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import dashboardApi from '../api/dashboardApi';
import ReportsView from '../components/ReportsView';

const ProjectsPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Persistent Left Sidebar */}
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main App Container */}
      <div className="admin-main-container">
        {/* Sticky Top Header */}
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/projects"
        />

        {/* Scrollable Main Content */}
        <main className="admin-scrollable-content text-slate-800">
          {/* ===== PAGE TITLE BANNER ===== */}
          <div className="dashboard-banner mb-8">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Central Sector Projects Workspace</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              High-priority Central Sector infrastructure assets flagged for immediate ministerial review, state risk cluster analysis, and statutory clearance tracking.
            </p>
          </div>

          {/* ===== PROJECTS REQUIRING ATTENTION TABLE ===== */}
          <section className="dashboard-card mb-8 space-y-6" id="projects-attention">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Projects Requiring Attention</h2>
                  <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full border border-sky-200">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  High-priority infrastructure assets flagged for immediate ministerial review and intervention.
                </p>
              </div>
              <button
                type="button"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs transition-all shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
                onClick={() => setActiveModal('reports')}
              >
                View Full Prediction Reports &rarr;
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/90">
                    <th className="py-4 px-4.5">Project</th>
                    <th className="py-4 px-4.5">Ministry / Agency</th>
                    <th className="py-4 px-4.5">State</th>
                    <th className="py-4 px-4.5">Risk Level</th>
                    <th className="py-4 px-4.5">Delay</th>
                    <th className="py-4 px-4.5">Primary Risk Factor</th>
                    <th className="py-4 px-4.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {attentionProjects.map((p, index) => {
                    const name = p.projectName || p.name || 'Unnamed Project';
                    const code = p.projectCode || p.id || `PRJ-${index + 1}`;
                    const agency = p.implementationAgencyId?.agencyCode || p.implementationAgencyId?.name || p.agency || 'Central Agency';
                    const state = p.state || 'National';
                    const risk = p.riskLevel || 'MEDIUM';
                    const delay = p.delayDays !== undefined ? p.delayDays : 0;
                    const primary = p.primaryRisk || p.subSector || p.sector || 'Schedule Variance';

                    return (
                      <tr key={p._id || p.id || index} className="hover:bg-slate-50/90 transition-colors">
                        <td className="py-4 px-4.5">
                          <div className="font-bold text-slate-900">{name}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{code}</div>
                        </td>
                        <td className="py-4 px-4.5 font-semibold text-slate-700">{agency}</td>
                        <td className="py-4 px-4.5 font-semibold text-slate-700">{state}</td>
                        <td className="py-4 px-4.5">
                          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border inline-block ${
                            risk.toUpperCase() === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                            risk.toUpperCase() === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            risk.toUpperCase() === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {risk}
                          </span>
                        </td>
                        <td className="py-4 px-4.5 font-extrabold text-red-700">+{delay} days</td>
                        <td className="py-4 px-4.5 text-slate-700 font-medium">{primary}</td>
                        <td className="py-4 px-4.5 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveModal('reports')}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== NATIONAL INFRASTRUCTURE RISK MAP ===== */}
          <section className="dashboard-card mb-8 space-y-6" id="risk-map">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">National Infrastructure Risk Map</h2>
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                  State Clusters
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Spatial distribution of project risks across Indian States and Union Territories.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/60 space-y-5">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <span className="text-xs font-bold text-slate-900">State &amp; Corridor Risk Clusters</span>
                <div className="flex gap-4 text-xs font-bold flex-wrap">
                  <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">● Critical (18)</span>
                  <span className="text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">● High (44)</span>
                  <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">● Medium (52)</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">● Low (72)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                {overview.stateRiskOverview && overview.stateRiskOverview.map((item, idx) => (
                  <div key={idx} className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:shadow-xs transition-all">
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{item.state} State Cluster</strong>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Primary Concern: {item.primaryIssue}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-red-200 inline-block">
                        {item.criticalCount} Critical
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 font-medium">{item.activeProjects} Projects</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

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
