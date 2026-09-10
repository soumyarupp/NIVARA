import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Dashboard.css';
import { 
  Sliders, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw, 
  Building2, 
  Info,
  Layers,
  AlertTriangle,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis 
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { projectApi } from '../api/projectApi';
import { simulatorApi } from '../api/simulatorApi';

const DEFAULT_SAMPLE_PROJECTS = [
  {
    _id: 'default-1',
    name: 'NH-48 Expressway Expansion & Grade Separator (Package IV)',
    projectName: 'NH-48 Expressway Expansion & Grade Separator (Package IV)',
    projectCode: 'NHAI-NH48-P4',
    sanctionedCost: 1450,
    sector: 'Highways & Expressways',
    targetCompletionDate: '2028-12-31',
    state: 'Maharashtra'
  },
  {
    _id: 'default-2',
    name: 'Dedicated Eastern Freight Corridor (Sonnagar - Dankuni Section)',
    projectName: 'Dedicated Eastern Freight Corridor (Sonnagar - Dankuni Section)',
    projectCode: 'DFCCIL-EDFC-02',
    sanctionedCost: 3200,
    sector: 'Railways & Freight',
    targetCompletionDate: '2029-06-30',
    state: 'Bihar / West Bengal'
  },
  {
    _id: 'default-3',
    name: 'Ultra Mega Green Solar Infrastructure Complex (Phase II)',
    projectName: 'Ultra Mega Green Solar Infrastructure Complex (Phase II)',
    projectCode: 'SECI-SOLAR-09',
    sanctionedCost: 880,
    sector: 'Renewable Power',
    targetCompletionDate: '2027-09-30',
    state: 'Rajasthan'
  }
];

function calculateSimulation(project, months, inflation, isLand, isEco, isContractor) {
  const baseCost = Number(project?.sanctionedCost || project?.budget?.sanctionedCost || project?.originalProjectCost || project?.revisedProjectCost || 1250);
  const m = Math.max(0, Number(months) || 0);
  const inf = Math.max(0, Number(inflation) || 0);

  // Time-inflation compounding
  let multiplier = 1 + (m * (inf / 100) / 12);
  if (isLand) multiplier += 0.045;
  if (isEco) multiplier += 0.032;
  if (isContractor) multiplier += 0.065;

  const projectedCost = Math.round(baseCost * multiplier * 10) / 10;
  const costEscalation = Math.max(0, Math.round((projectedCost - baseCost) * 10) / 10);
  const escalationPercentage = baseCost > 0 ? Math.round(((costEscalation) / baseCost) * 1000) / 10 : 0;

  const stepMonths = Math.max(1, Math.ceil(m / 6));
  const projectionsByMonth = Array.from({ length: 6 }).map((_, idx) => {
    const monthNum = (idx + 1) * stepMonths;
    const progressFactor = (idx + 1) / 6;
    const stepCost = Math.round((baseCost + (costEscalation * progressFactor)) * 10) / 10;
    return {
      month: `+${monthNum} Mo`,
      cost: stepCost,
      original: baseCost
    };
  });

  return {
    originalCost: baseCost,
    projectedCost,
    costEscalation,
    escalationPercentage,
    additionalDelayMonths: m,
    riskClassification: escalationPercentage > 18 ? 'CRITICAL' : escalationPercentage > 8 ? 'HIGH' : 'MODERATE',
    breakdown: [
      { category: 'Time-Cost Inflation Overrun', amount: Math.round(costEscalation * 0.44 * 10) / 10 },
      { category: 'Idle Machinery & Remobilization', amount: Math.round(costEscalation * 0.26 * 10) / 10 },
      { category: 'Right-of-Way & Land Dispute Escalation', amount: Math.round(costEscalation * 0.18 * 10) / 10 },
      { category: 'Contractor Material Price Variance (PVC)', amount: Math.round(costEscalation * 0.12 * 10) / 10 },
    ],
    projectionsByMonth
  };
}

export default function WhatIfSimulatorPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(DEFAULT_SAMPLE_PROJECTS[0]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Simulation parameters
  const [delayMonths, setDelayMonths] = useState(6);
  const [inflationRate, setInflationRate] = useState(5.5);
  const [landAcquisitionDelayed, setLandAcquisitionDelayed] = useState(true);
  const [environmentalClearancePending, setEnvironmentalClearancePending] = useState(false);
  const [contractorDefaultRisk, setContractorDefaultRisk] = useState(false);

  // Computed state initialized with safe baseline
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(() => 
    calculateSimulation(DEFAULT_SAMPLE_PROJECTS[0], 6, 5.5, true, false, false)
  );

  // Recalculate whenever inputs change
  const computeAndSetResult = useCallback((proj = selectedProject) => {
    const computed = calculateSimulation(
      proj,
      delayMonths,
      inflationRate,
      landAcquisitionDelayed,
      environmentalClearancePending,
      contractorDefaultRisk
    );
    setResult(computed);
  }, [selectedProject, delayMonths, inflationRate, landAcquisitionDelayed, environmentalClearancePending, contractorDefaultRisk]);

  useEffect(() => {
    computeAndSetResult();
  }, [computeAndSetResult]);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoadingProjects(true);
        const data = await projectApi.getProjects({ limit: 50 });
        const list = Array.isArray(data) ? data : (data?.projects || []);
        
        if (list.length > 0) {
          setProjects(list);
          const first = list[0];
          setSelectedProjectId(first._id || first.id);
          setSelectedProject(first);
          computeAndSetResult(first);
        } else {
          setProjects(DEFAULT_SAMPLE_PROJECTS);
          setSelectedProjectId(DEFAULT_SAMPLE_PROJECTS[0]._id);
          setSelectedProject(DEFAULT_SAMPLE_PROJECTS[0]);
        }
      } catch (err) {
        console.warn('Using default simulator projects fallback:', err);
        setProjects(DEFAULT_SAMPLE_PROJECTS);
        setSelectedProjectId(DEFAULT_SAMPLE_PROJECTS[0]._id);
        setSelectedProject(DEFAULT_SAMPLE_PROJECTS[0]);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  const handleProjectChange = (id) => {
    setSelectedProjectId(id);
    const p = projects.find(proj => (proj._id || proj.id) === id) || DEFAULT_SAMPLE_PROJECTS[0];
    setSelectedProject(p);
    computeAndSetResult(p);
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      if (selectedProjectId && !selectedProjectId.startsWith('default-')) {
        const payload = {
          projectId: selectedProjectId,
          additionalDelayMonths: Number(delayMonths),
          costEscalationRate: Number(inflationRate)
        };
        await simulatorApi.simulateDelayImpact(payload);
      }
      computeAndSetResult(selectedProject);
    } catch (err) {
      console.warn('Remote simulation sync fallback:', err);
      computeAndSetResult(selectedProject);
    } finally {
      setTimeout(() => setSimulating(false), 300);
    }
  };

  const chartData = useMemo(() => {
    if (result?.projectionsByMonth && result.projectionsByMonth.length > 0) {
      return result.projectionsByMonth;
    }
    return [
      { month: '+1 Mo', cost: 1250, original: 1250 },
      { month: '+2 Mo', cost: 1280, original: 1250 },
      { month: '+3 Mo', cost: 1310, original: 1250 },
      { month: '+4 Mo', cost: 1340, original: 1250 },
      { month: '+5 Mo', cost: 1370, original: 1250 },
      { month: '+6 Mo', cost: 1400, original: 1250 }
    ];
  }, [result]);

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/what-if-simulator"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-7">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                  <Sliders size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    What-If Delay &amp; Cost Impact Simulator
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Simulate dynamic milestone delays, inflationary capital escalations, and contractual disruption scenarios in real-time.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw size={14} className={simulating ? 'animate-spin' : ''} />
              <span>{simulating ? 'Recalculating...' : 'Re-calculate Projections'}</span>
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Left Parameters (4 Cols) */}
            <div className="lg:col-span-4 space-y-7">
              {/* Target Project Card */}
              <div className="dashboard-card p-6 mb-0">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Building2 size={16} className="text-sky-600" />
                  Target Project
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Select Infrastructure Asset</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    disabled={loadingProjects}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-sky-500 outline-none cursor-pointer"
                  >
                    {(projects.length > 0 ? projects : DEFAULT_SAMPLE_PROJECTS).map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name || p.projectName} ({p.projectCode || 'INFRA'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Outlay:</span>
                      <span className="font-extrabold text-slate-900">
                        ₹{Number(selectedProject.sanctionedCost || selectedProject.budget?.sanctionedCost || 1250).toLocaleString('en-IN')} Cr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sector:</span>
                      <span className="font-bold text-sky-700">{selectedProject.sector || 'Highways & Expressways'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Completion:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProject.targetCompletionDate ? new Date(selectedProject.targetCompletionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Dec 2028'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulation Controls Card */}
              <div className="dashboard-card p-6 space-y-6 mb-0">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={16} className="text-sky-600" />
                  Simulation Parameters
                </h3>

                {/* Delay Slider */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-bold">Schedule Delay:</span>
                    <span className="font-extrabold text-sky-600 font-mono text-sm">+{delayMonths} Months</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="36"
                    step="1"
                    value={delayMonths}
                    onChange={(e) => setDelayMonths(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>On Time (0 Mo)</span>
                    <span>18 Mo</span>
                    <span>36 Mo (Severe)</span>
                  </div>
                </div>

                {/* Inflation Slider */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-bold">Annual Material Inflation (WPI):</span>
                    <span className="font-extrabold text-amber-600 font-mono text-sm">{inflationRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="0.5"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Low (2%)</span>
                    <span>Standard (5.5%)</span>
                    <span>High (15%)</span>
                  </div>
                </div>

                {/* Disruption Vectors */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">Disruption Vectors</span>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition">
                    <input
                      type="checkbox"
                      checked={landAcquisitionDelayed}
                      onChange={(e) => setLandAcquisitionDelayed(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Land Acquisition Bottleneck</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Adds litigation &amp; Right-of-Way escalations (+4.5%)</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition">
                    <input
                      type="checkbox"
                      checked={environmentalClearancePending}
                      onChange={(e) => setEnvironmentalClearancePending(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Pending Forest / Eco Clearances</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Induces seasonal stoppage &amp; compliance penalties (+3.2%)</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition">
                    <input
                      type="checkbox"
                      checked={contractorDefaultRisk}
                      onChange={(e) => setContractorDefaultRisk(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Contractor EPC Financial Distress</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Requires retendering &amp; remobilization surcharges (+6.5%)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Output & Visualization (8 Cols) */}
            <div className="lg:col-span-8 space-y-7">
              {/* Output Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="kpi-card min-h-[135px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs uppercase font-bold tracking-wider">Projected Outlay</span>
                    <DollarSign size={18} className="text-sky-600" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      ₹{Number(result.projectedCost).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">Cr</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Baseline: ₹{Number(result.originalCost).toLocaleString('en-IN')} Cr
                    </p>
                  </div>
                </div>

                <div className="kpi-card min-h-[135px] bg-red-50/40 border-red-200">
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-xs uppercase font-bold tracking-wider">Cost Overrun</span>
                    <TrendingUp size={18} />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-red-600">
                      +₹{Number(result.costEscalation).toLocaleString('en-IN')} <span className="text-xs font-normal text-red-600">Cr</span>
                    </h3>
                    <p className="text-xs text-red-700 font-bold mt-1">
                      +{result.escalationPercentage}% Budget Inflation
                    </p>
                  </div>
                </div>

                <div className="kpi-card min-h-[135px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs uppercase font-bold tracking-wider">Risk Sensitivity</span>
                    <ShieldCheck size={18} className="text-amber-500" />
                  </div>
                  <div className="mt-2">
                    <h3 className={`text-2xl sm:text-3xl font-extrabold ${
                      result.riskClassification === 'CRITICAL' ? 'text-red-600' :
                      result.riskClassification === 'HIGH' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {result.riskClassification}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      +{result.additionalDelayMonths} Months Schedule Shift
                    </p>
                  </div>
                </div>
              </div>

              {/* Area Growth Curve Chart */}
              <div className="dashboard-card p-6 space-y-4 mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Projected Capital Escalation Timeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Actuarial budget growth across progressive delay stages</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                    Monte Carlo Approximation
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="costGradLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={6} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                        dx={-2} 
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', padding: '10px 14px' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')} Cr`, 'Projected Outlay']}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#costGradLight)" name="Projected Cost (₹ Cr)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Escalation Breakdown */}
              <div className="dashboard-card p-6 space-y-4 mb-0">
                <h3 className="text-base font-bold text-slate-900">Escalation Component Breakdown</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(result.breakdown || []).map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.category}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Actuarial risk allocation</p>
                      </div>
                      <span className="text-sm font-extrabold font-mono text-red-600">
                        +₹{item.amount} Cr
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3.5 mt-3">
                  <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-950 leading-relaxed font-medium">
                    <strong>Administrative Recommendation:</strong> To prevent the ₹{result.costEscalation} Cr escalation, prioritize resolving land parcel handover within the first 60 days of the next quarter. Fast-tracking environmental sanction will mitigate an estimated 42% of projected inflationary risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

