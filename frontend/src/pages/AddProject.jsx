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
  Zap, Save, CheckCheck, Lock, Eye
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

export const CLEARANCE_TYPES_OPTIONS = [
  { value: 'FOREST', label: 'Forest Stage I / Stage II Clearance', defaultAuthority: 'State Forest Department / MoEFCC' },
  { value: 'ENVIRONMENTAL', label: 'Environmental Clearance (EIA)', defaultAuthority: 'MoEFCC / EAC' },
  { value: 'WILDLIFE', label: 'Wildlife Clearance (NBWL)', defaultAuthority: 'National Board for Wildlife (NBWL)' },
  { value: 'COASTAL_REGULATORY_ZONE', label: 'Coastal Regulation Zone (CRZ)', defaultAuthority: 'State Coastal Zone Management Authority' },
  { value: 'RAILWAY', label: 'Railway Safety & Crossings NOC', defaultAuthority: 'Ministry of Railways / Zonal Railway' },
  { value: 'DEFENCE', label: 'Defence / Aviation NOC', defaultAuthority: 'Ministry of Defence / AAI' },
  { value: 'POLLUTION_CONTROL', label: 'State Pollution Control (CTE / CTO)', defaultAuthority: 'State Pollution Control Board (SPCB)' },
  { value: 'HERITAGE', label: 'Archaeological / Heritage NOC', defaultAuthority: 'Archaeological Survey of India (ASI)' },
  { value: 'OTHER', label: 'Other Statutory Clearance', defaultAuthority: 'Competent Statutory Authority' }
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
  const [isVerifyingNumber, setIsVerifyingNumber] = useState(false);

  // Form State - initialized clean with registration number verified from backend
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    projectName: '',
    projectCode: '',
    sector: 'Roads & Highways',
    subsector: 'Access-Controlled National Expressways',
    projectType: 'EPC Turnkey',
    scheme: '',
    classification: 'Greenfield',
    implementationMode: 'EPC',
    stage: 'Under Implementation',
    footprint: 'Linear Corridor',
    approvalDate: '',
    durationMonths: '',
    description: '',

    // Step 2: Financials
    totalCost: '',
    revisedCost: '',
    baseYear: '2024-25',
    centralFunding: '',
    stateFunding: '',
    debtFunding: '',
    landCost: '',
    privateFunding: '',
    internalResources: '',

    // Step 3: Timeline & Milestones
    startDate: '',
    completionDate: '',
    milestones: [],
    riskFactors: {
      landAcquisition: false,
      forestClearance: false,
      utilityShifting: false,
      contractorMobilization: false
    },

    // Step 4: Location & Approvals
    ministry: MINISTRIES[0],
    agency: AGENCIES[0],
    state: 'Bihar',
    district: '',
    nodalOfficerName: '',
    nodalOfficerEmail: '',
    nodalOfficerPhone: '',
    reportingOfficerName: '',
    landTotalRequired: '',
    landAcquired: '',
    rowStatus: '',
    // Clearances Pipeline with Unique Registration Number (e.g. 619043)
    clearances: [],

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

  // Check Availability & Fetch Guaranteed Unique Registration Number on Mount
  useEffect(() => {
    let isMounted = true;

    async function initRegistrationNumber() {
      const draft = projectApi.getProjectDraft();
      if (draft && draft.projectName) {
        if (isMounted) {
          setFormData(prev => ({ ...prev, ...draft }));
          setDraftSavedText('Draft Restored');
        }
        return;
      }

      setIsVerifyingNumber(true);
      try {
        const uniqueNumber = await projectApi.getUniqueRegistrationNumber();
        if (isMounted && uniqueNumber) {
          setFormData(prev => ({
            ...prev,
            projectCode: prev.projectCode || uniqueNumber
          }));
        }
      } catch (err) {
        console.warn("Could not verify unique registration number on mount:", err);
      } finally {
        if (isMounted) {
          setIsVerifyingNumber(false);
        }
      }
    }

    initRegistrationNumber();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute duplicate registration numbers across entered statutory clearances
  const duplicateRegNumbers = useMemo(() => {
    const counts = {};
    const duplicates = new Set();
    (formData.clearances || []).forEach(c => {
      const ref = (c.referenceNumber || '').trim();
      if (ref) {
        counts[ref] = (counts[ref] || 0) + 1;
        if (counts[ref] > 1) {
          duplicates.add(ref);
        }
      }
    });
    return duplicates;
  }, [formData.clearances]);

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

  const handleAddClearance = (presetType = 'FOREST') => {
    const matched = CLEARANCE_TYPES_OPTIONS.find(o => o.value === presetType);
    setFormData(prev => ({
      ...prev,
      clearances: [
        ...(prev.clearances || []),
        {
          id: 'cl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          clearanceType: presetType,
          referenceNumber: '',
          authorityName: matched ? matched.defaultAuthority : 'Competent Statutory Authority',
          status: 'PENDING',
          approvalDate: '',
          remarks: ''
        }
      ]
    }));
    if (errors.clearances) {
      setErrors(prev => ({ ...prev, clearances: null }));
    }
  };

  const handleRemoveClearance = (idx) => {
    setFormData(prev => ({
      ...prev,
      clearances: (prev.clearances || []).filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateClearance = (idx, field, val) => {
    setFormData(prev => {
      const nextList = [...(prev.clearances || [])];
      const updatedItem = { ...nextList[idx], [field]: val };
      if (field === 'clearanceType') {
        const matched = CLEARANCE_TYPES_OPTIONS.find(o => o.value === val);
        if (matched && (!updatedItem.authorityName || updatedItem.authorityName === 'State Forest Department / MoEFCC')) {
          updatedItem.authorityName = matched.defaultAuthority;
        }
      }
      nextList[idx] = updatedItem;
      return { ...prev, clearances: nextList };
    });
    if (errors.clearances) {
      setErrors(prev => ({ ...prev, clearances: null }));
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
      // Nodal Officer and reporting officers can be assigned after project registration
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
        state: formData.state,
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

      // Fetch same sector & state peer projects risk and delay data
      try {
        const res = await projectApi.getSimilarBenchmarks({
          sector: formData.sector,
          state: formData.state,
          totalCost: formData.totalCost
        });
        setSimilarBenchmarks(res?.data || res);
      } catch (e) {
        console.warn('Peer benchmarks fetch failed:', e);
      }
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoProject = () => {
    setFormData(prev => ({
      ...prev,
      projectName: "Construction of 6-Lane Greenfield Expressway connecting Varanasi to Ranchi via Purulia Corridor (Pkg-4)",
      sector: "Roads & Highways",
      subsector: "Access-Controlled National Expressways",
      projectType: "EPC Turnkey",
      scheme: "Bharatmala Pariyojana Phase-II / PM Gati Shakti",
      classification: "Greenfield",
      implementationMode: "EPC",
      stage: "Under Implementation",
      footprint: "Linear Corridor",
      approvalDate: "2024-03-15",
      durationMonths: "36",
      description: "High-speed 6-lane access-controlled economic corridor designed to reduce freight transit time by 45%. Includes 3 major river bridges, 12 grade separators, intelligent transport systems (ITS), and wayside logistics amenities.",
      totalCost: "2850.50",
      revisedCost: "2850.50",
      baseYear: "2024-25",
      centralFunding: "2280.40",
      stateFunding: "570.10",
      debtFunding: "0",
      landCost: "450.00",
      privateFunding: "0",
      internalResources: "0",
      startDate: "2024-06-01",
      completionDate: "2027-05-31",
      milestones: [
        { title: "Land Acquisition & Utility Relocation", targetDate: "2024-12-31", weightage: "25", remarks: "92% 3D possession completed" },
        { title: "Earthwork, Subgrade & Major Bridge Foundations", targetDate: "2025-10-31", weightage: "30", remarks: "Substructure piling in progress" },
        { title: "Pavement Quality Concrete (PQC) & Bituminous Layers", targetDate: "2026-11-30", weightage: "30", remarks: "Dual paving train operational" },
        { title: "ITS Deployment, Signage & Final Commissioning", targetDate: "2027-05-31", weightage: "15", remarks: "Toll plaza and optical fiber integration" }
      ],
      riskFactors: {
        landAcquisition: true,
        forestClearance: true,
        utilityShifting: false,
        contractorMobilization: false
      },
      ministry: "Ministry of Road Transport and Highways",
      agency: "National Highways Authority of India (NHAI)",
      state: "Bihar",
      district: "Rohtas / Aurangabad",
      nodalOfficerName: "Rajesh Kumar Verma",
      nodalOfficerEmail: "nodal.officer@nhai.gov.in",
      nodalOfficerPhone: "+91 9876543210",
      reportingOfficerName: "Anita Sharma",
      landTotalRequired: "420.5",
      landAcquired: "386.9",
      rowStatus: "Clear ROW handed over for 48.2 km of 52.4 km stretch",
      clearances: [
        {
          clearanceType: "FOREST",
          authority: "State Forest Department / MoEFCC",
          status: "APPROVED",
          approvalDate: "2024-08-20",
          referenceNumber: "FC-BH-2024-8841"
        },
        {
          clearanceType: "ENVIRONMENTAL",
          authority: "MoEFCC / EAC",
          status: "APPROVED",
          approvalDate: "2024-05-12",
          referenceNumber: "EC-MORTH-2024-1029"
        },
        {
          clearanceType: "RAILWAY",
          authority: "Eastern Railway / DFCCIL",
          status: "IN_PROGRESS",
          referenceNumber: "RWY-NOC-2024-3401"
        }
      ],
      declarationAccepted: true
    }));
    setErrors({});
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/70 max-w-7xl mx-auto w-full">
          
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
                onClick={handleFillDemoProject}
                className="inline-flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-xl border border-amber-400/80 transition shadow-2xs cursor-pointer"
                title="Fill demo project data"
              >
                <Sparkles size={14} className="text-amber-950" />
                <span>Fill Demo Project</span>
              </button>

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
                  <div className="space-y-1.5">
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

                  {/* Project Registration Number (Normal input field, auto-generated, cannot change) */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Project Registration Number <span className="text-slate-400 font-normal text-[11px]">(Auto-generated &bull; Cannot change)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.projectCode || (isVerifyingNumber ? 'Checking availability...' : '')}
                      readOnly
                      disabled
                      placeholder="e.g. 619043"
                      className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 font-bold font-mono tracking-wide cursor-not-allowed select-none"
                    />
                    <span className="text-[11px] text-slate-400">
                      Unique 6-digit registration number assigned automatically and verified available by NIVARA Core.
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
                    <div>
                      <label className="font-extrabold text-slate-900 text-xs block">
                        Key Engineering Milestones ({formData.milestones.length})
                      </label>
                      <span className="text-[11px] text-slate-400">Add critical project execution phases and target dates.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  {formData.milestones.length === 0 ? (
                    <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">No milestones defined yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click below to add key milestones or quick-start with templates.</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              milestones: [
                                { name: 'Detailed Project Report (DPR) & Sanction', date: prev.startDate || '', status: 'COMPLETED' },
                                { name: 'Right-of-Way & Land Handover', date: prev.startDate || '', status: 'IN_PROGRESS' },
                                { name: 'Civil & Structural Construction', date: '', status: 'PLANNED' },
                                { name: 'Final Safety Audit & Commissioning', date: prev.completionDate || '', status: 'PLANNED' }
                              ]
                            }));
                          }}
                          className="text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Load Standard EPC Milestone Set
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMilestone}
                          className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Add Single Custom Milestone
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {formData.milestones.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-xs">
                          <span className="font-bold text-slate-400 text-[11px] shrink-0">#{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="e.g. Right-of-Way Handover &amp; Civil Works"
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
                  )}
                </div>
              </div>
            )}

            {/* STAGE 4: LOCATION & CLEARANCES */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-amber-600" />
                    Stage 4: Location, Authorities &amp; Statutory Clearances Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign responsible supervisory authorities, spatial location, and track statutory clearance pipeline entries.
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
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800 block">
                        Nodal Officer (Single Point of Contact)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        Designated SPOC
                      </span>
                    </div>
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
                      placeholder="e.g. nodal.officer@nhai.gov.in"
                      value={formData.nodalOfficerEmail}
                      onChange={(e) => handleInputChange('nodalOfficerEmail', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Nodal Officer Phone / Contact
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98110 44220"
                      value={formData.nodalOfficerPhone || ''}
                      onChange={(e) => handleInputChange('nodalOfficerPhone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Field Reporting Officer (PIU) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800 block">
                        Field Reporting Officer (PIU Unit)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        Field Unit Officer
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Anita Sharma (Project Director)"
                      value={formData.reportingOfficerName || ''}
                      onChange={(e) => handleInputChange('reportingOfficerName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 block">
                      Field Reporting Officer Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. reporting.officer@nhai.gov.in"
                      value={formData.reportingOfficerEmail || ''}
                      onChange={(e) => handleInputChange('reportingOfficerEmail', e.target.value)}
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
                      placeholder="e.g. 450"
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
                      placeholder="e.g. 380"
                      value={formData.landAcquired}
                      onChange={(e) => handleInputChange('landAcquired', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* STATUTORY CLEARANCES PIPELINE */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="font-extrabold text-slate-900 text-sm block">
                          Statutory Clearances Pipeline Status
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {formData.clearances.length} Registered
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Track regulatory, forest, and environmental approvals for Project Reg. No: <strong className="font-mono text-slate-800">{formData.projectCode || '619043'}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAddClearance('FOREST')}
                        className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Statutory Clearance</span>
                      </button>
                    </div>
                  </div>

                  {/* Informational Guidance Alert */}
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-bold text-amber-950 block">
                        Statutory Clearances Lifecycle &amp; Project Linking
                      </strong>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Environmental, forest, wildlife, and railway clearances are automatically attached to Project Registration No. <strong className="font-mono text-slate-800">#{formData.projectCode || '619043'}</strong> in national monitoring dashboards.
                      </p>
                    </div>
                  </div>

                  {errors.clearances && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={15} />
                      <span>{errors.clearances}</span>
                    </div>
                  )}

                  {/* Clearances Cards List */}
                  {formData.clearances.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/40">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-2xs">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">No statutory clearances in pipeline yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Click below to add statutory clearances (e.g. Forest Stage I/II, EIA, Wildlife, Railway NOC).
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddClearance('FOREST')}
                          className="text-[11px] font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Forest Stage I/II Clearance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddClearance('ENVIRONMENTAL')}
                          className="text-[11px] font-bold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Environment EIA Clearance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddClearance('WILDLIFE')}
                          className="text-[11px] font-bold text-sky-900 bg-sky-100/70 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Wildlife NBWL Clearance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddClearance('RAILWAY')}
                          className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          + Railway NOC
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.clearances.map((cl, idx) => (
                        <div
                          key={cl.id || idx}
                          className="p-4 rounded-2xl border transition text-xs space-y-3 shadow-2xs bg-slate-50/70 border-slate-200 hover:border-slate-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-400 text-xs shrink-0">
                                Clearance #{idx + 1}
                              </span>
                              <select
                                value={cl.clearanceType}
                                onChange={(e) => handleUpdateClearance(idx, 'clearanceType', e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                              >
                                {CLEARANCE_TYPES_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-bold">Status:</span>
                                <select
                                  value={cl.status}
                                  onChange={(e) => handleUpdateClearance(idx, 'status', e.target.value)}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold border focus:outline-none ${
                                    cl.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : cl.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : cl.status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-slate-200 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="APPROVED">APPROVED</option>
                                  <option value="NOT_REQUIRED">NOT REQUIRED</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveClearance(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                                title="Remove clearance"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Inputs grid: File Reference Number, Authority, Approval Date, Remarks */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-800 text-[11px] block">
                                Clearance File / Reference No. (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. FP/BR/ROAD/2024 or File Ref"
                                value={cl.referenceNumber}
                                onChange={(e) => handleUpdateClearance(idx, 'referenceNumber', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold transition focus:outline-none focus:border-sky-500 text-slate-900"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-800 text-[11px] block">
                                Issuing Authority / Portal
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. State Forest Dept / MoEFCC"
                                value={cl.authorityName}
                                onChange={(e) => handleUpdateClearance(idx, 'authorityName', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-extrabold text-slate-800 text-[11px] block">
                                Sanction / Applied Date (Optional)
                              </label>
                              <input
                                type="date"
                                value={cl.approvalDate}
                                onChange={(e) => handleUpdateClearance(idx, 'approvalDate', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500"
                              />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="font-extrabold text-slate-800 text-[11px] block">
                                Clearance Scope &amp; Remarks (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Stage-II Forest diversion proposal for 24-km corridor section"
                                value={cl.remarks}
                                onChange={(e) => handleUpdateClearance(idx, 'remarks', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    Verify all project parameters and statutory clearance pipeline entries before transmitting to the NIVARA Central Governance Telemetry core.
                  </p>
                </div>

                {/* Summary Dossier Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Card 1: Identity */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">1. Project Identity</strong>
                      <button type="button" onClick={() => setCurrentStep(1)} className="text-sky-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Title:</strong> {formData.projectName || '—'}</div>
                      <div><strong className="text-slate-800">Project Reg. No:</strong> <span className="font-mono font-bold text-sky-700">{formData.projectCode || '—'}</span></div>
                      <div><strong className="text-slate-800">Sector:</strong> {formData.sector} ({formData.subsector})</div>
                      <div><strong className="text-slate-800">Model:</strong> {formData.projectType} &bull; {formData.classification}</div>
                    </div>
                  </div>

                  {/* Card 2: Financials */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">2. Financial Outlay</strong>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-sky-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Sanctioned Cost:</strong> {formData.totalCost ? `₹${formData.totalCost} Cr` : '—'}</div>
                      <div><strong className="text-slate-800">Central Share:</strong> {formData.centralFunding ? `₹${formData.centralFunding} Cr` : '—'}</div>
                      <div><strong className="text-slate-800">Land Allocation:</strong> {formData.landCost ? `₹${formData.landCost} Cr` : '—'}</div>
                    </div>
                  </div>

                  {/* Card 3: Timeline */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">3. Timeline &amp; Schedule</strong>
                      <button type="button" onClick={() => setCurrentStep(3)} className="text-sky-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Ground Start:</strong> {formData.startDate || '—'}</div>
                      <div><strong className="text-slate-800">Target Finish:</strong> {formData.completionDate || '—'}</div>
                      <div><strong className="text-slate-800">Milestones:</strong> {formData.milestones.length} Defined</div>
                    </div>
                  </div>

                  {/* Card 4: Authorities */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs">4. Location &amp; Supervision</strong>
                      <button type="button" onClick={() => setCurrentStep(4)} className="text-sky-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div><strong className="text-slate-800">Location:</strong> {formData.state} {formData.district ? `(${formData.district})` : ''}</div>
                      <div><strong className="text-slate-800">Agency:</strong> {formData.agency}</div>
                      <div><strong className="text-slate-800">Nodal SPOC:</strong> {formData.nodalOfficerName || 'To be assigned after registration'}</div>
                    </div>
                  </div>

                  {/* Card 5: Clearances Pipeline Summary */}
                  <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <strong className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-600" />
                        5. Statutory Clearances Pipeline ({formData.clearances.length})
                      </strong>
                      <button type="button" onClick={() => setCurrentStep(4)} className="text-sky-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    {formData.clearances.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">No statutory clearances declared for this intake.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                        {formData.clearances.map((c, i) => (
                          <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 text-[11px]">
                                {CLEARANCE_TYPES_OPTIONS.find(o => o.value === c.clearanceType)?.label || c.clearanceType}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                c.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            {c.referenceNumber && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                File Ref: <strong className="text-slate-800">{c.referenceNumber}</strong>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 truncate">
                              {c.authorityName || 'Authority not specified'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                      I hereby certify that the administrative details, capital allocations, milestone parameters, and statutory clearances pipeline entries recorded in this intake dossier conform strictly with Central Sector Project guidelines and vetted approval orders.
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

        {/* SUBMISSION SUCCESS MODAL WITH SAME SECTOR & SAME STATE RISK & DELAY INTELLIGENCE */}
        {submittedResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header Banner */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0 relative">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 size={26} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                        <span>Project Dossier Registered Successfully!</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Catalogued in NIVARA Central Governance Telemetry Core.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${submittedResult.data?._id || submittedResult.projectId}`}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-xs flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      <span>View Dossier</span>
                    </Link>
                    <Link
                      to="/projects"
                      className="hidden sm:flex px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-xs items-center gap-1.5"
                    >
                      <Layers size={14} />
                      <span>All Projects</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedResult(null);
                        setCurrentStep(1);
                        setFormData(prev => ({ ...prev, projectName: '' }));
                      }}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                      title="Close Modal"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Project Identifiers Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Project Code</span>
                    <strong className="font-mono text-sky-400 font-extrabold text-sm">{submittedResult.projectId}</strong>
                  </div>
                  <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Tracking No.</span>
                    <strong className="font-mono text-emerald-400 font-extrabold text-xs truncate block">{submittedResult.trackingNumber}</strong>
                  </div>
                  <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Sector</span>
                    <strong className="text-amber-300 font-bold truncate block">{formData.sector}</strong>
                  </div>
                  <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">State / Region</span>
                    <strong className="text-indigo-300 font-bold truncate block">{formData.state || 'Pan-India'}</strong>
                  </div>
                </div>
              </div>

              {/* Modal Body: Same Sector & State Risk and Delay Intelligence */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
                
                {/* Peer Benchmark Metrics */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Same Sector &amp; State Risk and Delay Intelligence
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Historical telemetry from {similarBenchmarks?.matchedSector || formData.sector} projects in {similarBenchmarks?.matchedState || formData.state}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
                      {similarBenchmarks?.similarProjects?.length || 0} Peer Projects Found
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Avg. Historical Delay</span>
                      <strong className="text-rose-900 text-lg font-black mt-0.5 block">
                        +{similarBenchmarks?.averageDelayMonths || 14} Months
                      </strong>
                      <span className="text-[10px] text-rose-600 font-medium">Max delay: {similarBenchmarks?.maxDelayMonths || 24} mos</span>
                    </div>

                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Avg. Risk Score</span>
                      <strong className="text-amber-900 text-lg font-black mt-0.5 block">
                        {similarBenchmarks?.averageRiskScore || 58}/100
                      </strong>
                      <span className="text-[10px] text-amber-700 font-medium">MoSPI Predictive Benchmark</span>
                    </div>

                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">High Delay Risk Peers</span>
                      <strong className="text-indigo-900 text-lg font-black mt-0.5 block">
                        {((similarBenchmarks?.riskDistribution?.CRITICAL || 0) + (similarBenchmarks?.riskDistribution?.HIGH || 0))} Projects
                      </strong>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {similarBenchmarks?.riskDistribution?.CRITICAL || 0} Critical &bull; {similarBenchmarks?.riskDistribution?.HIGH || 0} High
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Avg. Cost Escalation</span>
                      <strong className="text-slate-900 text-lg font-black mt-0.5 block">
                        +{similarBenchmarks?.averageCostOverrunPct || 8.5}%
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium">Over original cabinet outlay</span>
                    </div>
                  </div>
                </div>

                {/* Peer Projects List in Same Sector & State */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Peer Projects in {similarBenchmarks?.matchedSector || formData.sector} &bull; {similarBenchmarks?.matchedState || formData.state}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-medium">Ranked by risk and delay variance</span>
                  </div>

                  <div className="space-y-2.5">
                    {similarBenchmarks?.similarProjects && similarBenchmarks.similarProjects.length > 0 ? (
                      similarBenchmarks.similarProjects.map((p, idx) => {
                        const isCritical = p.riskLevel === 'CRITICAL' || (p.riskScore || 0) >= 75;
                        const isHigh = p.riskLevel === 'HIGH' || ((p.riskScore || 0) >= 50 && (p.riskScore || 0) < 75);
                        const isLow = p.riskLevel === 'LOW' || (p.riskScore || 0) < 30;
                        const delayM = Number(p.delayMonths) || Math.round((Number(p.delayDays) || 0) / 30.4);
                        const districtClean = (p.district && p.district.trim().toLowerCase() !== (p.state || '').trim().toLowerCase()) 
                          ? `${p.district}, ` 
                          : '';

                        return (
                          <div
                            key={p._id || idx}
                            className="p-3.5 bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                  {p.projectCode || `PRJ-${idx + 1}`}
                                </span>
                                <h6 className="font-bold text-slate-900 text-xs line-clamp-1">
                                  {p.projectName}
                                </h6>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                <span>📍 {districtClean}{p.state || 'Pan-India'}</span>
                                <span>&bull; Outlay: <strong>₹{Number(p.originalProjectCost || 0).toLocaleString()} Cr</strong></span>
                                <span>&bull; Phys: <strong>{p.physicalProgress || 0}%</strong></span>
                                <span>&bull; Fin: <strong>{p.financialProgress || 0}%</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                              {/* Risk Badge */}
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                isCritical 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : isHigh 
                                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                  : isLow 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {p.riskLevel || 'MEDIUM'} &bull; {p.riskScore || 50}/100
                              </span>

                              {/* Delay Badge */}
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                                delayM > 12 
                                  ? 'bg-rose-100 text-rose-800 border-rose-200' 
                                  : delayM > 0 
                                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                <Clock size={10} className="inline mr-1 -mt-0.5" />
                                {delayM > 0 ? `+${delayM} Mo Delay` : 'On Schedule'}
                              </span>

                              {/* View Link */}
                              <Link
                                to={`/projects/${p.projectCode || p._id}`}
                                target="_blank"
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="Inspect peer project dossier"
                              >
                                <ArrowUpRight size={15} />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                        No prior historical delays recorded in this exact sector and state combination.
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Predictive Clearance & Mitigation Advice */}
                <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50/70 border border-sky-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-sky-900 font-extrabold">
                    <Sparkles size={14} className="text-sky-600" />
                    <span>NIVARA Predictive Clearance &amp; Mitigation Strategy</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                    <li>Pre-track Stage-1 &amp; Stage-2 Forest and Environmental clearances with MoEFCC PARIVESH portal before issuing civil work mobilization advances.</li>
                    <li>Secure at least 80% contiguous Right-of-Way (RoW) possession in {formData.state || 'the state'} to eliminate idle contractor claims.</li>
                    <li>Schedule bi-weekly joint progress reviews between the State Nodal Department and executing agencies.</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500">
                  Ready to manage milestones or register another package?
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedResult(null);
                      setCurrentStep(1);
                      setFormData(prev => ({ ...prev, projectName: '' }));
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Register Another Project
                  </button>
                  <Link
                    to={`/projects/${submittedResult.data?._id || submittedResult.projectId}`}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-xs"
                  >
                    Go to Project Dossier &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BENCHMARKS & PAST SIMILAR PROJECTS MODAL */}
        {showSimilarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 my-auto">
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-600">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">
                      Sector &amp; State Risk and Delay Intelligence
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Historical benchmarks for {formData.sector} packages in {formData.state}
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

              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {isFetchingSimilar ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <RefreshCw className="animate-spin mx-auto text-sky-600" size={24} />
                    <span>Analyzing past project archives &amp; cost variance data for {formData.sector} in {formData.state}...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg. Sector Delay</span>
                        <strong className="text-rose-600 text-base font-extrabold mt-1 block">
                          +{similarBenchmarks?.averageDelayMonths || 14} Months
                        </strong>
                        <span className="text-[10px] text-slate-500">RoW &amp; Clearances</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg. Risk Score</span>
                        <strong className="text-amber-600 text-base font-extrabold mt-1 block">
                          {similarBenchmarks?.averageRiskScore || 58}/100
                        </strong>
                        <span className="text-[10px] text-slate-500">Peer Outlay Benchmark</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg. Cost Escalation</span>
                        <strong className="text-sky-600 text-base font-extrabold mt-1 block">
                          +{similarBenchmarks?.averageCostOverrunPct || 8.5}%
                        </strong>
                        <span className="text-[10px] text-slate-500">Price Adjustment / RoW</span>
                      </div>
                    </div>

                    {/* Peer Projects list */}
                    {similarBenchmarks?.similarProjects && similarBenchmarks.similarProjects.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Sample Peer Projects in Same Sector &amp; State
                        </span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {similarBenchmarks.similarProjects.map((p, idx) => {
                            const delayM = Number(p.delayMonths) || Math.round((Number(p.delayDays) || 0) / 30.4);
                            return (
                              <div key={p._id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <div className="truncate mr-2">
                                  <strong className="text-slate-900 block truncate">{p.projectName}</strong>
                                  <span className="text-[10px] text-slate-500">
                                    {p.state} &bull; ₹{Number(p.originalProjectCost || 0).toLocaleString()} Cr
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                    p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {p.riskLevel || 'MEDIUM'}
                                  </span>
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                    {delayM > 0 ? `+${delayM} Mo` : 'On Track'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1.5 text-slate-700">
                      <strong className="font-bold text-sky-900 block text-xs">
                        NIVARA Predictive Recommendation for {formData.sector} ({formData.state})
                      </strong>
                      <p className="text-[11px] leading-relaxed">
                        For packages in this sector in <strong>{formData.state}</strong> around <strong>₹{formData.totalCost || '2,500'} Cr</strong>, historical telemetry indicates securing &gt;80% contiguous Right-of-Way (RoW) possession prior to commercial mobilization reduces project schedule delay by over <strong>35%</strong>.
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
