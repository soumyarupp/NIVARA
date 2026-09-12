import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import dashboardApi from '../api/dashboardApi';
import ReportsView from '../components/ReportsView';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Eye, 
  ArrowRight, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Building, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Layers, 
  RefreshCw,
  FileText,
  UploadCloud
} from 'lucide-react';

const ProjectsPage = () => {
  const { isReportingOfficer } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ stateRiskOverview: [] });
  const [stateSummaryList, setStateSummaryList] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  const [activeModal, setActiveModal] = useState(null); // 'reports' | null
  
  // Inspection Modal State
  const [inspectingProject, setInspectingProject] = useState(null);
  const [inspectingDetails, setInspectingDetails] = useState(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);

  // Fetch Projects List
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projRes = await projectApi.getProjects({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        riskLevel: selectedRisk !== 'ALL' ? selectedRisk : undefined,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined,
        state: selectedState !== 'ALL' ? selectedState : undefined
      });

      if (projRes && projRes.projects) {
        setAllProjects(projRes.projects);
        setTotalProjectsCount(projRes.pagination?.total || projRes.projects.length);
      }
    } catch (err) {
      console.error("ProjectsPage fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedRisk, selectedSector, selectedState]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [ovRes, stRes, rkRes] = await Promise.allSettled([
          dashboardApi.getOverview(),
          dashboardApi.getStateSummary(),
          dashboardApi.getRiskDistribution()
        ]);

        if (ovRes.status === 'fulfilled' && ovRes.value) {
          setOverview(ovRes.value.data || ovRes.value);
        }

        if (stRes.status === 'fulfilled' && stRes.value) {
          const stData = stRes.value.data || stRes.value || [];
          setStateSummaryList(Array.isArray(stData) ? stData : []);
        }

        if (rkRes.status === 'fulfilled' && rkRes.value) {
          const rkData = rkRes.value.data || rkRes.value || {};
          setRiskDistribution(rkData);
        }
      } catch (err) {
        console.error("Overview fetch error:", err);
      }
    }
    loadOverview();
  }, []);

  // Handle Inspect Click
  const handleInspect = async (project) => {
    setInspectingProject(project);
    setInspectingLoading(true);
    setInspectingDetails(null);

    const targetId = project.projectCode || project._id || project.id;
    try {
      const res = await projectApi.getProjectById(targetId);
      if (res && res.project) {
        setInspectingDetails(res.project);
      } else {
        setInspectingDetails(project);
      }
    } catch (err) {
      console.error("Failed to load full project details:", err);
      setInspectingDetails(project);
    } finally {
      setInspectingLoading(false);
    }
  };

  const closeInspectModal = () => {
    setInspectingProject(null);
    setInspectingDetails(null);
  };

  // Derive unique sectors & states for filter dropdowns
  const availableSectors = [
    'ALL',
    'Road Transport & Highways',
    'Railways',
    'Power & Energy',
    'Petroleum & Natural Gas',
    'Urban Public Infrastructure',
    'Ports & Shipping',
    'Coal',
    'Civil Aviation',
    'Water Resources & Irrigation',
    'Healthcare Infrastructure',
    'Steel & Mining',
    'Telecommunications'
  ];

  const totalPages = Math.max(1, Math.ceil(totalProjectsCount / pageSize));

  // Resolved inspect data (combining quick preview with detailed fetch)
  const currentInspect = inspectingDetails || inspectingProject;
  const inspectReports = currentInspect?.monthlyReports || 
    (currentInspect?.monthlyData ? Object.values(currentInspect.monthlyData) : []) || [];

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
          <div className="dashboard-banner mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Central Sector Projects Workspace</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                National infrastructure registry monitoring 3,400+ Central Sector projects across Line Ministries, Executing Agencies, and 4-Month Telemetry Returns.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {isReportingOfficer ? (
                <Link
                  to="/submit-report"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs inline-flex items-center gap-2"
                >
                  <UploadCloud size={14} />
                  <span>+ Submit Monthly Report</span>
                </Link>
              ) : (
                <button
                  type="button"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  onClick={() => setActiveModal('reports')}
                >
                  <TrendingUp size={14} />
                  <span>AI Predictive Reports &rarr;</span>
                </button>
              )}
            </div>
          </div>

          {/* ===== SEARCH & FILTER CONTROLS ===== */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, state, agency..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Risk Level Filter */}
              <div>
                <select
                  value={selectedRisk}
                  onChange={(e) => { setSelectedRisk(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>

              {/* Sector Filter */}
              <div>
                <select
                  value={selectedSector}
                  onChange={(e) => { setSelectedSector(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                >
                  {availableSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec === 'ALL' ? 'All Sectors' : sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  onClick={loadProjects}
                  title="Refresh Projects"
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-sky-600' : ''} />
                </button>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
              <div>
                Showing <strong className="text-slate-800 font-bold">{Math.min(totalProjectsCount, (currentPage - 1) * pageSize + 1)}</strong> to <strong className="text-slate-800 font-bold">{Math.min(totalProjectsCount, currentPage * pageSize)}</strong> of <strong className="text-slate-900 font-extrabold">{totalProjectsCount.toLocaleString()}</strong> Central Sector Projects
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical Risk</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High Risk</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low Risk</span>
              </div>
            </div>
          </div>

          {/* ===== PROJECTS TABLE ===== */}
          <section className="dashboard-card mb-8 space-y-4" id="projects-attention">
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/90">
                    <th className="py-4 px-4.5">Project &amp; Code</th>
                    <th className="py-4 px-4.5">Ministry / Agency</th>
                    <th className="py-4 px-4.5">State</th>
                    <th className="py-4 px-4.5">Cost &amp; Spend</th>
                    <th className="py-4 px-4.5">Progress</th>
                    <th className="py-4 px-4.5">Risk Level</th>
                    <th className="py-4 px-4.5">Timeline Delay</th>
                    <th className="py-4 px-4.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {loading && allProjects.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-600" />
                        <p className="text-xs font-medium text-slate-500">Loading Central Sector projects repository...</p>
                      </td>
                    </tr>
                  ) : allProjects.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold text-slate-700">No projects found matching your query.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search terms or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    allProjects.map((p, index) => {
                      const name = p.projectName || p.name || 'Unnamed Project';
                      const code = p.projectCode || p.id || `PRJ-${index + 1}`;
                      const agency = p.implementationAgencyId?.agencyCode || p.implementationAgencyId?.name || p.agency || 'Central Agency';
                      const ministry = p.ministryId?.name || p.ministry || 'Line Ministry';
                      const state = p.state || 'National';
                      const origCost = p.originalProjectCost || p.sanctionedCost || p.budgetEstimatedInCrores || 0;
                      const revCost = p.revisedProjectCost || origCost;
                      const spend = p.expenditure || p.totalActualExpenditure || 0;
                      const phy = Math.round(p.physicalProgress ?? 0);
                      const fin = Math.round(p.financialProgress ?? 0);
                      const isCompleted = phy >= 100 || p.projectStatus === 'COMPLETED' || p.status === 'COMPLETED';
                      const risk = isCompleted ? 'LOW' : (p.riskLevel || 'LOW').toUpperCase();
                      const delay = isCompleted ? 0 : (p.delayDays !== undefined ? p.delayDays : 0);
                      const rawDelay = Number(p.rawDelayDays || p.historicalDelayDays || p.delayDays || 0);
                      const costRatio = origCost > 0 ? (revCost - origCost) / origCost : 0;
                      const pastRisk = p.historicalRiskLevel || p.pastRiskLevel || (
                        rawDelay >= 365 || costRatio >= 0.25 || (p.rawRiskLevel === 'CRITICAL') ? 'CRITICAL' :
                        rawDelay >= 90 || costRatio >= 0.10 || (p.rawRiskLevel === 'HIGH') ? 'HIGH' :
                        rawDelay > 0 || costRatio > 0 ? 'MEDIUM' : 'LOW'
                      );

                      return (
                        <tr key={p._id || p.id || index} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-4 px-4.5 max-w-sm">
                            <button
                              type="button"
                              onClick={() => handleInspect(p)}
                              className="font-bold text-slate-900 hover:text-sky-600 text-left transition line-clamp-2 cursor-pointer"
                            >
                              {name}
                            </button>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-mono text-slate-400 font-semibold">{code}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{p.sector || 'Highways'}</span>
                              {isCompleted && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Completed</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4.5">
                            <div className="font-bold text-slate-800">{agency}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]" title={ministry}>{ministry}</div>
                          </td>
                          <td className="py-4 px-4.5 font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {state}</span>
                          </td>
                          <td className="py-4 px-4.5">
                            <div className="font-bold text-slate-900">₹{revCost.toLocaleString()} Cr</div>
                            <div className="text-[11px] text-emerald-700 font-medium">Spent: ₹{spend.toLocaleString()} Cr</div>
                          </td>
                          <td className="py-4 px-4.5 min-w-[130px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-teal-700">Phy: {phy}%</span>
                                <span className="text-indigo-700">Fin: {fin}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, phy)}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4.5">
                            {isCompleted ? (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full border inline-block bg-emerald-50 text-emerald-700 border-emerald-200">
                                  COMPLETED
                                </span>
                                {pastRisk !== 'LOW' && (
                                  <span className="text-[10px] text-amber-700 font-bold block">
                                    Past: {pastRisk} Risk
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border inline-block ${
                                risk === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                risk === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                risk === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {risk}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4.5">
                            {isCompleted ? (
                              <span className="font-bold text-emerald-600">Completed</span>
                            ) : delay > 0 ? (
                              <span className="font-extrabold text-red-600">+{delay} days</span>
                            ) : (
                              <span className="font-bold text-emerald-600">On Time</span>
                            )}
                          </td>
                          <td className="py-4 px-4.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleInspect(p)}
                                className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>
                              <Link
                                to={`/projects/${p.projectCode || p._id || p.id}`}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1"
                              >
                                <span>Details</span>
                                <ArrowRight size={12} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION CONTROLS ===== */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
              <div className="text-xs text-slate-500">
                Page <strong className="text-slate-900 font-bold">{currentPage}</strong> of <strong className="text-slate-900 font-bold">{totalPages}</strong> ({totalProjectsCount.toLocaleString()} total projects)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  &larr; Previous
                </button>
                
                {/* Current Page Indicator */}
                <div className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-2xs">
                  {currentPage}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next &rarr;
                </button>
              </div>
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
                  <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                    ● Critical ({riskDistribution.CRITICAL || allProjects.filter(p => (p.riskLevel || '').toUpperCase() === 'CRITICAL').length || 18})
                  </span>
                  <span className="text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    ● High ({riskDistribution.HIGH || allProjects.filter(p => (p.riskLevel || '').toUpperCase() === 'HIGH').length || 44})
                  </span>
                  <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    ● Medium ({riskDistribution.MEDIUM || allProjects.filter(p => (p.riskLevel || '').toUpperCase() === 'MEDIUM').length || 52})
                  </span>
                  <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ● Low ({riskDistribution.LOW || allProjects.filter(p => (p.riskLevel || '').toUpperCase() === 'LOW').length || 72})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                {(stateSummaryList.length > 0 ? stateSummaryList.slice(0, 8).map(s => ({
                  state: s._id || 'State Corridor',
                  criticalCount: s.highRiskCount || 0,
                  activeProjects: s.totalProjects || 1,
                  primaryIssue: (s.avgPhysicalProgress || 50) < 50 ? 'Execution pace & contractor mobilization' : 'Statutory & environmental clearance'
                })) : (overview.stateRiskOverview && overview.stateRiskOverview.length > 0 ? overview.stateRiskOverview : [
                  { state: 'Maharashtra', criticalCount: 6, activeProjects: 14, primaryIssue: 'Land Acquisition & Resettlement' },
                  { state: 'Bihar', criticalCount: 5, activeProjects: 11, primaryIssue: 'Monsoon flooding & Right of Way' },
                  { state: 'Assam & NE', criticalCount: 4, activeProjects: 8, primaryIssue: 'Geological instability & Forest clearance' },
                  { state: 'Uttar Pradesh', criticalCount: 3, activeProjects: 15, primaryIssue: 'Utility Shifting & Gas Line Crossings' }
                ])).map((item, idx) => (
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

      {/* ========================================================================= */}
      {/* ===== RICH PROJECT INSPECTION MODAL (MONTH-BY-MONTH & COST DATA) ===== */}
      {/* ========================================================================= */}
      {inspectingProject && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeInspectModal(); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-sky-100 text-sky-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                    {currentInspect?.projectCode || currentInspect?.id || 'PRJ-CODE'}
                  </span>
                  {((currentInspect?.physicalProgress || 0) >= 100 || currentInspect?.projectStatus === 'COMPLETED' || currentInspect?.status === 'COMPLETED') ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        COMPLETED (100%)
                      </span>
                      {(currentInspect?.historicalRiskLevel || currentInspect?.pastRiskLevel || (
                        (Number(currentInspect?.delayDays || 0) > 90 || (Number(currentInspect?.revisedProjectCost || 0) > Number(currentInspect?.originalProjectCost || 1) * 1.15)) ? 'HIGH' : null
                      )) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                          Past Risk: {currentInspect?.historicalRiskLevel || currentInspect?.pastRiskLevel || 'HIGH'} (Resolved)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      (currentInspect?.riskLevel || 'LOW').toUpperCase() === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                      (currentInspect?.riskLevel || 'LOW').toUpperCase() === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      (currentInspect?.riskLevel || 'LOW').toUpperCase() === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {currentInspect?.riskLevel || 'LOW'} RISK ({currentInspect?.riskScore || 25}/100)
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-semibold">• {currentInspect?.sector || 'Infrastructure'}</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {currentInspect?.projectName || currentInspect?.name || 'Central Infrastructure Project'}
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-700">{currentInspect?.implementationAgencyId?.name || currentInspect?.agency || 'Implementing Agency'}</span>
                  <span>•</span>
                  <span>{currentInspect?.ministryId?.name || currentInspect?.ministry || 'Line Ministry'}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={12} /> {currentInspect?.state || 'National'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInspectModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {inspectingLoading && !inspectingDetails ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-sky-600" />
                  <p className="font-medium text-slate-600">Retrieving 4-Month Telemetry and Cost Ledger...</p>
                </div>
              ) : (
                <>
                  {/* ===== 1. CURRENT PROGRESS & COST LEDGER CARDS ===== */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-sky-600" /> Current Progress &amp; Financial Ledger
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sanctioned Outlay</span>
                        <div className="text-lg font-extrabold text-slate-900 mt-1">
                          ₹{(currentInspect?.originalProjectCost || currentInspect?.sanctionedCost || 0).toLocaleString()} Cr
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Original Approved Budget</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Anticipated Cost</span>
                        <div className="text-lg font-extrabold text-slate-900 mt-1">
                          ₹{(currentInspect?.revisedProjectCost || currentInspect?.originalProjectCost || 0).toLocaleString()} Cr
                        </div>
                        {((currentInspect?.revisedProjectCost || 0) > (currentInspect?.originalProjectCost || 0)) ? (
                          <span className="text-[10px] font-bold text-red-600 mt-0.5 block">
                            +₹{((currentInspect.revisedProjectCost || 0) - (currentInspect.originalProjectCost || 0)).toFixed(1)} Cr Overrun
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">Within Budget</span>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cumulative Spend</span>
                        <div className="text-lg font-extrabold text-emerald-700 mt-1">
                          ₹{(currentInspect?.expenditure || currentInspect?.totalActualExpenditure || 0).toLocaleString()} Cr
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                          {currentInspect?.financialProgress || 0}% Funds Disbursed
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Progress</span>
                        <div className="text-lg font-extrabold text-teal-600 mt-1">
                          {currentInspect?.physicalProgress || 0}%
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, currentInspect?.physicalProgress || 0)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== 2. MONTH-BY-MONTH TELEMETRY LEDGER ===== */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Calendar size={14} className="text-sky-600" /> 4-Month Historical Progress &amp; Telemetry Returns
                      </h3>
                      <span className="bg-sky-50 text-sky-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                        {inspectReports.length} Reported Cycles (April - July 2026)
                      </span>
                    </div>

                    {inspectReports.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                        <FileText size={28} className="mx-auto mb-1.5 text-slate-300" />
                        <p className="font-bold text-slate-600">No monthly return history found for this project code.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Reporting Month</th>
                              <th className="py-3 px-4">Expenditure</th>
                              <th className="py-3 px-4">Physical Progress</th>
                              <th className="py-3 px-4">Financial Progress</th>
                              <th className="py-3 px-4">Timeline Delay</th>
                              <th className="py-3 px-4">Delay Reason &amp; Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {inspectReports.map((r, idx) => {
                              const monthLabel = r.monthName || (
                                r.reportingMonth === '2026-01' ? 'January 2026' :
                                r.reportingMonth === '2026-02' ? 'February 2026' :
                                r.reportingMonth === '2026-03' ? 'March 2026' :
                                r.reportingMonth === '2026-04' ? 'April 2026' :
                                r.reportingMonth === '2026-05' ? 'May 2026' :
                                r.reportingMonth === '2026-06' ? 'June 2026' :
                                r.reportingMonth === '2026-07' ? 'July 2026' :
                                r.reportingMonth === '2026-08' ? 'August 2026' :
                                r.reportingMonth === '2026-09' ? 'September 2026' :
                                r.reportingMonth === '2026-10' ? 'October 2026' :
                                r.reportingMonth === '2026-11' ? 'November 2026' :
                                r.reportingMonth === '2026-12' ? 'December 2026' :
                                r.reportingMonth
                              );
                              const phy = r.actualPhysicalProgress ?? 0;
                              const fin = r.actualFinancialProgress ?? 0;
                              const delay = r.delayDays ?? (r.delayMonths ? r.delayMonths * 30 : 0);

                              return (
                                <tr key={r._id || r.reportingMonth || idx} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-4">
                                    <div className="font-extrabold text-slate-900">{monthLabel}</div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{r.reportingMonth || '2026-04'}</div>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-emerald-700">
                                    ₹{r.expenditure} Cr
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, phy)}%` }}></div>
                                      </div>
                                      <span className="font-bold text-slate-800">{phy}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, fin)}%` }}></div>
                                      </div>
                                      <span className="font-bold text-indigo-700">{fin}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {delay > 0 ? (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                        +{delay} days
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        On Track
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                                    <div className="line-clamp-2">{r.delayReasonText || r.remarks || 'Statutory return recorded'}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeInspectModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-bold transition"
              >
                Close
              </button>

              <Link
                to={`/projects/${currentInspect?.projectCode || currentInspect?._id || currentInspect?.id}`}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4.5 py-2 rounded-xl text-xs transition shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Open Full Project Dossier &amp; CUF Matrix</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {activeModal === 'reports' && (
        <div className="reports-modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('reports-modal-backdrop')) setActiveModal(null); }}>
          <div className="reports-modal-card">
            <div className="reports-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <TrendingUp size={20} className="text-sky-600" />
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
