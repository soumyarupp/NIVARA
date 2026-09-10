import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  ArrowUpRight, 
  ShieldAlert, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Calendar,
  Zap,
  CheckCircle2,
  Scale,
  X,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { alertApi } from '../api/alertApi';
import projectApi from '../api/projectApi';
import { useAuth } from '../context/AuthContext';

export default function AlertsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  // Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState(null);
  const [actionModalType, setActionModalType] = useState('OFFICER_ACTION');
  const [actionCategory, setActionCategory] = useState('GROUND_AUDIT');
  const [actionTitle, setActionTitle] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionNewStatus, setActionNewStatus] = useState('MITIGATION_ACTIVE');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertApi.getAlerts();
      const list = Array.isArray(data) ? data : (data?.data || data?.alerts || []);
      setAlerts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Unable to load alerts from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      setActionLoading(alertId);
      await alertApi.acknowledgeAlert(alertId, 'Acknowledged by officer');
      setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch (err) {
      alert('Failed to acknowledge alert: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const openActionModal = (alertItem) => {
    setSelectedAlertForAction(alertItem);
    const isPolicy = ['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role);
    setActionModalType(isPolicy ? 'POLICY_ACTION' : 'OFFICER_ACTION');
    setActionCategory(isPolicy ? 'CCI_FAST_TRACK' : 'GROUND_AUDIT');
    setActionTitle(`Intervention on ${alertItem.title || alertItem.alertType}`);
    setActionRemarks('');
    setActionNewStatus('MITIGATION_ACTIVE');
    setActionFeedback(null);
    setIsActionModalOpen(true);
  };

  const handleRecordAction = async (e) => {
    e.preventDefault();
    if (!selectedAlertForAction) return;
    const alertId = selectedAlertForAction._id || selectedAlertForAction.id;
    const projId = selectedAlertForAction.project?._id || selectedAlertForAction.project || selectedAlertForAction.projectId;

    setIsSubmittingAction(true);
    setActionFeedback(null);
    try {
      if (projId) {
        await projectApi.recordAction(projId, {
          actionType: actionModalType,
          actionCategory,
          actionTitle,
          remarks: actionRemarks,
          newStatus: actionNewStatus,
          targetAlertId: alertId
        });
      } else {
        await alertApi.resolveAlert(alertId, actionRemarks);
      }
      setActionFeedback({ isError: false, message: 'Official governance intervention logged and alert updated!' });
      setTimeout(() => {
        setIsActionModalOpen(false);
        fetchAlerts();
      }, 1000);
    } catch (err) {
      setActionFeedback({ isError: true, message: err.message || 'Failed to record intervention.' });
    } finally {
      setIsSubmittingAction(false);
    }
  };


  // Filtered list
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      (alert.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.message || alert.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.project?.name || alert.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.project?.projectCode || alert.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || (alert.severity || '').toUpperCase() === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || (alert.status || '').toUpperCase() === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200"><AlertTriangle size={13} /> {s}</span>;
    }
    if (s === 'MEDIUM' || s === 'WARNING') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle size={13} /> {s}</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={13} /> {s || 'LOW'}</span>;
  };

  const getStatusBadge = (status) => {
    const st = (status || 'OPEN').toUpperCase();
    if (st === 'OPEN' || st === 'ACTIVE') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800">Open</span>;
    }
    if (st === 'ACKNOWLEDGED') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 text-sky-800">In Review</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
  };

  const criticalCount = alerts.filter(a => ['CRITICAL', 'HIGH'].includes((a.severity || '').toUpperCase()) && a.status !== 'RESOLVED').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/alerts"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                  <ShieldAlert size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Early Warning & Alerts Center
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Real-time AI anomaly detection, physical-financial mismatches, and critical milestone delays across Central Sector projects.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition shrink-0 self-start md:self-auto"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Alert Feed
            </button>
          </div>

          {/* Quick KPI Metrics */}
          <div className="dashboard-grid-4">
            <div className="kpi-card">
              <div className="flex items-center justify-between gap-2">
                <span className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <AlertTriangle size={18} />
                </span>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  Immediate Action
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-red-600">{criticalCount}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">Active Critical Alerts</div>
                <div className="text-[11px] text-slate-400 mt-0.5">High probability of delay</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between gap-2">
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock size={18} />
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Under Review
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{acknowledgedCount}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">Acknowledged Alerts</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Assigned to Nodal Desk</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between gap-2">
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle size={18} />
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Resolved
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolvedCount}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">Resolved This Cycle</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Mitigation actions verified</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between gap-2">
                <span className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Zap size={18} />
                </span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  All Signals
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{alerts.length}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">Total Detected Signals</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Cumulative platform log</div>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="dashboard-card flex flex-col md:flex-row gap-4 items-center justify-between p-5">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full md:w-[380px] focus-within:border-sky-500 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search alerts by project, keyword, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Only</option>
                  <option value="ACKNOWLEDGED">Acknowledged Only</option>
                  <option value="RESOLVED">Resolved Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alert Table */}
          <div className="dashboard-card p-0 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-semibold">Aggregating real-time telemetry from projects...</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center">
                <AlertCircle size={38} className="text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-bold text-sm">{error}</p>
                <button
                  onClick={fetchAlerts}
                  className="mt-4 px-5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition"
                >
                  Try Again
                </button>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-20 text-center">
                <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Alerts Found</h4>
                <p className="text-slate-500 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                  {searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL' 
                    ? 'No alerts match your current filter parameters. Try resetting filters.' 
                    : 'All infrastructure milestones are within acceptable deviation parameters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                      <th className="py-4 px-5">Severity & Status</th>
                      <th className="py-4 px-5">Alert Details</th>
                      <th className="py-4 px-5">Associated Project</th>
                      <th className="py-4 px-5">Detection Date</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {filteredAlerts.map((alert) => {
                      const alertId = alert._id || alert.id;
                      const projectId = (typeof alert.projectId === 'object' && alert.projectId !== null)
                        ? (alert.projectId._id || alert.projectId.projectCode || alert.projectId.id)
                        : (typeof alert.project === 'object' && alert.project !== null)
                          ? (alert.project._id || alert.project.projectCode || alert.project.id)
                          : (alert.projectId || alert.project);
                      const projectName = alert.project?.name || alert.project?.projectName || alert.projectId?.projectName || alert.projectName || 'General Platform Notice';
                      const projectCode = alert.project?.projectCode || alert.projectId?.projectCode || alert.projectCode;

                      return (
                        <tr key={alertId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5 whitespace-nowrap align-top">
                            <div className="flex flex-col gap-1.5 items-start">
                              {getSeverityBadge(alert.severity)}
                              {getStatusBadge(alert.status)}
                            </div>
                          </td>

                          <td className="py-4 px-5 max-w-md align-top">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {alert.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {alert.message || alert.description}
                            </p>
                            {alert.resolutionNotes && (
                              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                                <span className="font-bold">Resolution:</span> {alert.resolutionNotes}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-5 align-top">
                            {projectId ? (
                              <Link 
                                to={`/projects/${projectId}`}
                                className="group inline-flex flex-col hover:text-sky-600 transition"
                              >
                                <span className="font-bold text-slate-800 group-hover:text-sky-600 flex items-center gap-1.5">
                                  {projectName}
                                  <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition" />
                                </span>
                                {projectCode && (
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">{projectCode}</span>
                                )}
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-600 font-semibold">{projectName}</span>
                            )}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap text-xs text-slate-500 align-top">
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Calendar size={13} className="text-slate-400" />
                              {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : 'Recent'}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap align-top">
                            <div className="flex items-center justify-end gap-2">
                              {alert.status !== 'RESOLVED' && (
                                <>
                                  <button
                                    onClick={() => openActionModal(alert)}
                                    className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-2xs inline-flex items-center gap-1"
                                    title="Take Governance Action"
                                  >
                                    <ShieldAlert size={12} /> Action
                                  </button>
                                  {alert.status !== 'ACKNOWLEDGED' && (
                                    <button
                                      onClick={() => handleAcknowledge(alertId)}
                                      disabled={actionLoading === alertId}
                                      className="px-3 py-1.5 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl transition"
                                      title="Acknowledge Alert"
                                    >
                                      {actionLoading === alertId ? '...' : 'Acknowledge'}
                                    </button>
                                  )}
                                </>
                              )}
                              {projectId && (
                                <Link
                                  to={`/projects/${projectId}`}
                                  className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                                  title="View Project Details"
                                >
                                  <Eye size={15} />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* GOVERNANCE INTERVENTION MODAL */}
        {isActionModalOpen && selectedAlertForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${actionModalType === 'POLICY_ACTION' ? 'bg-purple-600' : 'bg-amber-600'}`}>
                    {actionModalType === 'POLICY_ACTION' ? <Scale size={18} /> : <ShieldAlert size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">
                      {actionModalType === 'POLICY_ACTION' ? 'Take Policy Directive Action' : 'Take Officer Ground Action'}
                    </h3>
                    <p className="text-[11px] text-slate-300">Resolve alert &amp; record statutory intervention</p>
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

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong className="block font-bold">Target Alert:</strong>
                  <span>{selectedAlertForAction.title || selectedAlertForAction.alertType} ({selectedAlertForAction.severity})</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Action Level</label>
                    <select
                      value={actionModalType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setActionModalType(nextType);
                        if (nextType === 'POLICY_ACTION') {
                          setActionCategory('CCI_FAST_TRACK');
                        } else {
                          setActionCategory('GROUND_AUDIT');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="OFFICER_ACTION">Officer Action (Nodal/Ground)</option>
                      {['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role) && (
                        <option value="POLICY_ACTION">Policy Directive (Ministry/IPMD)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Action Category</label>
                    <select
                      value={actionCategory}
                      onChange={(e) => setActionCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      {actionModalType === 'OFFICER_ACTION' ? (
                        <>
                          <option value="GROUND_AUDIT">Physical Ground Audit &amp; Inspection</option>
                          <option value="SHOW_CAUSE">Formal Show-Cause Notice to Contractor</option>
                          <option value="MITIGATION_MEMO">Official Mitigation Protocol Issued</option>
                          <option value="SITE_COORDINATION">Joint District Inter-Agency Review</option>
                          <option value="TECHNICAL_INSPECTION">Technical Expert Review Commissioned</option>
                        </>
                      ) : (
                        <>
                          <option value="CCI_FAST_TRACK">CCI Fast-Track Committee Escalation</option>
                          <option value="CLEARANCE_TASKFORCE">Inter-Ministerial Clearance Taskforce</option>
                          <option value="FUND_REALLOCATION">Capital Outlay Reallocation / Sanction</option>
                          <option value="STATUTORY_ESCROW">Escrow Account Penalty &amp; Clawback</option>
                          <option value="POLICY_WAIVER">Statutory Procedure Exemption / Waiver</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Action Title / Directive Order Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Directive issued for fast-track clearance"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remarks &amp; Directives</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Specify official findings, directives, and expected completion date..."
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Update Project Status</label>
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
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmittingAction ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Record Intervention
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

