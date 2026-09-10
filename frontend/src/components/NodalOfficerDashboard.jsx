import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Search, ArrowRight,
  TrendingUp, Activity, Layers, MapPin, Building2, Calendar,
  ShieldCheck, RefreshCw, AlertCircle, Eye, Scale, Send, X, FileText, CheckCircle,
  ChevronRight
} from 'lucide-react';
import projectApi from '../api/projectApi';
import alertApi from '../api/alertApi';
import reportApi from '../api/reportApi';
import { getStoredUser } from '../api/authApi';

const NodalOfficerDashboard = () => {
  const user = getStoredUser();
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Officer Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedProjectForAction, setSelectedProjectForAction] = useState(null);
  const [actionCategory, setActionCategory] = useState('GROUND_AUDIT');
  const [actionTitle, setActionTitle] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionNewStatus, setActionNewStatus] = useState('MITIGATION_ACTIVE');
  const [actionTargetAlertId, setActionTargetAlertId] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, alRes, repRes] = await Promise.allSettled([
        projectApi.getProjects(),
        alertApi.getAlerts(),
        reportApi.getAllReports({ limit: 10 })
      ]);

      let loadedProjects = [];
      if (projRes.status === 'fulfilled' && projRes.value) {
        loadedProjects = projRes.value.projects || projRes.value.data || [];
      }
      setProjects(loadedProjects);

      if (alRes.status === 'fulfilled' && alRes.value) {
        const alData = alRes.value.data || alRes.value.alerts || alRes.value || [];
        setAlerts(Array.isArray(alData) ? alData : []);
      }

      if (repRes.status === 'fulfilled' && repRes.value) {
        const repData = repRes.value.data || repRes.value.reports || repRes.value || [];
        setReports(Array.isArray(repData) ? repData : []);
      }
    } catch (err) {
      console.error('Failed to load nodal officer data:', err);
      setError('Unable to load nodal dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertApi.acknowledgeAlert(alertId, 'Acknowledged by Nodal Officer');
      setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch (err) {
      alert('Failed to acknowledge alert: ' + err.message);
    }
  };

  const openActionModal = (proj, alertItem = null) => {
    setSelectedProjectForAction(proj);
    setActionCategory('GROUND_AUDIT');
    setActionTitle(alertItem ? `Mitigation directive for: ${alertItem.title || alertItem.alertType}` : `Nodal intervention on ${proj?.projectName || proj?.name}`);
    setActionRemarks('');
    setActionNewStatus('MITIGATION_ACTIVE');
    setActionTargetAlertId(alertItem?._id || alertItem?.id || '');
    setActionFeedback(null);
    setIsActionModalOpen(true);
  };

  const handleRecordAction = async (e) => {
    e.preventDefault();
    if (!selectedProjectForAction) return;
    const pId = selectedProjectForAction._id || selectedProjectForAction.id;

    setIsSubmittingAction(true);
    setActionFeedback(null);
    try {
      await projectApi.recordAction(pId, {
        actionType: 'OFFICER_ACTION',
        actionCategory,
        actionTitle,
        remarks: actionRemarks,
        newStatus: actionNewStatus,
        targetAlertId: actionTargetAlertId || undefined
      });
      setActionFeedback({ isError: false, message: 'Nodal governance action recorded and project status updated successfully!' });
      setTimeout(() => {
        setIsActionModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err) {
      setActionFeedback({ isError: true, message: err.message || 'Failed to record action' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Metrics
  const criticalAlerts = alerts.filter(a => ['CRITICAL', 'HIGH'].includes((a.severity || '').toUpperCase()) && a.status !== 'RESOLVED');
  const varianceProjects = projects.filter(p => {
    const phys = Number(p.physicalProgress) || 0;
    const fin = Number(p.financialProgress) || 0;
    return (fin - phys) > 10;
  });

  return (
    <div className="main-dashboard-content space-y-8 text-slate-800">
      
      {/* ===== HEADER BANNER ===== */}
      <div className="dashboard-banner flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Nodal Authority Oversight &amp; Early Warning Command
            </h1>
            <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-amber-200/80 flex items-center gap-2 shrink-0">
              <ShieldAlert size={14} className="text-amber-600" />
              Nodal Officer Desk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Welcome, <strong className="text-slate-700">{user?.fullName || user?.name || 'Nodal Authority Officer'}</strong>.
            Review incoming telemetry from Field Reporting Officers, evaluate automated AI risk warnings, and dispatch statutory mitigation directives.
          </p>
        </div>

        <div className="flex items-center gap-3.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition whitespace-nowrap cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Alerts Feed
          </button>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <ShieldAlert size={14} /> Full Alerts Desk
          </Link>
        </div>
      </div>

      {/* ===== 4 KPI METRIC CARDS ===== */}
      <div className="dashboard-grid-4">
        
        {/* KPI 1: Active Critical & High Alerts */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                <AlertTriangle size={20} />
              </span>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-100 shrink-0">
                Action Required
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight mt-4">
              {criticalAlerts.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Dispatched Risk Alerts</div>
            <div className="text-[11px] text-slate-400 mt-0.5">From Field Officer Submissions</div>
          </div>
        </div>

        {/* KPI 2: Supervised Projects */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                <Layers size={20} />
              </span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 shrink-0">
                Nodal Single Point
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4">
              {projects.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Supervised Mega Assets</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Under Nodal Desk Jurisdiction</div>
          </div>
        </div>

        {/* KPI 3: Progress Variance Flags */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <Clock size={20} />
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 shrink-0">
                Audit Trigger
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-4">
              {varianceProjects.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Fund/Physical Mismatches</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Disbursement &gt; Execution +10%</div>
          </div>
        </div>

        {/* KPI 4: Reporting Reports Received */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                <FileText size={20} />
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shrink-0">
                Field Intake
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight mt-4">
              {reports.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Field Reports Received</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Monthly Telemetry Records</div>
          </div>
        </div>

      </div>

      {/* ===== SECTION 1: INCOMING EARLY WARNING SIGNALS (SENT TO NODAL OFFICER) ===== */}
      <div className="dashboard-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <AlertTriangle size={20} className="text-red-600" />
              Incoming Early Warning &amp; Anomaly Signals (Dispatched to Nodal Desk)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automated alerts triggered by the AI Risk Engine when Reporting Officers submit monthly progress and variance data
            </p>
          </div>

          <Link
            to="/alerts"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            View All Signals ({alerts.length}) <ChevronRight size={14} />
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
            <p>All supervised infrastructure milestones are within acceptable deviation parameters.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {alerts.slice(0, 5).map((a, idx) => {
              const aId = a._id || a.id;
              const proj = a.project || projects.find(p => (p._id || p.id) === (a.projectId || a.project));
              const projName = proj?.projectName || proj?.name || a.projectName || 'Infrastructure Project';
              const pId = proj?._id || proj?.id || (typeof a.projectId === 'object' && a.projectId !== null ? (a.projectId._id || a.projectId.projectCode) : a.projectId);

              return (
                <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row justify-between md:items-center gap-4.5 text-xs">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        (a.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                        (a.severity || '').toUpperCase() === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {a.severity || 'WARNING'}
                      </span>
                      <strong className="text-slate-900 text-sm font-bold">{a.title || a.alertType}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">&bull; {projName}</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-xs">
                      {a.message || a.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    {a.status !== 'RESOLVED' && (
                      <>
                        {a.status !== 'ACKNOWLEDGED' && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeAlert(aId)}
                            className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openActionModal(proj, a)}
                          className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert size={14} /> Take Nodal Action
                        </button>
                      </>
                    )}

                    {pId && (
                      <Link
                        to={`/projects/${pId}`}
                        className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                        title="View Full Project Dossier"
                      >
                        <Eye size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: SUPERVISED PROJECTS OVERSIGHT MATRIX ===== */}
      <div className="dashboard-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Supervised Projects Oversight Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Physical progress, financial disbursement, and predictive risk indicators
            </p>
          </div>

          <Link
            to="/projects"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            All Projects Registry <ChevronRight size={14} />
          </Link>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4.5">Project Name</th>
                <th className="py-4 px-4.5">Sector &amp; Location</th>
                <th className="py-4 px-4.5">Physical %</th>
                <th className="py-4 px-4.5">Financial %</th>
                <th className="py-4 px-4.5">Risk Evaluation</th>
                <th className="py-4 px-4.5">Current Status</th>
                <th className="py-4 px-4.5 text-right">Nodal Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p, idx) => {
                const pId = p._id || p.id;
                const pName = p.projectName || p.name || 'Central Asset';
                const pCode = p.projectCode || pId;
                const phys = p.physicalProgress || 0;
                const fin = p.financialProgress || 0;
                const riskScore = p.riskScore || 45;
                const riskLevel = p.riskLevel || (riskScore > 75 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : 'LOW');
                const status = p.projectStatus || p.status || 'IN_PROGRESS';

                return (
                  <tr key={idx} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-4 px-4.5">
                      <Link to={`/projects/${pId}`} className="font-bold text-slate-900 hover:text-sky-600 block line-clamp-1">
                        {pName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">{pCode}</span>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap text-slate-600">
                      <div className="font-semibold text-slate-800">{p.sector || 'Roads & Highways'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.state || 'National Corridor'}</div>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{phys}%</div>
                      <div className="w-20 bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                        <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${Math.min(100, phys)}%` }}></div>
                      </div>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap">
                      <div className="font-bold text-emerald-600">{fin}%</div>
                      <div className="w-20 bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, fin)}%` }}></div>
                      </div>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border inline-block ${
                        riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                        riskLevel === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {riskLevel} ({riskScore}/100)
                      </span>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px]">
                        {status}
                      </span>
                    </td>

                    <td className="py-4 px-4.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openActionModal(p)}
                          className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert size={13} /> Intervene
                        </button>
                        <Link
                          to={`/projects/${pId}`}
                          className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SECTION 3: RECENT FIELD SUBMISSIONS RECEIVED FROM REPORTING OFFICERS ===== */}
      <div className="dashboard-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText size={20} className="text-purple-600" />
              Recent Field Progress Submissions (From Reporting Officers)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Monthly field logs received from mapped Reporting Officers across supervised project units
            </p>
          </div>

          <Link
            to="/reports"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1 shrink-0"
          >
            All Submitted Reports <ChevronRight size={14} />
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">No recent reporting officer submissions logged yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.slice(0, 6).map((r, idx) => {
              const projName = r.projectId?.projectName || r.projectId?.name || r.projectName || 'Central Asset';
              const pId = r.projectId?._id || r.projectId || r.projectId?.id;

              return (
                <div key={idx} className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 text-xs hover:bg-white hover:shadow-2xs transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      {r.reportingMonth}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{projName}</h3>
                  <div className="flex justify-between py-2 border-y border-slate-200/80 font-semibold text-[11px]">
                    <span>Expenditure: <strong className="text-slate-800">₹{r.expenditure} Cr</strong></span>
                    <span>Physical: <strong className="text-emerald-600">{r.actualPhysicalProgress}%</strong></span>
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-2 italic leading-relaxed">
                    "{r.delayReasonText || r.remarks || 'Normal execution parameters reported.'}"
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>By: <strong className="text-slate-700">{r.submittedBy?.name || 'Reporting Officer'}</strong></span>
                    {pId && (
                      <Link to={`/projects/${pId}`} className="text-sky-600 font-bold hover:underline">
                        View Dossier
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== OFFICER ACTION INTERVENTION MODAL ===== */}
      {isActionModalOpen && selectedProjectForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Nodal Officer Ground Intervention</h3>
                  <p className="text-[11px] text-slate-300">
                    Target: {selectedProjectForAction.projectName || selectedProjectForAction.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordAction} className="p-5 sm:p-6 space-y-4 text-xs">
              {actionFeedback && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  actionFeedback.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {actionFeedback.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span className="font-semibold">{actionFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Intervention Category</label>
                <select
                  value={actionCategory}
                  onChange={(e) => setActionCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                >
                  <option value="GROUND_AUDIT">Physical Ground Audit &amp; Technical Inspection</option>
                  <option value="SHOW_CAUSE">Issue Formal Show-Cause Notice to Contractor</option>
                  <option value="MITIGATION_MEMO">Official Mitigation Protocol Issued</option>
                  <option value="SITE_COORDINATION">Joint District Inter-Agency Review</option>
                  <option value="TECHNICAL_INSPECTION">Commission Technical Review Panel</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Action Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Directive issued for joint site audit on pier foundation delay"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Directives, Observations &amp; Timeline</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify findings, mitigation instructions, contractor deadlines, and inspection dates..."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Updated Project Status</label>
                  <select
                    value={actionNewStatus}
                    onChange={(e) => setActionNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="MITIGATION_ACTIVE">MITIGATION ACTIVE (Under Action)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Standard Execution)</option>
                    <option value="ON_TRACK">ON TRACK (Risk Resolved)</option>
                    <option value="CRITICAL_DELAY">CRITICAL DELAY (Escalated)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Link / Resolve Alert</label>
                  <select
                    value={actionTargetAlertId}
                    onChange={(e) => setActionTargetAlertId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="">None (General Project Action)</option>
                    {alerts.map((al, idx) => (
                      <option key={idx} value={al._id || al.id}>
                        {al.title || al.alertType} ({al.severity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingAction ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Recording Action...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Record Nodal Directive
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NodalOfficerDashboard;
