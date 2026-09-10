import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Layers, Building2, TrendingUp, X, FileText, CheckCircle2,
  AlertTriangle, ArrowUpRight, ArrowRight, ArrowLeft, Check, Calendar,
  DollarSign, MapPin, ShieldCheck, Clock, Plus, Trash2, Info, Send,
  Landmark, UserCheck, RefreshCw, Compass, Award, Briefcase, FileSpreadsheet,
  Zap, Save, CheckCheck
} from 'lucide-react';
import './Dashboard.css';

const SECTORS_DATA = {
  "Roads & Highways": [
    "Access-Controlled National Expressways",
    "Economic & Logistic Corridors",
    "Strategic High-Altitude Tunnels",
    "Coastal & Border Highways",
    "Ring Roads & Bypass Infrastructure"
  ],
  "Railways": [
    "Dedicated Freight Corridors",
    "High-Speed & Semi-High Speed Rail",
    "Track Doubling & Electrification",
    "Station Redevelopment & Modernization",
    "Signaling, Telecomm & Kavach Deployments"
  ],
  "Urban Transit": [
    "Metro Rail Corridors (Underground/Elevated)",
    "Regional Rapid Transit System (RRTS)",
    "Light Metro / MetroLite",
    "Multi-Modal Urban Transit Hubs",
    "Bus Rapid Transit (BRTS)"
  ],
  "Power & Energy": [
    "Hydroelectric Mega Projects",
    "Ultra Mega Solar Power Parks",
    "High-Voltage Green Energy Corridors",
    "Offshore & Onshore Wind Energy",
    "Battery Energy Storage Systems (BESS)"
  ],
  "Ports & Shipping": [
    "Deep Sea Container Transshipment Ports",
    "Coastal Cargo & Bulk Berths",
    "National Inland Waterways Corridors",
    "Port Connectivity Roads & Rail Evacuation"
  ],
  "Petroleum & Natural Gas": [
    "Cross-Country Gas Transmission Pipelines",
    "Strategic Crude Oil Reserves (SPR)",
    "LNG Regasification Terminals",
    "City Gas Distribution (CGD) Networks"
  ],
  "Aviation & Aerospace": [
    "Greenfield International Airports",
    "Runway Expansion & New Terminal Buildings",
    "Integrated Air Cargo Hubs",
    "Heliports & Regional Connectivity (UDAN)"
  ],
  "Water & Irrigation": [
    "Inter-State River Linking Projects",
    "Multi-purpose Barrages & Dams",
    "Lift Irrigation & Canal Distribution",
    "National River Conservation Works"
  ]
};

const MINISTRIES = [
  "Ministry of Road Transport and Highways",
  "Ministry of Railways",
  "Ministry of Housing and Urban Affairs",
  "Ministry of Power",
  "Ministry of Ports, Shipping and Waterways",
  "Ministry of Petroleum and Natural Gas",
  "Ministry of Civil Aviation",
  "Ministry of Jal Shakti"
];

const AGENCIES = [
  "National Highways Authority of India (NHAI)",
  "National Highways and Infrastructure Development Corporation (NHIDCL)",
  "Dedicated Freight Corridor Corporation of India (DFCCIL)",
  "National High Speed Rail Corporation (NHSRCL)",
  "National Capital Region Transport Corporation (NCRTC)",
  "National Thermal Power Corporation (NTPC)",
  "Power Grid Corporation of India (POWERGRID)",
  "Inland Waterways Authority of India (IWAI)"
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh"
];

const STEPS = [
  { step: 1, label: "Basic Details", desc: "Identity & Scope" },
  { step: 2, label: "Financials & Outlay", desc: "Budget & Funding Pattern" },
  { step: 3, label: "Timeline & Milestones", desc: "Schedule & Critical Path" },
  { step: 4, label: "Location & Clearances", desc: "Supervision & Clearances" },
  { step: 5, label: "Review & Submit", desc: "Final Intake Dossier" }
];

export default function AddProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarBenchmarks, setSimilarBenchmarks] = useState(null);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);
  const [draftSavedText, setDraftSavedText] = useState('Draft Ready');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    projectName: '',
    projectCode: '',
    sector: 'Roads & Highways',
    subsector: 'Access-Controlled National Expressways',
    projectType: 'EPC Turnkey',
    scheme: 'PM Gati Shakti National Master Plan',
    classification: 'Greenfield',
    implementationMode: 'EPC',
    stage: 'Under Implementation',
    footprint: 'Linear Corridor',
    approvalDate: '2024-01-15',
    durationMonths: '36',
    description: '',

    // Step 2: Financials
    totalCost: '850',
    revisedCost: '850',
    baseYear: '2024-25',
    centralFunding: '850',
    stateFunding: '0',
    debtFunding: '0',
    landCost: '120',
    privateFunding: '0',
    internalResources: '0',

    // Step 3: Timeline & Milestones
    startDate: '2024-04-01',
    completionDate: '2027-03-31',
    milestones: [
      { name: 'Detailed Project Report (DPR) & Approval', date: '2024-02-15', status: 'COMPLETED' },
      { name: 'Right-of-Way (RoW) & Forest Stage I Handover', date: '2024-03-30', status: 'COMPLETED' },
      { name: 'Pavement & Bridge Structure Works', date: '2026-06-30', status: 'IN_PROGRESS' },
      { name: 'Final Commissioning & Safety Audit', date: '2027-03-31', status: 'PLANNED' }
    ],
    riskFactors: {
      landAcquisition: true,
      forestClearance: true,
      utilityShifting: false,
      contractorMobilization: false
    },

    // Step 4: Location & Approvals
    ministry: 'Ministry of Road Transport and Highways',
    agency: 'National Highways Authority of India (NHAI)',
    state: 'Bihar',
    district: 'Muzaffarpur',
    nodalOfficerName: 'Rajesh Kumar',
    nodalOfficerEmail: 'nodal.officer@nhai.gov.in',
    nodalOfficerPhone: '+91 98110 44220',
    reportingOfficerName: 'Anita Sharma (Project Director)',
    landTotalRequired: '450',
    landAcquired: '380',
    rowStatus: 'Partial Possession (84.4%)',
    clearances: {
      forestStage2: 'PENDING',
      eia: 'APPROVED',
      wildlife: 'APPROVED',
      crz: 'NOT_APPLICABLE'
    },

    // Step 5: Declaration
    declarationAccepted: false
  });

  // Calculate Tentative Completion Date from Start Date + Duration Months
  useEffect(() => {
    if (formData.startDate && formData.durationMonths) {
      const months = parseInt(formData.durationMonths, 10);
      if (!isNaN(months) && months > 0) {
        const start = new Date(formData.startDate);
        if (!isNaN(start.getTime())) {
          const comp = new Date(start.setMonth(start.getMonth() + months));
          setFormData(prev => ({
            ...prev,
            completionDate: comp.toISOString().split('T')[0]
          }));
        }
      }
    }
  }, [formData.startDate, formData.durationMonths]);

  // Restore Draft on Mount
  useEffect(() => {
    const draft = projectApi.getProjectDraft();
    if (draft && draft.projectName) {
      setFormData(prev => ({ ...prev, ...draft }));
      setDraftSavedText('Draft Restored');
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // If sector changes, set default subsector
      if (field === 'sector' && SECTORS_DATA[value]) {
        updated.subsector = SECTORS_DATA[value][0] || '';
      }
      return updated;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSaveDraft = async () => {
    const res = await projectApi.saveProjectDraft(formData);
    if (res.success) {
      setDraftSavedText(`Draft Saved (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
    }
  };

  const validateCurrentStep = () => {
    const errs = {};
    if (currentStep === 1) {
      if (!formData.projectName.trim()) errs.projectName = 'Official Project Title is required.';
      if (!formData.sector) errs.sector = 'Sector classification is required.';
      if (!formData.approvalDate) errs.approvalDate = 'Sanction date is required.';
      if (!formData.durationMonths || Number(formData.durationMonths) <= 0) errs.durationMonths = 'Valid duration in months is required.';
    } else if (currentStep === 2) {
      if (!formData.totalCost || Number(formData.totalCost) <= 0) errs.totalCost = 'Sanctioned outlay is required.';
    } else if (currentStep === 3) {
      if (!formData.startDate) errs.startDate = 'Ground start date is required.';
      if (!formData.completionDate) errs.completionDate = 'Target completion date is required.';
    } else if (currentStep === 4) {
      if (!formData.state) errs.state = 'State location is required.';
      if (!formData.nodalOfficerName.trim()) errs.nodalOfficerName = 'Designated Nodal Officer name is required.';
    } else if (currentStep === 5) {
      if (!formData.declarationAccepted) errs.declarationAccepted = 'You must confirm the statutory accuracy declaration before submission.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { name: 'New Engineering Milestone', date: prev.completionDate, status: 'PLANNED' }
      ]
    }));
  };

  const handleRemoveMilestone = (idx) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateMilestone = (idx, field, val) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => i === idx ? { ...m, [field]: val } : m)
    }));
  };

  const handleOpenSimilarBenchmarks = async () => {
    setShowSimilarModal(true);
    setIsFetchingSimilar(true);
    try {
      const res = await projectApi.getSimilarBenchmarks({
        sector: formData.sector,
        totalCost: formData.totalCost
      });
      setSimilarBenchmarks(res?.data || res);
    } catch (err) {
      console.warn("Could not fetch benchmarks:", err);
    } finally {
      setIsFetchingSimilar(false);
    }
  };

  // Funding Balance Calculation
  const totalFundingAllocated = useMemo(() => {
    const c = Number(formData.centralFunding) || 0;
    const s = Number(formData.stateFunding) || 0;
    const d = Number(formData.debtFunding) || 0;
    const p = Number(formData.privateFunding) || 0;
    const i = Number(formData.internalResources) || 0;
    return c + s + d + p + i;
  }, [formData.centralFunding, formData.stateFunding, formData.debtFunding, formData.privateFunding, formData.internalResources]);

  const sanctionedCostNum = Number(formData.totalCost) || 0;
  const fundingDifference = (totalFundingAllocated - sanctionedCostNum).toFixed(1);

  const handleSubmitFinal = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const result = await projectApi.submitProject({
        ...formData,
        name: formData.projectName,
        totalCost: formData.totalCost,
        startDate: formData.startDate,
        completionDate: formData.completionDate
      });

      setSubmittedResult(result);
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="admin-main-container flex flex-col min-h-screen">
        <AdminTopHeader
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeKey="/add-project"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/70">
          
          {/* Header Title & Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Register New Infrastructure Project
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  Step {currentStep} of 5
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Central Sector automated intake for executing ministries, implementing agencies &amp; nodal authorities.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleOpenSimilarBenchmarks}
                className="inline-flex items-center gap-2 bg-white hover:bg-sky-50 text-sky-800 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 hover:border-sky-200 transition shadow-2xs cursor-pointer"
              >
                <Sparkles size={14} className="text-sky-600" />
                <span>View Past Similar Projects &amp; Benchmarks</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
                title="Save current progress locally"
              >
                <Save size={13} />
                <span>{draftSavedText}</span>
              </button>
            </div>
          </div>

          {/* Stepper Navigation Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="relative">
              {/* Progress Background Line */}
              <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 rounded-full z-0 hidden sm:block"></div>

              {/* Dynamic Animated Fill Line */}
              <div
                className="absolute top-5 left-8 h-1 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full z-0 transition-all duration-300 hidden sm:block"
                style={{ width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 4rem)` }}
              ></div>

              {/* 5 Step Nodes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                {STEPS.map((s) => {
                  const isActive = s.step === currentStep;
                  const isCompleted = s.step < currentStep;

                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (s.step < currentStep) setCurrentStep(s.step);
                      }}
                      className={`flex flex-col items-center text-center p-2 rounded-2xl transition group ${
                        s.step < currentStep ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs transition-all shadow-xs ${
                          isActive
                            ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white ring-4 ring-sky-500/20 scale-105'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-400 border-2 border-slate-200 group-hover:border-slate-300'
                        }`}
                      >
                        {isCompleted ? <Check size={18} /> : s.step}
                      </div>
                      <span
                        className={`text-xs mt-2 font-extrabold ${
                          isActive ? 'text-sky-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:block font-medium">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Step Cards Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">

            {/* STAGE 1: CORE IDENTITY & CLASSIFICATION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-sky-600" />
                    Stage 1: Core Project Identity &amp; Classification
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define administrative baseline, sector classification, and implementation framework.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  {/* Official Project Title */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Official Project Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4-Laning of NH-27 Corridor with High-Speed Grade Separators, Bihar"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      className={`w-full bg-slate-50 border rounded-2xl p-3 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white transition ${
                        errors.projectName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-500'
                      }`}
                    />
                    {errors.projectName && <span className="text-rose-600 font-bold block">{errors.projectName}</span>}
                    <span className="text-[11px] text-slate-400">
                      Enter sanctioned project name as per administrative approval order.
                    </span>
                  </div>

                  {/* Sector */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Sector <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.sector}
                      onChange={(e) => handleInputChange('sector', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      {Object.keys(SECTORS_DATA).map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Sector */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Sub-Sector Classification <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.subsector}
                      onChange={(e) => handleInputChange('subsector', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      {(SECTORS_DATA[formData.sector] || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type / Contract Model */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Project Type / Contract Model
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => handleInputChange('projectType', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      <option value="EPC Turnkey">EPC Turnkey Contract</option>
                      <option value="Hybrid Annuity Model (HAM)">Hybrid Annuity Model (HAM)</option>
                      <option value="Design-Build-Finance-Operate (DBFOT)">DBFOT / Concessionaire</option>
                      <option value="Item Rate / Balance Works">Item Rate Works Contract</option>
                      <option value="Strategic Government Undertaking">Direct Departmental Execution</option>
                    </select>
                  </div>

                  {/* National Scheme / Mission */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Associated Scheme / Flagship Mission
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PM Gati Shakti National Master Plan, Bharatmala, Sagarmala"
                      value={formData.scheme}
                      onChange={(e) => handleInputChange('scheme', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Project Classification (Greenfield vs Brownfield) */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Project Classification <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Greenfield', 'Brownfield'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleInputChange('classification', type)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            formData.classification === type
                              ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-500/20 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-extrabold text-xs">{type}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {type === 'Greenfield' ? 'New corridor / fresh site' : 'Expansion / Upgradation'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Implementation Mode */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Implementation Mode <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['EPC', 'PPP', 'Private', 'TBD'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleInputChange('implementationMode', mode)}
                          className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                            formData.implementationMode === mode
                              ? 'bg-sky-600 border-sky-600 text-white font-extrabold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                          }`}
                        >
                          <span className="text-xs">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lifecycle Stage */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Current Lifecycle Stage <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => handleInputChange('stage', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      <option value="Conceptualization & DPR">Conceptualization &amp; DPR</option>
                      <option value="Under Development / Tendering">Under Development &amp; Tendering</option>
                      <option value="Under Implementation">Under Implementation / Construction</option>
                      <option value="Completed & Commissioned">Completed &amp; Commissioned</option>
                    </select>
                  </div>

                  {/* Geographic Footprint */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Geographic Footprint
                    </label>
                    <select
                      value={formData.footprint}
                      onChange={(e) => handleInputChange('footprint', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      <option value="Single Site">Single Stationary Site / Industrial Hub</option>
                      <option value="Linear Corridor">Linear Corridor (Highway/Rail/Pipeline)</option>
                      <option value="Offshore / Coastal">Offshore / Coastal Marine Facility</option>
                    </select>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Cabinet Sanction Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.approvalDate}
                      onChange={(e) => handleInputChange('approvalDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Sanctioned Duration (Months) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="240"
                      value={formData.durationMonths}
                      onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Project Scope &amp; Strategic Executive Summary
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify project deliverables, key bypasses, major river crossings, economic importance..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: FINANCIALS & OUTLAY */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-600" />
                    Stage 2: Capital Outlay &amp; Funding Composition
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define project cost baselines, funding shares, and land compensation components.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  {/* Total Cost */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Total Sanctioned Cost (₹ Crores) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 850"
                      value={formData.totalCost}
                      onChange={(e) => handleInputChange('totalCost', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Revised Cost */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Revised Capital Outlay (If revised) (₹ Crores)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 850"
                      value={formData.revisedCost}
                      onChange={(e) => handleInputChange('revisedCost', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Central Support */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Central Government Allocation (₹ Crores)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.centralFunding}
                      onChange={(e) => handleInputChange('centralFunding', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* State Funding */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      State Government Share (₹ Crores)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.stateFunding}
                      onChange={(e) => handleInputChange('stateFunding', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Debt / External Aid */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Multilateral Debt / External Aid (₹ Crores)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.debtFunding}
                      onChange={(e) => handleInputChange('debtFunding', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Land Cost Factor */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Land Acquisition Cost Component (₹ Crores)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.landCost}
                      onChange={(e) => handleInputChange('landCost', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Live Funding Reconciliation Box */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                  fundingDifference === '0.0'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${fundingDifference === '0.0' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <strong className="block text-xs font-extrabold">
                        Funding Reconciliation: Total Allocated ₹{totalFundingAllocated} Cr / Sanctioned ₹{sanctionedCostNum} Cr
                      </strong>
                      <span className="text-[11px] text-slate-600">
                        {fundingDifference === '0.0' ? 'Funding shares match 100% of sanctioned outlay.' : `Funding discrepancy of ₹${Math.abs(fundingDifference)} Cr detected.`}
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                    fundingDifference === '0.0' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {fundingDifference === '0.0' ? 'Balanced' : 'Recheck Breakdown'}
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 3: TIMELINE & MILESTONES */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    Stage 3: Timeline, Schedule &amp; Milestones
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define ground execution start, target commissioning date, and key delivery checkpoints.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Ground Execution Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Scheduled Target Completion Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => handleInputChange('completionDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Milestone Checklist Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-slate-900 text-xs">
                      Key Engineering Milestones ({formData.milestones.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.milestones.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-xs">
                        <span className="font-bold text-slate-400 text-[11px] shrink-0">#{idx + 1}</span>
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleUpdateMilestone(idx, 'name', e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                        <input
                          type="date"
                          value={m.date}
                          onChange={(e) => handleUpdateMilestone(idx, 'date', e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shrink-0"
                        />
                        <select
                          value={m.status}
                          onChange={(e) => handleUpdateMilestone(idx, 'status', e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shrink-0"
                        >
                          <option value="PLANNED">PLANNED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer shrink-0"
                          title="Remove milestone"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: LOCATION & CLEARANCES */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-amber-600" />
                    Stage 4: Location, Authorities &amp; Statutory Approvals
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign responsible supervisory authorities, spatial location, and statutory clearances.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  {/* Ministry */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Line Ministry <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.ministry}
                      onChange={(e) => handleInputChange('ministry', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      {MINISTRIES.map(min => (
                        <option key={min} value={min}>{min}</option>
                      ))}
                    </select>
                  </div>

                  {/* Agency */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Implementation Agency <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.agency}
                      onChange={(e) => handleInputChange('agency', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      {AGENCIES.map(ag => (
                        <option key={ag} value={ag}>{ag}</option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Primary State Jurisdiction <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    >
                      {STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Primary District / Corridor Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muzaffarpur, Supaul & Darbhanga"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Nodal Officer Contact */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Nodal Officer (Single Point of Contact) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar (CGM Tech)"
                      value={formData.nodalOfficerName}
                      onChange={(e) => handleInputChange('nodalOfficerName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Nodal Officer Official Email
                    </label>
                    <input
                      type="email"
                      placeholder="nodal.officer@gov.in"
                      value={formData.nodalOfficerEmail}
                      onChange={(e) => handleInputChange('nodalOfficerEmail', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Land Metrics */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Total Land Required (Hectares)
                    </label>
                    <input
                      type="number"
                      placeholder="450"
                      value={formData.landTotalRequired}
                      onChange={(e) => handleInputChange('landTotalRequired', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Land Acquired in Possession (Hectares)
                    </label>
                    <input
                      type="number"
                      placeholder="380"
                      value={formData.landAcquired}
                      onChange={(e) => handleInputChange('landAcquired', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Statutory Clearances Pipeline */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <label className="font-extrabold text-slate-900 text-xs block">
                    Statutory Clearances Pipeline Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Forest Stage II</span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Environment EIA</span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        APPROVED
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Wildlife NBWL</span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        APPROVED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5: REVIEW & SUBMIT */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCheck size={18} className="text-sky-600" />
                    Stage 5: Final Intake Review &amp; Executive Submission
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify all project parameters before transmitting to the NIVARA Central Governance Telemetry core.
                  </p>
                </div>

                {/* Summary Dossier Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Card 1: Identity */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">1. Project Identity</strong>
                      <button type="button" onClick={() => setCurrentStep(1)} className="text-sky-600 font-bold hover:underline">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Title:</strong> {formData.projectName || '—'}</div>
                      <div><strong className="text-slate-800">Sector:</strong> {formData.sector} ({formData.subsector})</div>
                      <div><strong className="text-slate-800">Model:</strong> {formData.projectType} &bull; {formData.classification}</div>
                    </div>
                  </div>

                  {/* Card 2: Financials */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">2. Financial Outlay</strong>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-sky-600 font-bold hover:underline">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Sanctioned Cost:</strong> ₹{formData.totalCost} Cr</div>
                      <div><strong className="text-slate-800">Central Share:</strong> ₹{formData.centralFunding} Cr</div>
                      <div><strong className="text-slate-800">Land Allocation:</strong> ₹{formData.landCost} Cr</div>
                    </div>
                  </div>

                  {/* Card 3: Timeline */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">3. Timeline &amp; Schedule</strong>
                      <button type="button" onClick={() => setCurrentStep(3)} className="text-sky-600 font-bold hover:underline">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Ground Start:</strong> {formData.startDate}</div>
                      <div><strong className="text-slate-800">Target Finish:</strong> {formData.completionDate}</div>
                      <div><strong className="text-slate-800">Milestones:</strong> {formData.milestones.length} Defined</div>
                    </div>
                  </div>

                  {/* Card 4: Authorities */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">4. Location &amp; Supervision</strong>
                      <button type="button" onClick={() => setCurrentStep(4)} className="text-sky-600 font-bold hover:underline">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Location:</strong> {formData.state} ({formData.district})</div>
                      <div><strong className="text-slate-800">Agency:</strong> {formData.agency}</div>
                      <div><strong className="text-slate-800">Nodal SPOC:</strong> {formData.nodalOfficerName}</div>
                    </div>
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.declarationAccepted}
                      onChange={(e) => handleInputChange('declarationAccepted', e.target.checked)}
                      className="mt-1 w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-700 leading-relaxed font-normal">
                      <strong className="font-extrabold text-slate-900 block">
                        Statutory Officer Declaration &amp; Submission Affirmation
                      </strong>
                      I hereby certify that the administrative details, capital allocations, and milestone parameters recorded in this intake dossier conform strictly with Central Sector Project guidelines and vetted approval orders.
                    </div>
                  </label>
                  {errors.declarationAccepted && (
                    <span className="text-rose-600 font-bold text-xs block pl-7">{errors.declarationAccepted}</span>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Stepper Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                }`}
              >
                <ArrowLeft size={14} />
                <span>Previous Stage</span>
              </button>

              <div className="flex items-center gap-3">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Stage {currentStep + 1}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={isSubmitting || !formData.declarationAccepted}
                    className="px-7 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Transmitting to NIVARA Core...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Project Dossier</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>

        {/* SUBMISSION SUCCESS MODAL */}
        {submittedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in duration-150">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Project Dossier Successfully Registered!
                </h3>
                <p className="text-xs text-slate-500">
                  The infrastructure asset has been catalogued in the NIVARA Central Governance Telemetry Core.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Assigned Project Code:</span>
                  <strong className="font-mono text-sky-700 font-extrabold">{submittedResult.projectId}</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Registry Tracking Number:</span>
                  <strong className="font-mono text-slate-800 font-extrabold">{submittedResult.trackingNumber}</strong>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/projects"
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs"
                >
                  View in Projects Registry
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedResult(null);
                    setCurrentStep(1);
                    setFormData(prev => ({ ...prev, projectName: '' }));
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Register Another Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BENCHMARKS & PAST SIMILAR PROJECTS MODAL */}
        {showSimilarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-600">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">
                      Sector Intelligence &amp; Cost Benchmarks
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Historical execution patterns for {formData.sector} packages
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimilarModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {isFetchingSimilar ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <RefreshCw className="animate-spin mx-auto text-sky-600" size={24} />
                    <span>Analyzing past project archives &amp; cost variance data...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg. Sector Delay</span>
                        <strong className="text-rose-600 text-base font-extrabold mt-1 block">+124 Days</strong>
                        <span className="text-[10px] text-slate-500">RoW &amp; Forest Stage II</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg. Cost Variance</span>
                        <strong className="text-amber-600 text-base font-extrabold mt-1 block">+8.2%</strong>
                        <span className="text-[10px] text-slate-500">Material Escalation</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Clearance Window</span>
                        <strong className="text-sky-600 text-base font-extrabold mt-1 block">180 Days</strong>
                        <span className="text-[10px] text-slate-500">MoEFCC Benchmark</span>
                      </div>
                    </div>

                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1.5 text-slate-700">
                      <strong className="font-bold text-sky-900 block text-xs">
                        NIVARA Predictive Recommendation for {formData.sector}
                      </strong>
                      <p className="text-[11px] leading-relaxed">
                        For packages in this sector around <strong>₹{formData.totalCost} Cr</strong>, historical data indicates upfront Right-of-Way possession (&gt;80%) before contractor mobilization reduces project timeline variance by over <strong>35%</strong>.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSimilarModal(false)}
                        className="px-5 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-sky-700 transition cursor-pointer"
                      >
                        Apply Insights to Form
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
