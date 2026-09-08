import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { 
  Search, Bell, Download, LayoutDashboard, FolderKanban, 
  LineChart, ShieldAlert, AlertTriangle, Bot, FileText,
  TrendingUp, TrendingDown, ChevronDown
} from 'lucide-react';

import dashboardApi from '../api/dashboardApi';
import projectApi from '../api/projectApi';

// Modals from existing setup
import AlertsModal from '../components/AlertsModal';
import AIChatModal from '../components/AIChatModal';
import DelayClassifierModal from '../components/DelayClassifierModal';
import MismatchDetectorModal from '../components/MismatchDetectorModal';
import PreApprovalSimulatorModal from '../components/PreApprovalSimulatorModal';
import WhatIfSimulatorModal from '../components/WhatIfSimulatorModal';
import ReportsView from '../components/ReportsView';

import './Dashboard.css'; 

// Mock Data for Charts
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

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const projRes = await projectApi.getProjects();
        if (projRes && projRes.projects) {
          setProjects(projRes.projects);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0f172a] text-slate-300 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight tracking-wide">PAIMANA</h1>
            <p className="text-xs text-slate-400">Predictive Monitoring</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-500/10 text-blue-400 rounded-lg font-medium text-sm">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <FolderKanban className="w-4 h-4" /> Projects
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <TrendingUp className="w-4 h-4" /> Predictions
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <ShieldAlert className="w-4 h-4" /> Risk Analysis
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4" /> Early Warnings
            </div>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">12</span>
          </a>
          <a href="#" onClick={() => setActiveModal('chat')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <Bot className="w-4 h-4" /> Intelligence Assistant
          </a>
          <a href="#" onClick={() => setActiveModal('reports')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
            <FileText className="w-4 h-4" /> Reports
          </a>
          
          <div className="pt-6 mt-6 border-t border-slate-800">
             <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white transition-colors text-sm">
               Add Project / Update
             </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Infrastructure Monitoring Overview</h2>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded border border-green-200">Live</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Central Sector projects costing ₹150 Cr & above • updated Apr 2026</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-[240px]"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
               <span className="text-sm text-slate-600">all</span>
               <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Bell className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 bg-[#f8fafc]">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Projects Monitored</h3>
              <div className="text-4xl font-bold text-slate-800 mb-3">1,981</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">across 17 ministries</span>
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +34 this month
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Aggregate Cost Overrun</h3>
              <div className="text-4xl font-bold text-slate-800 mb-3">₹5.65 L Cr</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">15.2% over original</span>
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +0.4% MoM
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Projects At Risk</h3>
              <div className="text-4xl font-bold text-slate-800 mb-3">486</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">24.5% of portfolio</span>
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +18 flagged
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Avg. Predicted Delay</h3>
              <div className="text-4xl font-bold text-slate-800 mb-3">11.3 mo</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">weighted by cost</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -0.6 mo MoM
                </span>
              </div>
            </div>

          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            
            {/* Area Chart */}
            <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800">Portfolio Cost Evolution</h3>
                <p className="text-sm text-slate-500">Aggregate ₹ lakh crore across monitoring cycles</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="revised" name="Revised Cost" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="original" name="Original Cost" stroke="#3b82f6" strokeWidth={2} fill="none" />
                    <Area type="monotone" dataKey="expenditure" name="Expenditure" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-bold text-slate-800">Risk Score Distribution</h3>
                <p className="text-sm text-slate-500">AI-generated project risk levels</p>
              </div>
              <div className="flex-1 relative flex items-center justify-center min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Inner Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="text-2xl font-bold text-slate-800">1,981</span>
                  <span className="text-xs text-slate-500">Projects</span>
                </div>
              </div>
              
              {/* Custom Legend */}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                {riskData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></span>
                    {d.name} · {d.value}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Charts Row 2 & Table */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Column for Bar Chart and Table */}
            <div className="col-span-2 flex flex-col gap-6">
              
              {/* Cost Overrun by Sector */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">Cost Overrun by Sector</h3>
                  <p className="text-sm text-slate-500">Reported vs model-predicted escalation</p>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => `${val}%`} />
                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                      <Bar dataKey="predicted" name="Predicted %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reported" name="Reported %" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Project Watchlist Table */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">Project Watchlist</h3>
                  <p className="text-sm text-slate-500">Ranked by AI risk score · predicted cost & schedule outcomes</p>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Project</th>
                        <th className="pb-3 font-semibold">Sector</th>
                        <th className="pb-3 font-semibold">Revised Cost</th>
                        <th className="pb-3 font-semibold">Physical Progress</th>
                        <th className="pb-3 font-semibold text-right">Pred. Overrun</th>
                        <th className="pb-3 font-semibold text-right">Pred. Delay</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {projects.slice(0, 5).map((p, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setActiveModal('reports')}>
                          <td className="py-3 pr-4">
                            <div className="font-bold text-slate-800">{p.name.length > 35 ? p.name.substring(0, 35) + '...' : p.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{p.id}</div>
                          </td>
                          <td className="py-3 text-slate-600">{p.sector}</td>
                          <td className="py-3 font-medium">{p.outlay}</td>
                          <td className="py-3 text-slate-600">{p.progress || Math.floor(Math.random() * 40 + 40)}%</td>
                          <td className="py-3 text-right">
                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">+{Math.floor(Math.random() * 30 + 10)}%</span>
                          </td>
                          <td className="py-3 text-right font-medium text-slate-700">{p.delayMonths || Math.floor(Math.random() * 24 + 6)} mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>

            {/* Right Column */}
            <div className="col-span-1 flex flex-col gap-6">
              
              {/* Cost Escalation Drivers */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">Cost Escalation Drivers</h3>
                  <p className="text-sm text-slate-500">Model-attributed contribution to overrun</p>
                </div>
                <div className="space-y-5">
                  {escalationDrivers.map((driver, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{driver.name}</span>
                        <span className="text-slate-500">{driver.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${driver.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Early Warning Alerts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">Early Warning Alerts</h3>
                  <p className="text-sm text-slate-500">Signals from the risk engine</p>
                </div>
                <div className="space-y-4">
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200 mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Eastern Dedicated Freight Corridor — Ph II</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Predicted cost overrun crossed 30% threshold</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Railways</span>
                        <span>2h ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200 mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Ken-Betwa Link Project</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Milestone slippage — 3 consecutive cycles</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Water</span>
                        <span>5h ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 border border-yellow-200 mt-1">
                      <ShieldAlert className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Navi Mumbai Airport Access Rd</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Expenditure vs physical progress divergence</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Roads</span>
                        <span>1d ago</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
          
        </div>
      </main>

      {/* Legacy Modals */}
      {activeModal === 'alerts' && <AlertsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'chat' && <AIChatModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'delay' && <DelayClassifierModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'mismatch' && <MismatchDetectorModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'preapproval' && <PreApprovalSimulatorModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'whatif' && <WhatIfSimulatorModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'reports' && <ReportsView onClose={() => setActiveModal(null)} />}
      
    </div>
  );
};

export default Dashboard;
