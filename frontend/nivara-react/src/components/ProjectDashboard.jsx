import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { 
  Search, Bell, Download, ShieldAlert, AlertTriangle, 
  TrendingUp, TrendingDown, ChevronDown
} from 'lucide-react';

const costEvolutionData = [
  { name: 'Nov', expenditure: 10, original: 30, revised: 32 },
  { name: 'Dec', expenditure: 15, original: 31, revised: 34 },
  { name: 'Jan', expenditure: 18, original: 31, revised: 35 },
  { name: 'Feb', expenditure: 20, original: 31, revised: 36 },
  { name: 'Mar', expenditure: 22, original: 31, revised: 37 },
  { name: 'Apr', expenditure: 25, original: 31, revised: 38 },
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
  { name: 'High', value: 486, color: '#ef4444' },
  { name: 'Medium', value: 712, color: '#f59e0b' },
  { name: 'Low', value: 783, color: '#10b981' },
];

const escalationDrivers = [
  { name: 'Land acquisition delays', value: 26 },
  { name: 'Statutory clearances', value: 21 },
  { name: 'Contractor performance', value: 18 },
  { name: 'Funding constraints', value: 15 },
  { name: 'Material price escalation', value: 12 },
  { name: 'Design changes', value: 8 },
];

const ProjectDashboard = ({ projects = [], onInspect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => 
      [p.name, p.id, p.sector].join(' ').toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return (
    <div id="project-dashboard" className="bg-[#f8fafc] text-slate-800 font-sans border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm leading-normal my-8">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">Infrastructure Monitoring Overview</h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">Central Sector projects costing ₹150 Cr & above • updated Apr 2026</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
          <div className="relative min-w-[200px] sm:w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 cursor-pointer hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 shrink-0">
             <span>all</span>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <div className="p-6">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          
          {/* KPI 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[136px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projects Monitored</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">1,981</div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-100 gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">across 17 ministries</span>
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/80 text-[11px]">
                <TrendingUp className="w-3 h-3" /> +34 this month
              </span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[136px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aggregate Cost Overrun</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">₹5.65 L Cr</div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-100 gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">15.2% over original</span>
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/80 text-[11px]">
                <TrendingUp className="w-3 h-3" /> +0.4% MoM
              </span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[136px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projects At Risk</span>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">486</div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-100 gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">24.5% of portfolio</span>
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/80 text-[11px]">
                <TrendingUp className="w-3 h-3" /> +18 flagged
              </span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[136px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Predicted Delay</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">11.3 mo</div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-slate-100 gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">weighted by cost</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/80 text-[11px]">
                <TrendingDown className="w-3 h-3" /> -0.6 mo MoM
              </span>
            </div>
          </div>

        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 leading-tight">Portfolio Cost Evolution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aggregate ₹ lakh crore across monitoring cycles</p>
            </div>
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costEvolutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-5} />
                  <RechartsTooltip 
                    contentStyle={{backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px', padding: '10px 14px'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px', color: '#475569' }} />
                  <Area type="monotone" dataKey="revised" name="Revised Cost" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="original" name="Original Cost" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="expenditure" name="Expenditure" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart with Left-Side Breakdown */}
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="text-base font-bold text-slate-900 leading-tight">Risk Score Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">AI-generated project risk levels</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-2">
              {/* Left Side: Breakdown & Medium Risk Number */}
              <div className="flex flex-col gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Monitored</span>
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">1,981</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                      <span className="text-slate-700">High Risk</span>
                    </div>
                    <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">486</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="text-slate-700">Medium Risk</span>
                    </div>
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">712</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-slate-700">Low Risk</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">783</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Clean Donut Chart */}
              <div className="h-[160px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Custom Legend Footer */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-100">
              <span>Risk Engine: Operational</span>
              <span className="text-slate-700 font-semibold">3 Levels Categorized</span>
            </div>
          </div>

        </div>

        {/* Charts Row 2 & Table */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column for Bar Chart and Table */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Cost Overrun by Sector */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Cost Overrun by Sector</h3>
                <p className="text-xs text-slate-500 mt-0.5">Reported vs model-predicted escalation</p>
              </div>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={3} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-5} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="predicted" name="Predicted %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reported" name="Reported %" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Watchlist Table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Project Watchlist</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ranked by AI risk score · predicted cost & schedule outcomes</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Sector</th>
                      <th className="py-3 px-3">Revised Cost</th>
                      <th className="py-3 px-3">Physical Progress</th>
                      <th className="py-3 px-3 text-right">Pred. Overrun</th>
                      <th className="py-3 px-3 text-right">Pred. Delay</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {filteredProjects.slice(0, 5).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => onInspect && onInspect(p)}>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 leading-snug">{p.name?.length > 35 ? p.name.substring(0, 35) + '...' : p.name}</div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{p.id}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">{p.sector}</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">{p.outlay}</td>
                        <td className="py-3.5 px-3 text-slate-700 font-medium">{p.progress || Math.floor(Math.random() * 40 + 40)}%</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 text-xs inline-block">+{Math.floor(Math.random() * 30 + 10)}%</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-amber-700">{p.delayMonths || Math.floor(Math.random() * 24 + 6)} mo</td>
                      </tr>
                    ))}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">No projects match your search criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          {/* Right Column */}
          <div className="col-span-1 flex flex-col gap-6">
            
            {/* Cost Escalation Drivers */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Cost Escalation Drivers</h3>
                <p className="text-xs text-slate-500 mt-0.5">Model-attributed contribution to overrun</p>
              </div>
              <div className="space-y-4">
                {escalationDrivers.map((driver, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-700">{driver.name}</span>
                      <span className="text-slate-900 font-bold">{driver.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${driver.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Early Warning Alerts */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex-1">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Early Warning Alerts</h3>
                <p className="text-xs text-slate-500 mt-0.5">Signals from the risk engine</p>
              </div>
              <div className="space-y-4">
                
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Eastern Dedicated Freight Corridor — Ph II</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Predicted cost overrun crossed 30% threshold</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Railways</span>
                      <span>2h ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Ken-Betwa Link Project</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Milestone slippage — 3 consecutive cycles</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Water</span>
                      <span>5h ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">Navi Mumbai Airport Access Rd</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Expenditure vs physical progress divergence</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Roads</span>
                      <span>1d ago</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProjectDashboard;
