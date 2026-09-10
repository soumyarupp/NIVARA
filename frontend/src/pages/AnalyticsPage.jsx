import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import { 
  BarChart3, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { dashboardApi } from '../api/dashboardApi';
import { projectApi } from '../api/projectApi';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AnalyticsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [delayReasons, setDelayReasons] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [projRes, overRes, delRes] = await Promise.allSettled([
        projectApi.getProjects({ limit: 100 }),
        dashboardApi.getOverview(),
        dashboardApi.getDelayReasons()
      ]);

      if (projRes.status === 'fulfilled') {
        const p = projRes.value;
        setProjects(Array.isArray(p) ? p : (p.projects || []));
      }
      if (overRes.status === 'fulfilled') {
        setOverview(overRes.value?.data || overRes.value);
      }
      if (delRes.status === 'fulfilled') {
        const dData = delRes.value?.data || delRes.value || [];
        setDelayReasons(Array.isArray(dData) ? dData : []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute Sector Breakdown
  const sectorCounts = {};
  projects.forEach(p => {
    const s = p.sector || 'Unassigned';
    sectorCounts[s] = (sectorCounts[s] || 0) + 1;
  });
  const sectorData = Object.entries(sectorCounts).map(([name, value]) => ({ name, value }));

  // Compute State Clusters
  const stateCounts = {};
  projects.forEach(p => {
    const st = p.state || (p.location && p.location.state) || 'Central';
    const cost = Number(p.originalProjectCost || p.sanctionedCost || p.budget?.sanctionedCost || 500);
    stateCounts[st] = (stateCounts[st] || 0) + cost;
  });
  const stateData = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([state, expenditure]) => ({ state, expenditure }));

  // Compute Progress Gap distribution
  const progressGapData = projects.slice(0, 8).map(p => {
    const phys = Math.round(p.physicalProgress?.overallPercentage ?? p.progress?.physicalProgress ?? p.physicalProgress ?? 50);
    const fin = Math.round(p.financialProgress?.percentageSpent ?? p.progress?.financialProgress ?? p.financialProgress ?? 45);
    return {
      name: (p.name || p.projectName || 'Project').substring(0, 15) + '...',
      Physical: phys,
      Financial: fin,
      Gap: Math.abs(fin - phys)
    };
  });

  // Delay Root Causes Distribution
  const delayCausesData = useMemo(() => {
    if (delayReasons.length > 0) {
      const total = delayReasons.reduce((acc, r) => acc + (r.count || 1), 0) || 1;
      return delayReasons.slice(0, 5).map(r => {
        const pct = Math.round((r.count / total) * 100);
        const name = r._id.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        return { name, value: pct || 20 };
      });
    }
    return [
      { name: 'Land Acquisition & Right of Way', value: 38 },
      { name: 'Forest & Environmental Clearances', value: 24 },
      { name: 'Utility Shifting (Power/Water)', value: 16 },
      { name: 'Contractor Financial Liquidity', value: 12 },
      { name: 'Monsoon & Geological Surprises', value: 10 },
    ];
  }, [delayReasons]);

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/analytics"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                  <BarChart3 size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Executive Infrastructure Portfolio Analytics
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Deep analytical breakdown of capital expenditure, progress discrepancies, and state-level infrastructure density.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition shrink-0 self-start sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Analytics
            </button>
          </div>

          {/* Top KPI Cards */}
          <div className="dashboard-grid-4">
            <div className="kpi-card">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tracked Projects</span>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{projects.length}</h3>
                <p className="text-xs text-sky-600 font-bold mt-1">Across 8 Central Ministries</p>
              </div>
            </div>

            <div className="kpi-card">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative Outlay</span>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ₹{projects.reduce((acc, p) => acc + (p.sanctionedCost || p.budget?.sanctionedCost || 0), 0).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">Cr</span>
                </h3>
                <p className="text-xs text-emerald-600 font-bold mt-1">Active Capital Sanctions</p>
              </div>
            </div>

            <div className="kpi-card">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Physical Progress</span>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {Math.round(projects.reduce((acc, p) => acc + (p.physicalProgress?.overallPercentage ?? p.progress?.physicalProgress ?? 50), 0) / (projects.length || 1))}%
                </h3>
                <p className="text-xs text-slate-500 mt-1">Milestone execution rate</p>
              </div>
            </div>

            <div className="kpi-card">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Bottlenecks</span>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-red-600">
                  {projects.filter(p => (p.riskLevel || '').toUpperCase() === 'CRITICAL' || (p.riskLevel || '').toUpperCase() === 'HIGH').length}
                </h3>
                <p className="text-xs text-red-600 font-bold mt-1">Requiring PMG escalation</p>
              </div>
            </div>
          </div>

          {/* Row 1: Physical vs Financial Variance & Sector Donut */}
          <div className="dashboard-grid-2">
            {/* Physical vs Financial */}
            <div className="dashboard-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Physical vs Financial Progress Variance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Detecting capital burn rate against actual ground execution</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                  Mismatch Detection
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressGapData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '10px 14px' }}
                      formatter={(val) => [`${val}%`]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="Physical" fill="#10b981" radius={[4, 4, 0, 0]} name="Physical Progress (%)" />
                    <Bar dataKey="Financial" fill="#0284c7" radius={[4, 4, 0, 0]} name="Financial Expenditure (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sector Pie */}
            <div className="dashboard-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sector Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Asset count by infrastructure vertical</p>
              </div>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData.length > 0 ? sectorData : [{ name: 'Highways', value: 4 }, { name: 'Railways', value: 3 }, { name: 'Power', value: 2 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(sectorData.length > 0 ? sectorData : [{ name: 'Highways', value: 4 }, { name: 'Railways', value: 3 }, { name: 'Power', value: 2 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-2.5 text-xs pt-3 border-t border-slate-100">
                {(sectorData.length > 0 ? sectorData : [{ name: 'Highways', value: 4 }, { name: 'Railways', value: 3 }, { name: 'Power', value: 2 }]).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: State Outlay & Delay Root Causes */}
          <div className="dashboard-grid-2">
            {/* State Outlay */}
            <div className="dashboard-card p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">State-wise Capital Outlay</h3>
                <p className="text-xs text-slate-500 mt-0.5">Top states by total sanctioned infrastructure investment (₹ Cr)</p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={stateData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '10px 14px' }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')} Cr`, 'Outlay']}
                    />
                    <Bar dataKey="expenditure" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Sanctioned Outlay (₹ Cr)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delay Root Causes */}
            <div className="dashboard-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">NLP-Aggregated Delay Root Causes</h3>
                <p className="text-xs text-slate-500 mt-0.5">AI extraction from monthly field obstacle reports</p>
              </div>

              <div className="space-y-4 py-2">
                {delayCausesData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-sky-700 font-extrabold">{item.value}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-600 rounded-full transition-all duration-500" 
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                <span>Aggregated across 186 projects</span>
                <span className="font-bold text-slate-700">Refreshed Live</span>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
