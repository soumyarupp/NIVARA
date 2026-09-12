import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import ReportsView from '../components/ReportsView';
import { useAuth } from '../context/AuthContext';
import reportApi from '../api/reportApi';
import {
  FileCheck2,
  FileText,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  UploadCloud,
  Layers,
  MapPin,
  TrendingUp
} from 'lucide-react';

const ReportingOfficerPastReportsView = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getAllReports();
      const repData = res?.data || res?.reports || res || [];
      setReports(Array.isArray(repData) ? repData : []);
    } catch (err) {
      console.error('Failed to load past reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const projName = r.projectId?.projectName || r.projectId?.name || r.projectName || '';
      const projCode = r.projectId?.projectCode || r.projectCode || '';
      const matchesSearch =
        !searchQuery ||
        projName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.reportingMonth || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.delayReasonText || r.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMonth = monthFilter === 'ALL' || r.reportingMonth === monthFilter;
      return matchesSearch && matchesMonth;
    });
  }, [reports, searchQuery, monthFilter]);

  const uniqueMonths = useMemo(() => {
    const set = new Set(reports.map((r) => r.reportingMonth).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="dashboard-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Past Monthly Progress Submissions
            </h1>
            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              Audit Telemetry Log
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Historical registry of verified field returns, actual progress percentages, and ground remarks recorded for your assigned infrastructure assets.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/submit-report"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            <UploadCloud size={14} />
            <span>+ Submit Monthly Report</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus-within:border-sky-500 focus-within:bg-white transition-all w-full sm:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by project name, code, month, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 outline-none border-none p-0 focus:ring-0 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Filter Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-all"
            >
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'All Reported Months' : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <span>
            Displaying <strong className="text-slate-800 font-bold">{filteredReports.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{reports.length}</strong> recorded submissions
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
            All Records Stored &amp; Immutable
          </span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw size={28} className="animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-semibold">Retrieving verified telemetry logs...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <FileText size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No submissions found</p>
            <p className="text-slate-400 mt-1">No monthly reports match your search or filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4.5">Reporting Month</th>
                  <th className="py-4 px-4.5">Project Name &amp; Code</th>
                  <th className="py-4 px-4.5">Cumulative Spend</th>
                  <th className="py-4 px-4.5">Physical Progress</th>
                  <th className="py-4 px-4.5">Financial Progress</th>
                  <th className="py-4 px-4.5">Timeline Status / Delay</th>
                  <th className="py-4 px-4.5">Ground Remarks &amp; Bottlenecks</th>
                  <th className="py-4 px-4.5 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((r, idx) => {
                  const projName = r.projectId?.projectName || r.projectId?.name || r.projectName || 'Central Asset';
                  const projCode = r.projectId?.projectCode || r.projectCode || 'PRJ-CODE';
                  const pId = r.projectId?._id || r.projectId?.id || r.projectId || projCode;
                  const delay = r.delayDays ?? (r.delayMonths ? r.delayMonths * 30 : 0);

                  return (
                    <tr key={r._id || idx} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-4 px-4.5 whitespace-nowrap">
                        <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-mono inline-block">
                          {r.reportingMonth || '2026-07'}
                        </span>
                      </td>

                      <td className="py-4 px-4.5 max-w-xs">
                        <Link
                          to={`/projects/${pId}`}
                          className="font-bold text-slate-900 hover:text-sky-600 block line-clamp-1 transition"
                        >
                          {projName}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400">{projCode}</span>
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap font-extrabold text-slate-900">
                        ₹{Number(r.expenditure || 0).toLocaleString('en-IN')} Cr
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Number(r.actualPhysicalProgress || 0))}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-emerald-700">{r.actualPhysicalProgress || 0}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap font-semibold text-slate-700">
                        {r.actualFinancialProgress || 0}%
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap">
                        {delay > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            +{delay} days
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            On Schedule
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4.5 max-w-sm">
                        <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                          {r.delayReasonText || r.remarks || 'Normal execution parameters recorded.'}
                        </p>
                      </td>

                      <td className="py-4 px-4.5 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} /> Logged
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

const Reports = () => {
  const { isReportingOfficer } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          activeKey="/reports"
        />

        {/* Scrollable Main Content */}
        <main className="admin-scrollable-content">
          {isReportingOfficer ? (
            <ReportingOfficerPastReportsView />
          ) : (
            <>
              <div className="dashboard-banner mb-7">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  AI Predictive Risk &amp; Delay Reports
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Pre-trained machine learning forecasting engine for Central Sector Mega Projects.
                  Evaluates historical spend trajectory, contractor milestone slippage, and statutory clearance delays to forecast overruns before they occur.
                </p>
              </div>

              <ReportsView />
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Reports;
