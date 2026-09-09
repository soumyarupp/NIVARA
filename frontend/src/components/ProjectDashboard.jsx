import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { 
  Search, AlertTriangle, TrendingUp, TrendingDown, 
  Layers, FileCheck2, Clock, MapPin, Zap, ShieldAlert, Cpu
} from 'lucide-react';

const costEvolutionData = [
  { name: 'Nov', expenditure: 10.2, original: 30.0, revised: 32.4 },
  { name: 'Dec', expenditure: 15.4, original: 31.0, revised: 34.1 },
  { name: 'Jan', expenditure: 18.8, original: 31.0, revised: 35.6 },
  { name: 'Feb', expenditure: 20.5, original: 31.0, revised: 36.8 },
  { name: 'Mar', expenditure: 22.9, original: 31.0, revised: 37.9 },
  { name: 'Apr', expenditure: 25.4, original: 31.0, revised: 38.2 },
];

const sectorData = [
  { name: 'Roads', predicted: 4.8, reported: 3.2 },
  { name: 'Railways', predicted: 7.5, reported: 4.1 },
  { name: 'Power', predicted: 3.2, reported: 2.1 },
  { name: 'Petroleum', predicted: 2.1, reported: 1.5 },
  { name: 'Water', predicted: 6.2, reported: 3.8 },
  { name: 'Coal', predicted: 5.5, reported: 3.2 },
  { name: 'Steel', predicted: 3.8, reported: 2.9 },
  { name: 'Ports', predicted: 4.2, reported: 3.0 },
];

const riskData = [
  { name: 'Critical Risk', value: 18, color: '#ef4444' },
  { name: 'High Risk', value: 26, color: '#f97316' },
  { name: 'Medium Risk', value: 44, color: '#eab308' },
  { name: 'Low Risk', value: 98, color: '#10b981' },
];

const escalationDrivers = [
  { name: 'Land Acquisition Delays', value: 28, color: '#0284c7' },
  { name: 'Statutory & Environmental Clearances', value: 24, color: '#6366f1' },
  { name: 'Contractor Performance & Mobilization', value: 20, color: '#0d9488' },
  { name: 'Funding Constraints & Allocation Gaps', value: 15, color: '#f59e0b' },
  { name: 'Material & Equipment Price Escalation', value: 13, color: '#ec4899' },
];

const clearanceBottlenecks = [
  { name: 'Forest & Wildlife Clearance Stage II', pending: 34, avgDays: '142 days', risk: 'High' },
  { name: 'State Land Acquisition Possession', pending: 28, avgDays: '188 days', risk: 'Critical' },
  { name: 'Railway Safety Commissioner Sanction', pending: 19, avgDays: '65 days', risk: 'Medium' },
  { name: 'Environmental Impact Assessment (EIA)', pending: 15, avgDays: '92 days', risk: 'Medium' },
];

const ProjectDashboard = ({ projects = [], onInspect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('YTD');

  const sectors = useMemo(() => {
    const set = new Set(projects.map(p => p.sector).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !searchQuery || [p.name, p.id, p.sector, p.state].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = sectorFilter === 'All' || p.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [projects, searchQuery, sectorFilter]);

  return (
    <div className="main-dashboard-content space-y-7 text-slate-800">
      
      {/* ===== HEADER BANNER (EXPLICIT PADDING GUARANTEED) ===== */}
      <div className="dashboard-banner flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">National Infrastructure Dashboard</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Telemetry Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Real-time project breakdown, cost evolution, sector performance, and risk distribution across 186 Mega Assets.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
            {['30D', '90D', 'YTD', 'All'].map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {range}
              </button>
            ))}
          </div>

          <Link to="/add-project" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs">
            + Add Project
          </Link>
        </div>
      </div>

      {/* ===== 4 KPI METRIC CARDS (EXPLICIT PADDING GUARANTEED) ===== */}
      <div className="dashboard-grid-4">
        
        {/* KPI 1: Monitored Projects */}
        <div className="kpi-card">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                <Layers size={18} />
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80 shrink-0">
                <TrendingUp size={13} /> +12.5%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">186</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Monitored Mega Projects</div>
            <div className="text-[11px] text-slate-400 mt-0.5">17 Nodal Ministries</div>
          </div>
        </div>

        {/* KPI 2: Total Monitored Outlay */}
        <div className="kpi-card">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                <FileCheck2 size={18} />
              </span>
              <span className="text-xs font-bold text-sky-600 flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100/80 shrink-0">
                100% Capital
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">₹48.2 L Cr</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Total Monitored Outlay</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sanctioned Capital Cover</div>
          </div>
        </div>

        {/* KPI 3: Projects at Risk */}
        <div className="kpi-card">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                <AlertTriangle size={18} />
              </span>
              <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full border border-red-100/80 shrink-0">
                <TrendingUp size={13} /> 18 Critical
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight mt-3">44</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Projects Flagged at Risk</div>
            <div className="text-[11px] text-slate-400 mt-0.5">23.7% of Active Portfolio</div>
          </div>
        </div>

        {/* KPI 4: Avg Predicted Delay */}
        <div className="kpi-card">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <Clock size={18} />
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80 shrink-0">
                <TrendingDown size={13} /> -0.6 mo MoM
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-3">11.3 Months</div>
            <div className="text-xs font-bold text-slate-700 mt-1">Avg. Predicted Delay</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cost-weighted Average</div>
          </div>
        </div>

      </div>

      {/* ===== PRIMARY ANALYTICS (2-COLUMN GRID) ===== */}
      <div className="dashboard-grid-2">
        
        {/* Portfolio Cost Evolution (Area Chart) */}
        <div className="dashboard-card flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Portfolio Cost Evolution</h2>
              <p className="text-xs text-slate-500 mt-0.5">₹ Lakh Crore expenditure vs cost sanctions</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Revised</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Original</span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-2} />
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', padding: '10px 14px'}}
                />
                <Area type="monotone" dataKey="revised" name="Revised Cost (₹L Cr)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="original" name="Original Sanction (₹L Cr)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
                <Area type="monotone" dataKey="expenditure" name="Actual Expenditure (₹L Cr)" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score Distribution (Donut Chart) */}
        <div className="dashboard-card flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Risk Score Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Project risk categorization breakdown</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
            <div className="space-y-2.5">
              {riskData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-bold">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{item.value} Projects</span>
                </div>
              ))}
            </div>

            <div className="h-[190px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', padding: '8px 12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Risk Forewarning Active</span>
            <strong className="text-slate-800 font-bold">186 Categorized</strong>
          </div>
        </div>

      </div>

      {/* ===== SECTOR BREAKDOWN & ESCALATION DRIVERS ===== */}
      <div className="dashboard-grid-2">
        
        {/* Sector Cost Overrun (Bar Chart) */}
        <div className="dashboard-card">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Sector-Wise Cost Overruns</h2>
            <p className="text-xs text-slate-500 mt-0.5">Reported vs model-predicted escalation %</p>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-2} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="predicted" name="Predicted Overrun %" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="reported" name="Reported Overrun %" fill="#14b8a6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Escalation Drivers */}
        <div className="dashboard-card flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Cost Escalation Drivers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Model-attributed contribution factors</p>
          </div>

          <div className="space-y-3.5 my-3">
            {escalationDrivers.map((driver, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1 font-semibold text-slate-700">
                  <span>{driver.name}</span>
                  <span className="font-bold text-slate-900">{driver.value}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${driver.value}%`, backgroundColor: driver.color }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Primary Factor: Land Possession</span>
            <Link to="/reports" className="text-sky-600 font-bold hover:underline">Detailed Audit &rarr;</Link>
          </div>
        </div>

      </div>

      {/* ===== HIGH-PRIORITY PROJECT WATCHLIST TABLE ===== */}
      <div className="dashboard-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Central Sector Watchlist</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by risk score, outlay, and delay timeline</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Search Input (Flex Container for perfect icon placement in front of text) */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 min-w-[280px] sm:min-w-[320px] focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/10 transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
              />
            </div>

            {/* Sector Selector */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-4 py-2 outline-none focus:border-sky-500 cursor-pointer hover:bg-slate-100/80 transition-all"
            >
              {sectors.map((s, i) => (
                <option key={i} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Project &amp; ID</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Outlay</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-right">Risk Score</th>
                <th className="py-3 px-4 text-right">Pred. Delay</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredProjects.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                      {p.sector}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium"><MapPin size={12} className="text-slate-400" /> {p.state || 'Pan India'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.outlay}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.progress || 65}%` }}></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{p.progress || 65}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border inline-block ${
                      p.riskLevel === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      p.riskLevel === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {p.riskLevel || 'Medium'} ({p.riskScore || 78})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-700">
                    +{p.delayMonths || 12} mo
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button 
                      type="button" 
                      onClick={() => onInspect && onInspect(p)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200/80 transition-all"
                    >
                      Inspect &rarr;
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">
                    No projects found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TELEMETRY & STATUTORY CLEARANCE (2-COLUMN GRID) ===== */}
      <div className="dashboard-grid-2">
        
        {/* Early Warning Signals Feed */}
        <div className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Early Warning Signals</h2>
              <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                18 Active Risk Flags
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Eastern Dedicated Freight Corridor</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Predicted cost overrun crossed 30% threshold due to land acquisition dispute.</p>
                  <span className="text-[11px] font-bold text-red-600 mt-1 block">Railways • 15m ago</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Ken-Betwa Link Water Transfer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Forest clearance pending for 3 consecutive quarterly cycles.</p>
                  <span className="text-[11px] font-bold text-amber-700 mt-1 block">Water Resources • 2h ago</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Navi Mumbai Airport Link Expressway</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Expenditure vs physical progress divergence detected by AI engine.</p>
                  <span className="text-[11px] font-bold text-sky-700 mt-1 block">Road Transport • 5h ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-center">
            <Link to="/reports" className="text-xs font-bold text-sky-600 hover:text-sky-800">
              View All 18 Early Warning Risk Reports &rarr;
            </Link>
          </div>
        </div>

        {/* Clearance Bottleneck Tracker */}
        <div className="dashboard-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Statutory Clearance Tracker</h2>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                96 Pending Sanctions
              </span>
            </div>

            <div className="space-y-3">
              {clearanceBottlenecks.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-900 mb-0.5">
                    <span>{item.name}</span>
                    <span className={item.risk === 'Critical' ? 'text-red-600 font-extrabold' : 'text-amber-600 font-bold'}>{item.pending} Pending</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Processing Latency:</span>
                    <strong className="text-slate-700 font-bold">{item.avgDays}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-center">
            <Link to="/reports" className="text-xs font-bold text-sky-600 hover:text-sky-800">
              Download Statutory Clearance Audit &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* ===== SIMPLE MINIMAL AI ENGINES QUICK LAUNCHER ===== */}
      <div className="dashboard-banner flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu size={16} className="text-sky-600" /> NIVARA AI Predictive Engines
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Run delay simulations, audit funding mismatches, and classify contractor reports.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/risk-intelligence" className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-sky-600 transition-all shadow-xs">
            Delay Simulator &rarr;
          </Link>
          <Link to="/risk-intelligence" className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-sky-600 transition-all shadow-xs">
            Fund Mismatch Detector &rarr;
          </Link>
          <Link to="/risk-intelligence" className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-sky-600 transition-all shadow-xs">
            NLP Delay Classifier &rarr;
          </Link>
        </div>
      </div>

    </div>
  );
};

export default ProjectDashboard;
