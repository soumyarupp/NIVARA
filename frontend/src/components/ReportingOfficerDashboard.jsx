import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, FileText, CheckCircle2, Clock, Search, ArrowRight,
  TrendingUp, Activity, Layers, MapPin, Building2, Calendar,
  ShieldCheck, RefreshCw, AlertCircle, Eye, ChevronRight, FileCheck, FileCheck2
} from 'lucide-react';
import reportApi from '../api/reportApi';
import projectApi from '../api/projectApi';
import { getStoredUser, formatRoleName } from '../api/authApi';

const ReportingOfficerDashboard = () => {
  const user = getStoredUser();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, repRes] = await Promise.allSettled([
        projectApi.getProjects(),
        reportApi.getAllReports()
      ]);

      let loadedProjects = [];
      if (projRes.status === 'fulfilled' && projRes.value) {
        loadedProjects = projRes.value.projects || projRes.value.data || [];
      }

      // Filter projects if assigned to this reporting officer
      const userId = user?._id || user?.id;
      const assignedProjects = loadedProjects.filter(p => {
        if (!userId) return true;
        const isAssigned = (p.reportingOfficers || []).some(
          ro => (ro._id || ro.id || ro) === userId
        ) || (p.reportingOfficerId && (p.reportingOfficerId._id || p.reportingOfficerId) === userId);
        return isAssigned || loadedProjects.length <= 3; // fallback to all if sandbox
      });

      setProjects(assignedProjects.length > 0 ? assignedProjects : loadedProjects);

      if (repRes.status === 'fulfilled' && repRes.value) {
        const repData = repRes.value.data || repRes.value.reports || repRes.value || [];
        setReports(Array.isArray(repData) ? repData : []);
      }
    } catch (err) {
      console.error('Failed to load reporting officer data:', err);
      setError('Unable to load telemetry dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const projName = r.projectId?.projectName || r.projectId?.name || r.projectName || '';
      const projCode = r.projectId?.projectCode || r.projectCode || '';
      const matchesSearch = !searchQuery || 
        projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.reportingMonth || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.delayReasonText || r.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMonth = monthFilter === 'ALL' || r.reportingMonth === monthFilter;
      return matchesSearch && matchesMonth;
    });
  }, [reports, searchQuery, monthFilter]);

  const uniqueMonths = useMemo(() => {
    const set = new Set(reports.map(r => r.reportingMonth).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [reports]);

  // Current month string
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const submittedCurrentMonthCount = reports.filter(r => r.reportingMonth === currentMonthStr).length;
  const pendingProjectsCount = Math.max(0, projects.length - submittedCurrentMonthCount);

  const avgPhysicalProgress = projects.length > 0
    ? (projects.reduce((sum, p) => sum + (Number(p.physicalProgress) || 0), 0) / projects.length).toFixed(1)
    : 0;

  return (
    <div className="main-dashboard-content space-y-8 text-slate-800">
      
      {/* ===== HEADER BANNER ===== */}
      <div className="dashboard-banner flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Field Reporting &amp; Telemetry Console
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Reporting Officer
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Welcome, <strong className="text-slate-700">{user?.fullName || user?.name || 'Field Reporting Officer'}</strong>.
            Submit verified monthly progress telemetry and audit historical reporting logs for assigned infrastructure assets.
          </p>
        </div>

        <div className="flex items-center gap-3.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition whitespace-nowrap"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
          <Link
            to="/submit-report"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs whitespace-nowrap"
          >
            <Send size={14} /> + Submit Monthly Report
          </Link>
        </div>
      </div>

      {/* ===== 4 KPI METRIC CARDS ===== */}
      <div className="dashboard-grid-4">
        
        {/* KPI 1: Assigned Projects */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                <Layers size={20} />
              </span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100 shrink-0">
                Active Assignment
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4">
              {projects.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Assigned Field Assets</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Under Field Supervision</div>
          </div>
        </div>

        {/* KPI 2: Total Past Reports Filed */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                <FileCheck size={20} />
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shrink-0">
                Audit History
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight mt-4">
              {reports.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Total Monthly Submissions</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stored Telemetry Logs</div>
          </div>
        </div>

        {/* KPI 3: Current Month Cycle Status */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <Clock size={20} />
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                pendingProjectsCount === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {pendingProjectsCount === 0 ? 'Cycle Completed' : `${pendingProjectsCount} Due`}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4">
              {submittedCurrentMonthCount} / {projects.length}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Month Cycle: {currentMonthStr}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Submitted vs Total Assigned</div>
          </div>
        </div>

        {/* KPI 4: Avg Physical Execution */}
        <div className="kpi-card p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <Activity size={20} />
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shrink-0">
                Ground Execution
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight mt-4">
              {avgPhysicalProgress}%
            </div>
            <div className="text-xs font-bold text-slate-700 mt-1.5">Average Physical Progress</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across Assigned Portfolio</div>
          </div>
        </div>

      </div>

      {/* ===== ACTION CALLOUT: MONTHLY PROGRESS DUE ===== */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-md border border-slate-700/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Send size={18} />
            </span>
            <h3 className="font-bold text-base sm:text-lg tracking-tight">Monthly Field Progress Submission Window Open</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Enter physical metrics, cumulative billing expenditure, and MoSPI delay classification notes. Early telemetry feeds directly into the AI Risk Model for Nodal oversight.
          </p>
        </div>

        <Link
          to="/submit-report"
          className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 whitespace-nowrap self-start md:self-auto"
        >
          Submit Progress Report <ArrowRight size={15} />
        </Link>
      </div>

      {/* ===== SECTION 1: ASSIGNED INFRASTRUCTURE ASSETS ===== */}
      <div className="dashboard-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Assigned Infrastructure Projects</h2>
            <p className="text-xs text-slate-500 mt-1">Projects assigned to your field reporting unit</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/60">
            {projects.length} Total Assigned
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No infrastructure projects currently assigned to this reporting officer profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p, idx) => {
              const pId = p._id || p.id;
              const pName = p.projectName || p.name || 'Infrastructure Project';
              const pCode = p.projectCode || pId;
              const phys = p.physicalProgress || 0;
              const cost = p.originalProjectCost || 0;
              const state = p.state || 'National';

              return (
                <div key={idx} className="p-5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {pCode}
                      </span>
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {p.sector || 'Central Sector'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{pName}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5">
                      <MapPin size={13} /> {state} ({p.district || 'Corridor'})
                    </div>

                    {/* Progress Metrics */}
                    <div className="space-y-2.5 mt-4 pt-3.5 border-t border-slate-200/70 text-xs">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600">Physical Execution</span>
                          <span className="text-slate-900 font-extrabold">{phys}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, phys)}%` }}></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs pt-1.5">
                        <span className="text-slate-500 font-medium">Sanctioned Outlay:</span>
                        <strong className="text-slate-900 font-bold">₹{cost.toLocaleString('en-IN')} Cr</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-3">
                    <Link
                      to={`/projects/${pId}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 py-2 px-3 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition inline-flex items-center gap-1.5"
                    >
                      <Eye size={14} /> Details
                    </Link>

                    <Link
                      to={`/submit-report?projectId=${pId}`}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-3.5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Send size={13} /> Submit Report
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: PAST MONTHLY SUBMISSIONS & TELEMETRY HISTORY (PAST DATA) ===== */}
      <div className="dashboard-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck2 size={20} className="text-purple-600" />
              Past Monthly Submissions &amp; Telemetry History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Historical audit log of all monthly progress reports submitted for your assigned infrastructure assets
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus-within:border-sky-500 focus-within:bg-white transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search past reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-800 outline-none border-none p-0 focus:ring-0 w-36 sm:w-48"
              />
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-all"
            >
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m === 'ALL' ? 'All Months' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin text-purple-600 mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading historical telemetry logs...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileText size={32} className="mx-auto mb-2 text-slate-300" />
            <p>No past monthly reports match your filter criteria.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4.5">Reporting Month</th>
                  <th className="py-4 px-4.5">Project Name &amp; Code</th>
                  <th className="py-4 px-4.5">Monthly Outlay</th>
                  <th className="py-4 px-4.5">Physical %</th>
                  <th className="py-4 px-4.5">Financial %</th>
                  <th className="py-4 px-4.5">Delay Narrative / Reason</th>
                  <th className="py-4 px-4.5">Submitted On</th>
                  <th className="py-4 px-4.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r, idx) => {
                  const projName = r.projectId?.projectName || r.projectId?.name || r.projectName || 'Central Asset';
                  const projCode = r.projectId?.projectCode || r.projectCode || 'NIV-PRJ';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-4 px-4.5 whitespace-nowrap">
                        <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-mono inline-block">
                          {r.reportingMonth}
                        </span>
                      </td>

                      <td className="py-4 px-4.5">
                        <strong className="text-slate-900 block line-clamp-1">{projName}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{projCode}</span>
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap font-extrabold text-slate-900">
                        ₹{Number(r.expenditure || 0).toLocaleString('en-IN')} Cr
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {r.actualPhysicalProgress}%
                        </span>
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap font-semibold text-slate-700">
                        {r.actualFinancialProgress || 0}%
                      </td>

                      <td className="py-4 px-4.5 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                          {r.delayReasonText || r.remarks || 'Normal execution parameters.'}
                        </p>
                        {r.autoDetectedDelayReason && r.autoDetectedDelayReason !== 'OTHER' && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            NLP: {r.autoDetectedDelayReason}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Logged'}
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} /> Ingested
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ReportingOfficerDashboard;
