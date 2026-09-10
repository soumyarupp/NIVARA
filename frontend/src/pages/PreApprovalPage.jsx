import React, { useState } from 'react';
import './Dashboard.css';
import { 
  FileCheck, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { simulatorApi } from '../api/simulatorApi';

export default function PreApprovalPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    sector: 'Highways & Expressways',
    budget: 2500,
    plannedDurationMonths: 36,
    terrainType: 'Urban Dense / Mixed',
    landAcquiredPercent: 65,
    forestClearanceRequired: true,
    wildlifeClearanceRequired: false,
    utilityShiftingComplexity: 'High',
    epcContractorExperience: 'Tier 1 (>10 Yrs Experience)',
    geotechnicalRisk: 'Moderate'
  });

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const calculateRiskScore = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await simulatorApi.simulatePreApproval(formData);
      setAnalysisResult(res.data || res);
    } catch (err) {
      console.warn('Backend pre-approval simulation endpoint fallback:', err);
      let score = 85;
      if (formData.landAcquiredPercent < 70) score -= 20;
      if (formData.forestClearanceRequired) score -= 10;
      if (formData.wildlifeClearanceRequired) score -= 15;
      if (formData.utilityShiftingComplexity === 'High') score -= 10;
      if (formData.terrainType.includes('Hilly') || formData.terrainType.includes('Urban')) score -= 8;
      
      const feasibilityScore = Math.max(25, Math.min(95, score));
      const riskTier = feasibilityScore > 75 ? 'LOW_RISK' : feasibilityScore > 50 ? 'MODERATE_RISK' : 'HIGH_RISK';
      
      setAnalysisResult({
        feasibilityScore,
        riskTier,
        predictedOverrunMonths: feasibilityScore < 50 ? 14 : feasibilityScore < 75 ? 6 : 2,
        costEscalationLikelihood: feasibilityScore < 50 ? '78%' : feasibilityScore < 75 ? '42%' : '14%',
        radarData: [
          { subject: 'Land Readiness', A: formData.landAcquiredPercent, fullMark: 100 },
          { subject: 'Regulatory Clearances', A: formData.forestClearanceRequired ? 40 : 85, fullMark: 100 },
          { subject: 'Topography Risk', A: formData.terrainType.includes('Hilly') ? 35 : 75, fullMark: 100 },
          { subject: 'Contractor Capacity', A: 85, fullMark: 100 },
          { subject: 'Utility Realignment', A: formData.utilityShiftingComplexity === 'High' ? 40 : 80, fullMark: 100 },
        ],
        recommendations: [
          formData.landAcquiredPercent < 80 ? 'Condition sanction on achieving min 80% physical possession before issuing LOA.' : 'Land acquisition buffer is sufficient.',
          formData.forestClearanceRequired ? 'Stage-1 in-principle MoEFCC clearance mandatory prior to financial closure.' : 'Standard environmental compliance applies.',
          formData.utilityShiftingComplexity === 'High' ? 'Execute joint utility shifting MoU with State PWD/Discom before civil mobilization.' : 'Utility shifting risks within acceptable tolerance.'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/pre-approval-risk"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                  <FileCheck size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Pre-Approval Feasibility & Risk Predictor
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Evaluate DPR parameters before sanctioning to identify potential bottlenecks, cost escalations, and timeline slippages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Input Form (5 cols) */}
            <div className="lg:col-span-5 dashboard-card p-7 space-y-5 mb-0">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-600" />
                Project Proposal Parameters (DPR)
              </h3>

              <form onSubmit={calculateRiskScore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Proposed Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6-Lane Western Ring Road Expressway"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Sector</label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="Highways & Expressways">Highways & Expressways</option>
                      <option value="Railways & DFC">Railways & DFC</option>
                      <option value="Power & Grid Transmission">Power & Grid Transmission</option>
                      <option value="Ports & Maritime">Ports & Maritime</option>
                      <option value="Urban Metro / Mass Transit">Urban Metro / Mass Transit</option>
                      <option value="Petroleum & Gas Pipeline">Petroleum & Gas Pipeline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Budget (₹ Cr)</label>
                    <input
                      type="number"
                      required
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (Months)</label>
                    <input
                      type="number"
                      value={formData.plannedDurationMonths}
                      onChange={(e) => setFormData({ ...formData, plannedDurationMonths: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Terrain Complexity</label>
                    <select
                      value={formData.terrainType}
                      onChange={(e) => setFormData({ ...formData, terrainType: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="Plain / Rural">Plain / Rural</option>
                      <option value="Urban Dense / Mixed">Urban Dense / Mixed</option>
                      <option value="Hilly / Mountainous (Seismic)">Hilly / Mountainous</option>
                      <option value="Coastal / Mangrove">Coastal / Mangrove</option>
                      <option value="Riverine / Flood Prone">Riverine / Flood Prone</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Land Acquired Prior to Award:</span>
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">{formData.landAcquiredPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.landAcquiredPercent}
                    onChange={(e) => setFormData({ ...formData, landAcquiredPercent: e.target.value })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 font-medium block">Ministry guidelines recommend &gt;80% land before sanction.</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.forestClearanceRequired}
                      onChange={(e) => setFormData({ ...formData, forestClearanceRequired: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4"
                    />
                    Forest Clearance
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.wildlifeClearanceRequired}
                      onChange={(e) => setFormData({ ...formData, wildlifeClearanceRequired: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4"
                    />
                    Wildlife Eco-Zone
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-5"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Run AI Feasibility Assessment
                </button>
              </form>
            </div>

            {/* Analysis Results (7 cols) */}
            <div className="lg:col-span-7 space-y-7">
              {!analysisResult ? (
                <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-10 dashboard-card text-center mb-0">
                  <FileCheck size={52} className="text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Ready for Feasibility Assessment</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                    Fill in the proposal parameters and click "Run AI Feasibility Assessment" to predict risk exposure before financial sanction.
                  </p>
                </div>
              ) : (
                <div className="space-y-7">
                  {/* Score Top Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="kpi-card min-h-[130px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feasibility Score</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className={`text-3xl font-extrabold ${
                          analysisResult.feasibilityScore > 75 ? 'text-emerald-600' :
                          analysisResult.feasibilityScore > 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {analysisResult.feasibilityScore}/100
                        </h3>
                        <span className="text-xs text-slate-400 font-bold">Index</span>
                      </div>
                    </div>

                    <div className="kpi-card min-h-[130px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Delay Risk</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-extrabold text-amber-600">
                          +{analysisResult.predictedOverrunMonths} Mo
                        </h3>
                        <span className="text-xs text-slate-400 font-bold">Overrun</span>
                      </div>
                    </div>

                    <div className="kpi-card min-h-[130px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escalation Probability</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-extrabold text-red-600">
                          {analysisResult.costEscalationLikelihood}
                        </h3>
                        <span className="text-xs text-slate-400 font-bold">Likelihood</span>
                      </div>
                    </div>
                  </div>

                  {/* Radar Assessment Chart */}
                  <div className="dashboard-card p-6 space-y-4 mb-0">
                    <h3 className="text-base font-bold text-slate-900">Multi-Dimensional Risk Vector Analysis</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysisResult.radarData || []}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                          <PolarRadiusAxis stroke="#cbd5e1" angle={30} domain={[0, 100]} />
                          <Radar name="Readiness Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="dashboard-card p-6 space-y-3.5 mb-0">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      AI Pre-Sanction Advisory & Safeguards
                    </h3>
                    <div className="space-y-2.5">
                      {analysisResult.recommendations?.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
