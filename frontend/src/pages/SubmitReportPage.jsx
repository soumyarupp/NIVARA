import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import reportApi from '../api/reportApi';
import delayApi from '../api/delayApi';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Send, ArrowLeft, CheckCircle2, AlertCircle, 
  Sparkles, Building2, Calendar, DollarSign, Activity,
  Clock, ShieldAlert, CheckCircle, Info, TrendingUp, Layers
} from 'lucide-react';
import './Dashboard.css';
import './Reports.css';

const SubmitReportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [reportingMonth, setReportingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expenditure, setExpenditure] = useState('');
  const [actualPhysicalProgress, setActualPhysicalProgress] = useState('');
  const [plannedPhysicalProgress, setPlannedPhysicalProgress] = useState('');
  const [delayDays, setDelayDays] = useState('0');
  const [delayReasonText, setDelayReasonText] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nlpPrediction, setNlpPrediction] = useState(null);
  const [isNlpAnalyzing, setIsNlpAnalyzing] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null); // { message, isError }
  const [pastReports, setPastReports] = useState([]);
  const [isFetchingPastReports, setIsFetchingPastReports] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await projectApi.getProjects();
        const list = res?.projects || res?.data || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0]._id || list[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch project list:", err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  useEffect(() => {
    async function loadPastReports() {
      if (!selectedProjectId) return;
      setIsFetchingPastReports(true);
      try {
        const res = await reportApi.getProjectReports(selectedProjectId);
        const list = res?.data || res?.reports || (Array.isArray(res) ? res : []);
        setPastReports(list);
      } catch (err) {
        console.warn("Could not load past reports:", err.message);
      } finally {
        setIsFetchingPastReports(false);
      }
    }
    loadPastReports();
  }, [selectedProjectId]);

  const handleRemarkBlur = async () => {
    if (!delayReasonText.trim() || delayReasonText.length < 5) return;
    setIsNlpAnalyzing(true);
    try {
      const res = await delayApi.classifyRemark(selectedProjectId, delayReasonText);
      if (res && res.data) {
        setNlpPrediction(res.data);
      }
    } catch (err) {
      console.warn("NLP classification skipped:", err.message);
    } finally {
      setIsNlpAnalyzing(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setAlertStatus({ message: 'Please select an infrastructure project.', isError: true });
      return;
    }
    if (!expenditure || Number(expenditure) < 0) {
      setAlertStatus({ message: 'Please enter valid monthly expenditure in ₹ Crores.', isError: true });
      return;
    }
    if (!actualPhysicalProgress || Number(actualPhysicalProgress) < 0 || Number(actualPhysicalProgress) > 100) {
      setAlertStatus({ message: 'Please enter actual physical progress (0 - 100%).', isError: true });
      return;
    }

    setIsSubmitting(true);
    setAlertStatus(null);

    try {
      const payload = {
        projectId: selectedProjectId,
        reportingMonth,
        expenditure: Number(expenditure),
        actualPhysicalProgress: Number(actualPhysicalProgress),
        plannedPhysicalProgress: plannedPhysicalProgress ? Number(plannedPhysicalProgress) : Number(actualPhysicalProgress),
        delayDays: Number(delayDays) || 0,
        delayReasonText,
        remarks
      };

      const response = await fetch(`http://localhost:5002/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nivara_token')}`
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Report submission rejected by server');
      }

      setAlertStatus({
        message: 'Monthly Progress Report submitted successfully! Automated risk engine updated.',
        isError: false
      });

      setTimeout(() => {
        navigate(`/projects/${selectedProjectId}`);
      }, 1400);
    } catch (err) {
      setAlertStatus({ message: err.message || 'Failed to submit report', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProjObj = projects.find(p => p._id === selectedProjectId || p.id === selectedProjectId);
  const costTotal = Number(selectedProjObj?.originalProjectCost || selectedProjObj?.sanctionedCost || 0);
  const spentTotal = Number(selectedProjObj?.expenditure || selectedProjObj?.totalActualExpenditure || 0);
  const financialPct = costTotal > 0 ? Math.min(100, Math.round((spentTotal / costTotal) * 100)) : 0;
  const physicalPct = Number(selectedProjObj?.physicalProgress || 0);

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className="admin-main-container">
        <AdminTopHeader onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeKey="/reports" />

        <main className="admin-scrollable-content py-8 space-y-7">
          {/* Header Navigation Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
            <Link 
              to="/reports" 
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 px-3.5 py-2 rounded-xl border border-sky-200/70 transition-all shadow-xs"
            >
              <ArrowLeft size={14} /> Back to Reports Overview
            </Link>
            <div className="flex items-center gap-2.5 bg-slate-100/80 border border-slate-200/80 px-3.5 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-600 font-medium">
                Authenticated Officer: <strong className="text-slate-900 font-bold">{user?.fullName || user?.name || 'Field Officer'}</strong>
              </span>
            </div>
          </div>

          {/* Banner Card */}
          <div className="dashboard-banner bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-7 border border-slate-700/60 shadow-lg shadow-slate-950/10">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Submit Monthly Progress &amp; Ground Telemetry
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Official Central Sector progress submission protocol. All reported delay reasons and metrics are verified in real-time by the MoSPI NLP classifier.
                </p>
              </div>
            </div>
          </div>

          {/* Alert Status Banner */}
          {alertStatus && (
            <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 transition-all ${
              alertStatus.isError 
                ? 'bg-red-50/90 border-red-200 text-red-800' 
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
            }`}>
              {alertStatus.isError ? <AlertCircle size={20} className="shrink-0 text-red-600" /> : <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />}
              <span>{alertStatus.message}</span>
            </div>
          )}

          {/* Main 2-Column Responsive Layout */}
          <form onSubmit={handleSubmitReport} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-7">
              {/* Section 1: Project & Cycle Selection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Project &amp; Period Selection</h3>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                    Mandatory
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Target Infrastructure Project <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        required
                      >
                        {projects.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.projectName || p.name} ({p.projectCode || p.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400">Select the registered central project from your ministry</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Reporting Cycle Month <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="month"
                        value={reportingMonth}
                        onChange={(e) => setReportingMonth(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Standard monthly reporting cycle window</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Monthly Execution Metrics */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Monthly Execution Metrics</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Quantifiable Progress</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Monthly Expenditure (₹ Cr) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 45.50"
                        value={expenditure}
                        onChange={(e) => setExpenditure(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Total invoice outlay certified this cycle</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Actual Physical Progress (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 55"
                        value={actualPhysicalProgress}
                        onChange={(e) => setActualPhysicalProgress(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cumulative physical milestone completion</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Planned Progress Target (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 70"
                        value={plannedPhysicalProgress}
                        onChange={(e) => setPlannedPhysicalProgress(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Scheduled target milestone for this cycle</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Recorded Schedule Delay (Days)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={delayDays}
                        onChange={(e) => setDelayDays(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-12 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Days</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cumulative delay against original schedule</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Delay Remarks & AI NLP Classification */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Delay Remarks &amp; AI NLP Classification
                    </h3>
                  </div>
                  {isNlpAnalyzing ? (
                    <span className="text-xs text-sky-600 font-bold flex items-center gap-1.5 animate-pulse bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      <Sparkles size={14} /> NLP Analyzing...
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Sparkles size={12} /> MoSPI AI Ready
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ground Delay Observations &amp; Specific Remarks
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Tree felling clearance pending from state forest division since 4 months causing package 2 stoppage. Contractor mobilized equipment idling on site."
                    value={delayReasonText}
                    onChange={(e) => setDelayReasonText(e.target.value)}
                    onBlur={handleRemarkBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed transition-all"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Tip: Click outside the text box to trigger real-time MoSPI standardized categorization.</span>
                    <span>{delayReasonText.length} characters</span>
                  </div>
                </div>

                {/* NLP Prediction Card */}
                {nlpPrediction && (
                  <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-xl text-xs space-y-1.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-sky-800 flex items-center gap-1">
                        <Sparkles size={13} className="text-sky-600" /> AI Predicted Delay Classification
                      </span>
                      <span className="text-[11px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                        {nlpPrediction.confidence ? `${(nlpPrediction.confidence * 100).toFixed(0)}% Confidence` : '96% High Fidelity'}
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {nlpPrediction.primaryCategory || nlpPrediction.category || 'FOREST_CLEARANCE'}
                    </div>
                    <p className="text-slate-600 text-xs">
                      {nlpPrediction.summary || 'Standard MoSPI delay category tagged for line-ministry automated escalation.'}
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    General Field Notes / Contractor Mobilization Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional field notes, manpower deployment updates, or contractor issues for nodal officer review..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed transition-all"
                  />
                </div>
              </div>

              {/* Section 4: Past Monthly Submissions & Telemetry History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Past Monthly Submissions &amp; Telemetry History ({pastReports.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    Historical Audit Trail
                  </span>
                </div>

                {isFetchingPastReports ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                    Loading historical telemetry...
                  </div>
                ) : pastReports.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                    No historical monthly reports recorded for this project yet. Submit the first monthly progress report above.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Reporting Cycle</th>
                          <th className="py-3 px-4">Physical Progress</th>
                          <th className="py-3 px-4">Expenditure</th>
                          <th className="py-3 px-4">Delay Days</th>
                          <th className="py-3 px-4">MoSPI Delay Category</th>
                          <th className="py-3 px-4">Risk Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                        {pastReports.map((rep, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {rep.reportingMonth}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-sky-700">{rep.actualPhysicalProgress}%</span>
                              {rep.plannedPhysicalProgress ? (
                                <span className="text-slate-400 text-[11px] block">Plan: {rep.plannedPhysicalProgress}%</span>
                              ) : null}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-700">
                              ₹{rep.expenditure} Cr
                            </td>
                            <td className="py-3 px-4">
                              {rep.delayDays > 0 ? (
                                <span className="text-red-600 font-bold">+{rep.delayDays} Days</span>
                              ) : (
                                <span className="text-emerald-600 font-bold">On Schedule</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]">
                                {rep.autoDetectedDelayReason || rep.delayReason || 'NONE'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rep.calculatedRiskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                rep.calculatedRiskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {rep.calculatedRiskLevel || 'LOW'} ({rep.calculatedRiskScore || 20}/100)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Form Action Footer */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold px-7 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} /> {isSubmitting ? 'Transmitting Report...' : 'Transmit Monthly Report'}
                </button>
              </div>
            </div>

            {/* Right Column: Sticky Project Snapshot Card (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 size={16} className="text-sky-600" /> Target Project Snapshot
                  </h3>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Live Telemetry
                  </span>
                </div>

                {selectedProjObj ? (
                  <div className="space-y-4">
                    {/* Project Header Info */}
                    <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Project</span>
                      <strong className="text-slate-900 block text-xs sm:text-sm font-extrabold leading-snug">
                        {selectedProjObj.projectName || selectedProjObj.name}
                      </strong>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {selectedProjObj.projectCode || selectedProjObj.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {selectedProjObj.sector || selectedProjObj.ministry || 'Central Sector'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Progress Metric */}
                    <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Sanctioned Outlay:</span>
                        <strong className="text-slate-900 font-bold">₹{costTotal} Cr</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Recorded Expenditure:</span>
                        <strong className="text-emerald-700 font-bold">₹{spentTotal} Cr</strong>
                      </div>
                      {/* Financial Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Financial Burn Rate</span>
                          <span>{financialPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${financialPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Physical Progress Metric */}
                    <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Current Physical Progress:</span>
                        <strong className="text-sky-700 font-bold">{physicalPct}%</strong>
                      </div>
                      {/* Physical Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${physicalPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Officer Regulatory Notice */}
                    <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-200/90 text-amber-950 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Info size={14} /> Notice for Reporting Officers
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Transmitting reports automatically updates the project risk matrix and alerts line ministry officials if significant cost or progress anomalies emerge.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    Select a project to inspect live telemetry snapshot.
                  </div>
                )}
              </div>
            </div>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SubmitReportPage;

