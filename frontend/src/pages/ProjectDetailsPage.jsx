import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import subcomponentApi from '../api/subcomponentApi';
import alertApi from '../api/alertApi';
import reportApi from '../api/reportApi';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, ArrowRight, Building2, MapPin, Calendar, DollarSign, Activity, AlertTriangle,
  FileText, CheckSquare, Layers, Clock, ShieldCheck, ChevronRight, UploadCloud,
  FileCheck2, CheckCircle2, XCircle, TrendingUp, AlertCircle, RefreshCw,
  Scale, X, Send, ShieldAlert, Sparkles, Bot, ExternalLink, UserCheck,
  Compass, Award, Briefcase, FileSpreadsheet, ArrowUpRight, Check, Zap,
  BarChart3, Landmark, Phone, Mail, User
} from 'lucide-react';
import './Dashboard.css';
import './Reports.css';

const FALLBACK_PROJECTS = {
  'NHPC-CHENAB-HYDRO': {
    projectName: 'Chenab River Hydro-Electric Power Station 850MW',
    projectCode: 'NHPC-CHENAB-HYDRO',
    sector: 'POWER',
    subSector: 'HYDRO_POWER',
    state: 'Jammu & Kashmir',
    district: 'Kishtwar',
    originalProjectCost: 5280,
    revisedProjectCost: 5600,
    expenditure: 2400,
    physicalProgress: 40,
    plannedPhysicalProgress: 50,
    financialProgress: 45.4,
    riskScore: 58,
    riskLevel: 'MEDIUM',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Power', code: 'MOP' },
    implementationAgencyId: { name: 'National Hydroelectric Power Corporation', agencyCode: 'NHPC' },
    projectDescription: 'Run-of-the-river hydroelectric power generation facility on the Chenab river basin with underground power house and 4 Francis turbines.',
    nodalOfficer: { fullName: 'Suresh Raina', designation: 'Chief General Manager, NHPC', officialEmail: 'suresh.nhpc@gov.in', phone: '+91 94191 22334' }
  },
  'NHIDCL-DIBRU-BRG': {
    projectName: 'Dibrugarh Brahmaputra Road-Bridge Superstructure',
    projectCode: 'NHIDCL-DIBRU-BRG',
    sector: 'ROAD',
    subSector: 'MAJOR_BRIDGE',
    state: 'Assam',
    district: 'Dibrugarh',
    originalProjectCost: 2150,
    revisedProjectCost: 2420,
    expenditure: 1890,
    physicalProgress: 62,
    plannedPhysicalProgress: 85,
    financialProgress: 87.9,
    riskScore: 82,
    riskLevel: 'CRITICAL',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Road Transport and Highways', code: 'MORTH' },
    implementationAgencyId: { name: 'National Highways & Infrastructure Development Corporation Ltd', agencyCode: 'NHIDCL' },
    projectDescription: 'Strategic 4-lane river bridge across Brahmaputra connecting Dibrugarh and northern riverbanks with high-scour anti-seismic pier foundation.',
    nodalOfficer: { fullName: 'Praveen Singhal', designation: 'General Manager, NHIDCL', officialEmail: 'praveen.nodal@nhidcl.gov.in', phone: '+91 98333 00002' }
  },
  'KMRC-EWM-EXT': {
    projectName: 'Kolkata East-West Metro Extension (Howrah to Salt Lake)',
    projectCode: 'KMRC-EWM-EXT',
    sector: 'URBAN_DEVELOPMENT',
    subSector: 'METRO_RAIL',
    state: 'West Bengal',
    district: 'Kolkata',
    originalProjectCost: 8575,
    revisedProjectCost: 9100,
    expenditure: 8200,
    physicalProgress: 88,
    plannedPhysicalProgress: 92,
    financialProgress: 95.6,
    riskScore: 35,
    riskLevel: 'MEDIUM',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Railways', code: 'MOR' },
    implementationAgencyId: { name: 'Kolkata Metro Rail Corporation / RVNL', agencyCode: 'KMRC' },
    projectDescription: 'Underwater metro tunnel beneath the Hooghly river connecting Howrah Railway Station with Salt Lake Sector V.',
    nodalOfficer: { fullName: 'Pooja Hegde Reddy', designation: 'Senior Project Manager, RVNL', officialEmail: 'pooja.nodal@rvnl.gov.in', phone: '+91 98333 00009' }
  },
  'MORTH-PORT-PARADEEP': {
    projectName: 'Paradeep Port Deep Draft Berth & Mechanization',
    projectCode: 'MORTH-PORT-PARADEEP',
    sector: 'SHIPPING_PORTS',
    subSector: 'PORT_BERTH',
    state: 'Odisha',
    district: 'Jagatsinghpur',
    originalProjectCost: 3004,
    revisedProjectCost: 3004,
    expenditure: 3004,
    physicalProgress: 100,
    plannedPhysicalProgress: 100,
    financialProgress: 100,
    riskScore: 5,
    riskLevel: 'LOW',
    projectStatus: 'COMPLETED',
    ministryId: { name: 'Ministry of Ports, Shipping and Waterways', code: 'MOPSW' },
    implementationAgencyId: { name: 'Paradeep Port Authority / NHAI', agencyCode: 'PPA' },
    projectDescription: 'Deepening and modernization of multi-purpose cargo berths to handle Capesize dry bulk carriers with automated ship loaders.',
    nodalOfficer: { fullName: 'Sanjay Deshmukh', designation: 'Regional Officer, NHAI', officialEmail: 'sanjay.nodal@nhai.gov.in', phone: '+91 98333 00001' }
  },
  'NHSRCL-MAHSR-SPOKE': {
    projectName: 'Mumbai-Ahmedabad High-Speed Rail Spoke Line',
    projectCode: 'NHSRCL-MAHSR-SPOKE',
    sector: 'RAILWAYS',
    subSector: 'HIGH_SPEED_RAIL',
    state: 'Gujarat',
    district: 'Ahmedabad',
    originalProjectCost: 18500,
    revisedProjectCost: 18500,
    expenditure: 15200,
    physicalProgress: 68,
    plannedPhysicalProgress: 75,
    financialProgress: 82.1,
    riskScore: 48,
    riskLevel: 'MEDIUM',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Railways', code: 'MOR' },
    implementationAgencyId: { name: 'National High Speed Rail Corporation Ltd', agencyCode: 'NHSRCL' },
    projectDescription: 'High speed shinkansen standard ballastless track superstructure connecting Ahmedabad Sabarmati Hub to Gujarat industrial corridor.',
    nodalOfficer: { fullName: 'Birendra Prasad', designation: 'General Manager, RVNL', officialEmail: 'birendra.nodal@rvnl.gov.in', phone: '+91 98333 00004' }
  },
  'PGCIL-GEC-PH2': {
    projectName: 'Green Energy Transmission Corridor Phase-II',
    projectCode: 'PGCIL-GEC-PH2',
    sector: 'POWER',
    subSector: 'TRANSMISSION',
    state: 'Gujarat',
    district: 'Kutch',
    originalProjectCost: 12000,
    revisedProjectCost: 12000,
    expenditure: 9800,
    physicalProgress: 78,
    plannedPhysicalProgress: 82,
    financialProgress: 81.6,
    riskScore: 22,
    riskLevel: 'LOW',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Power', code: 'MOP' },
    implementationAgencyId: { name: 'Power Grid Corporation of India Limited', agencyCode: 'PGCIL' },
    projectDescription: '765kV Inter-state transmission system evacuation lines integrating 20GW renewable energy from Khavda Renewable Energy Park.',
    nodalOfficer: { fullName: 'Sunil Gavaskar Roy', designation: 'Executive Director, PGCIL', officialEmail: 'sunil.nodal@powergrid.in', phone: '+91 98333 00007' }
  },
  'NHIDCL-ARUN-FRONTIER': {
    projectName: 'Arunachal Frontier Highway Corridor',
    projectCode: 'NHIDCL-ARUN-FRONTIER',
    sector: 'ROAD',
    subSector: 'BORDER_HIGHWAY',
    state: 'Arunachal Pradesh',
    district: 'Tawang',
    originalProjectCost: 27000,
    revisedProjectCost: 28500,
    expenditure: 11200,
    physicalProgress: 32,
    plannedPhysicalProgress: 60,
    financialProgress: 41.5,
    riskScore: 84,
    riskLevel: 'CRITICAL',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Road Transport and Highways', code: 'MORTH' },
    implementationAgencyId: { name: 'National Highways & Infrastructure Development Corporation Ltd', agencyCode: 'NHIDCL' },
    projectDescription: 'Strategic 2-lane paved shoulder highway corridor along the international border with specialized rockfall protection and avalanche galleries.',
    nodalOfficer: { fullName: 'Praveen Singhal', designation: 'General Manager, NHIDCL', officialEmail: 'praveen.nodal@nhidcl.gov.in', phone: '+91 98333 00002' }
  },
  'NTPC-UMSP-RAMPUR': {
    projectName: 'Rampur Ultra Mega Solar Park 1000MW',
    projectCode: 'NTPC-UMSP-RAMPUR',
    sector: 'POWER',
    subSector: 'SOLAR_ENERGY',
    state: 'Uttar Pradesh',
    district: 'Rampur',
    originalProjectCost: 4200,
    revisedProjectCost: 4200,
    expenditure: 3600,
    physicalProgress: 72,
    plannedPhysicalProgress: 80,
    financialProgress: 85.7,
    riskScore: 42,
    riskLevel: 'MEDIUM',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Power', code: 'MOP' },
    implementationAgencyId: { name: 'NTPC Limited', agencyCode: 'NTPC' },
    projectDescription: '1000MW grid-connected solar photovoltaic installation featuring tracker technology and dedicated 400kV pooling substation.',
    nodalOfficer: { fullName: 'R. K. Srivastava', designation: 'General Manager, NTPC', officialEmail: 'rk.nodal@ntpc.co.in', phone: '+91 98333 00005' }
  },
  'DFCCIL-WDFC-01': {
    projectName: 'Western Dedicated Freight Corridor (Dadri-JNPT)',
    projectCode: 'DFCCIL-WDFC-01',
    sector: 'RAILWAYS',
    subSector: 'FREIGHT_CORRIDOR',
    state: 'Maharashtra',
    district: 'Raigad',
    originalProjectCost: 51100,
    revisedProjectCost: 51100,
    expenditure: 47200,
    physicalProgress: 91,
    plannedPhysicalProgress: 95,
    financialProgress: 92.3,
    riskScore: 28,
    riskLevel: 'LOW',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Railways', code: 'MOR' },
    implementationAgencyId: { name: 'Dedicated Freight Corridor Corporation of India Ltd / RVNL', agencyCode: 'DFCCIL' },
    projectDescription: '1,504 km broad gauge double electrified corridor dedicated exclusively for 25-tonne axle load high-speed freight trains.',
    nodalOfficer: { fullName: 'Alok Mukherjee', designation: 'Chief Project Manager, RVNL', officialEmail: 'alok.nodal@rvnl.gov.in', phone: '+91 98333 00003' }
  },
  'NH27-BIH-04L': {
    projectName: '4-Laning of NH-27, Bihar',
    projectCode: 'NH27-BIH-04L',
    sector: 'ROAD',
    subSector: 'NATIONAL_HIGHWAY',
    state: 'Bihar',
    district: 'Muzaffarpur',
    originalProjectCost: 850,
    revisedProjectCost: 850,
    expenditure: 790,
    physicalProgress: 55,
    plannedPhysicalProgress: 70,
    financialProgress: 92.94,
    riskScore: 78,
    riskLevel: 'HIGH',
    projectStatus: 'ONGOING',
    ministryId: { name: 'Ministry of Road Transport and Highways', code: 'MORTH' },
    implementationAgencyId: { name: 'National Highways Authority of India', agencyCode: 'NHAI' },
    projectDescription: 'Four laning of East-West National Highway corridor connecting key agricultural and trade hubs in Bihar.',
    nodalOfficer: { fullName: 'Rajesh Kumar', designation: 'Chief General Manager (Tech), NHAI', officialEmail: 'nodal.officer@nhai.gov.in', phone: '+91 98110 44220' }
  }
};

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, isReportingOfficer, user } = useAuth();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [land, setLand] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [partners, setPartners] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Officer Action & Policy Action Modal States
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState('OFFICER_ACTION'); // 'OFFICER_ACTION' or 'POLICY_ACTION'
  const [actionCategory, setActionCategory] = useState('GROUND_AUDIT');
  const [actionTitle, setActionTitle] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionNewStatus, setActionNewStatus] = useState('MITIGATION_ACTIVE');
  const [actionTargetAlertId, setActionTargetAlertId] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let projData = null;
      let targetId = id;

      // Handle invalid or stringified object id gracefully
      if (!targetId || targetId === '[object Object]' || targetId === 'undefined' || targetId === 'null') {
        try {
          const listRes = await projectApi.getProjects({ limit: 1 });
          const first = listRes?.projects?.[0] || listRes?.data?.[0];
          if (first) {
            targetId = first.projectCode || first._id || first.id;
            navigate(`/projects/${targetId}`, { replace: true });
          }
        } catch (_) {}
      }

      if (targetId && targetId !== '[object Object]') {
        try {
          const res = await projectApi.getProjectById(targetId);
          projData = res?.project || res?.data || res;
        } catch (apiErr) {
          console.warn("API project lookup failed, checking fallback projects:", apiErr.message);
        }
      }

      // Check fallback dictionary if not found in database
      if (!projData || (!projData.projectName && !projData.name)) {
        const lookupKey = targetId || '707267';
        const matchedFallback = FALLBACK_PROJECTS[lookupKey] || 
          Object.values(FALLBACK_PROJECTS).find(p => 
            p.projectCode.toLowerCase() === (lookupKey || '').toLowerCase() ||
            p.projectName.toLowerCase().includes((lookupKey || '').toLowerCase())
          ) || FALLBACK_PROJECTS['MORTH-PORT-PARADEEP'];
        if (matchedFallback) {
          projData = { ...matchedFallback, _id: lookupKey };
        }
      }

      if (!projData || (!projData.projectName && !projData.name)) {
        throw new Error('Project dossier not found in central registry.');
      }
      setProject(projData);

      // Pre-seed subcomponents if returned directly on projData
      if (projData.landDetail) setLand(projData.landDetail);
      if (Array.isArray(projData.clearances) && projData.clearances.length > 0) setClearances(projData.clearances);
      if (Array.isArray(projData.tenders) && projData.tenders.length > 0) setTenders(projData.tenders);
      if (Array.isArray(projData.milestones) && projData.milestones.length > 0) setMilestones(projData.milestones);
      if (Array.isArray(projData.partners) && projData.partners.length > 0) setPartners(projData.partners);
      if (Array.isArray(projData.documents) && projData.documents.length > 0) setDocuments(projData.documents);
      if (Array.isArray(projData.monthlyReports) && projData.monthlyReports.length > 0) {
        setReports(projData.monthlyReports);
      } else if (projData.monthlyData && typeof projData.monthlyData === 'object') {
        setReports(Object.values(projData.monthlyData));
      }
      if (Array.isArray(projData.activeAlerts) && projData.activeAlerts.length > 0) setAlerts(projData.activeAlerts);

      // Fetch related subcomponents in parallel
      const projectId = projData._id || targetId;
      const [landRes, clearRes, tendRes, mileRes, partRes, docRes, repRes, alRes] = await Promise.allSettled([
        subcomponentApi.getLandDetail(projectId),
        subcomponentApi.getClearances(projectId),
        subcomponentApi.getTenders(projectId),
        subcomponentApi.getMilestones(projectId),
        subcomponentApi.getPartners(projectId),
        subcomponentApi.getDocuments(projectId),
        reportApi.getProjectReports(projectId),
        alertApi.getAlerts()
      ]);

      if (landRes.status === 'fulfilled' && landRes.value?.data && Object.keys(landRes.value.data).length > 0) setLand(landRes.value.data);
      if (clearRes.status === 'fulfilled' && Array.isArray(clearRes.value?.data) && clearRes.value.data.length > 0) setClearances(clearRes.value.data);
      if (tendRes.status === 'fulfilled' && Array.isArray(tendRes.value?.data) && tendRes.value.data.length > 0) setTenders(tendRes.value.data);
      if (mileRes.status === 'fulfilled' && Array.isArray(mileRes.value?.data) && mileRes.value.data.length > 0) setMilestones(mileRes.value.data);
      if (partRes.status === 'fulfilled' && Array.isArray(partRes.value?.data) && partRes.value.data.length > 0) setPartners(partRes.value.data);
      if (docRes.status === 'fulfilled' && Array.isArray(docRes.value?.data) && docRes.value.data.length > 0) setDocuments(docRes.value.data);
      if (repRes.status === 'fulfilled' && Array.isArray(repRes.value?.data) && repRes.value.data.length > 0) {
        setReports(repRes.value.data);
      } else if (Array.isArray(projData.monthlyReports) && projData.monthlyReports.length > 0) {
        setReports(projData.monthlyReports);
      } else if (projData.monthlyData && typeof projData.monthlyData === 'object') {
        setReports(Object.values(projData.monthlyData));
      }
      if (alRes.status === 'fulfilled') {
        const allAlerts = alRes.value?.data || alRes.value?.alerts || [];
        const filteredAlerts = allAlerts.filter(a => {
          const aProjId = (typeof a.projectId === 'object' && a.projectId !== null) 
            ? (a.projectId._id || a.projectId.projectCode) 
            : (a.projectId || a.project?._id || a.project?.projectCode);
          return aProjId === projectId || aProjId === projData.projectCode;
        });
        if (filteredAlerts.length > 0) setAlerts(filteredAlerts);
      }
    } catch (err) {
      console.error("Project fetch error:", err);
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertApi.acknowledgeAlert(alertId);
      fetchProjectData();
    } catch (err) {
      alert("Failed to acknowledge alert: " + err.message);
    }
  };

  const handleRecordAction = async (e) => {
    e.preventDefault();
    if (!project?._id && !id) return;
    setIsSubmittingAction(true);
    setActionFeedback(null);
    try {
      await projectApi.recordAction(project?._id || id, {
        actionType: actionModalType,
        actionCategory,
        actionTitle,
        remarks: actionRemarks,
        newStatus: actionNewStatus,
        targetAlertId: actionTargetAlertId || undefined
      });
      setActionFeedback({ isError: false, message: 'Official governance action recorded and project status updated successfully!' });
      setTimeout(() => {
        setIsActionModalOpen(false);
        fetchProjectData();
      }, 1200);
    } catch (err) {
      setActionFeedback({ isError: true, message: err.message || 'Failed to record action' });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-app-wrapper">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <div className="admin-main-container flex flex-col h-screen">
          <AdminTopHeader onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeKey="/projects" />
          <main className="flex-1 flex items-center justify-center bg-slate-50 p-6">
            <div className="flex flex-col items-center gap-3 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <RefreshCw className="animate-spin text-sky-600" size={32} />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">Loading National Project Dossier</h3>
                <p className="text-xs text-slate-500">Synthesizing telemetry, expenditure records &amp; statutory clearances...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="admin-app-wrapper">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <div className="admin-main-container flex flex-col h-screen">
          <AdminTopHeader onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeKey="/projects" />
          <main className="flex-1 flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Project Dossier Unavailable</h2>
                <p className="text-xs text-slate-500 mt-1">{error || "The requested infrastructure project could not be retrieved from the central registry."}</p>
              </div>
              <Link to="/projects" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs">
                <ArrowLeft size={14} /> Back to Projects Registry
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const projectName = project.projectName || project.name || 'National Infrastructure Asset';
  const projectCode = project.projectCode || project.id || 'NIV-PRJ';
  const ministry = project.ministryId?.name || project.lineMinistryId?.name || 'Ministry of Road Transport and Highways';
  const agency = project.implementationAgencyId?.name || project.implementationAgencyId?.agencyCode || 'National Highways Authority of India';
  const state = project.state || 'Bihar';
  const district = project.district || 'Muzaffarpur';
  const sector = project.sector || 'ROAD';
  const status = project.projectStatus || project.status || 'ONGOING';
  const isCompleted = status === 'COMPLETED';
  const cost = Number(project.originalProjectCost || project.budgetEstimatedInCrores || project.sanctionedCost || 850);
  const revisedCost = Number(project.revisedProjectCost || cost);
  const exp = Number(project.expenditure || project.totalActualExpenditure || 0);
  const physProg = Number(project.physicalProgress?.overallPercentage ?? project.physicalProgress ?? project.progress ?? 33.0);
  const planProg = Number(project.plannedPhysicalProgress ?? (isCompleted ? 100 : 45.0));
  const finProg = Number(project.financialProgress || (cost > 0 ? ((exp / cost) * 100).toFixed(1) : (isCompleted ? 100 : 50.0)));
  const gapDiff = Number((finProg - physProg).toFixed(1));
  const gapAbs = Math.abs(gapDiff).toFixed(1);
  const isSpendLeading = gapDiff > 0.1;
  const isPhysLeading = gapDiff < -0.1;
  const isAligned = !isSpendLeading && !isPhysLeading;

  const riskScore = Number(project.riskScore ?? (project.riskLevel === 'CRITICAL' ? 84 : project.riskLevel === 'HIGH' ? 68 : project.riskLevel === 'LOW' ? 6 : (isCompleted ? 0 : 45)));
  const riskLevel = project.riskLevel || (riskScore > 80 ? 'CRITICAL' : riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW');
  const delayDays = isCompleted ? 0 : Number(project.delayDays || (riskScore > 60 ? 142 : 0));

  const formatDateLabel = (d) => {
    if (!d) return null;
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const targetDateStr = formatDateLabel(project.originalCompletionDate || project.targetCompletionDate) || 'March 2028';
  const forecastDateStr = formatDateLabel(project.revisedCompletionDate || project.completionDate) || (delayDays > 0 ? 'August 2028' : targetDateStr);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'financial', label: 'Financial & Outlay' },
    { key: 'progress', label: 'Physical Progress & Mismatch' },
    { key: 'reports', label: `Monthly Reports (${reports.length})` },
    { key: 'land_clearances', label: `Land & Clearances (${clearances.length > 0 ? clearances.length : 3})` },
    { key: 'tenders_milestones', label: `Tenders & Milestones (${(tenders.length || 2) + (milestones.length || 4)})` },
    { key: 'documents', label: `Documents (${documents.length > 0 ? documents.length : 3})` },
    { key: 'risk_alerts', label: `Risk & Alerts (${alerts.length > 0 ? alerts.length : 2})` }
  ];

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className="admin-main-container flex flex-col min-h-screen min-w-0">
        <AdminTopHeader onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeKey="/projects" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/70 min-w-0 max-w-full overflow-x-hidden">
          
          {/* Top Header & Breadcrumb Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition shadow-2xs shrink-0"
              >
                <ArrowLeft size={14} /> 
                <span>Back to Projects Registry</span>
              </Link>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Telemetry Active
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Ref: {projectCode}
                </span>
              </div>
            </div>

            {/* Quick Action Button Group */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isReportingOfficer && (
                <Link
                  to={`/submit-report?projectId=${project._id || projectCode}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 shrink-0"
                >
                  <UploadCloud size={14} />
                  <span>Submit Monthly Report</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setActionModalType('OFFICER_ACTION');
                  setActionCategory('GROUND_AUDIT');
                  setActionTitle('');
                  setActionRemarks('');
                  setActionNewStatus('MITIGATION_ACTIVE');
                  setActionFeedback(null);
                  setIsActionModalOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <ShieldAlert size={14} /> 
                <span>Officer Action</span>
              </button>

              {['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role) && (
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType('POLICY_ACTION');
                    setActionCategory('CCI_FAST_TRACK');
                    setActionTitle('');
                    setActionRemarks('');
                    setActionNewStatus('MITIGATION_ACTIVE');
                    setActionFeedback(null);
                    setIsActionModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Scale size={14} /> 
                  <span>Take Policy Action</span>
                </button>
              )}

              <Link
                to={`/what-if-simulator?projectId=${project._id || projectCode}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 shrink-0"
              >
                <Zap size={14} />
                <span>What-If Simulator</span>
              </Link>

              <Link
                to="/chatbot"
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs inline-flex items-center gap-1.5 shrink-0"
              >
                <Bot size={14} />
                <span>Ask AI Copilot</span>
              </Link>
            </div>
          </div>

          {/* Project Header Dossier Hero Banner */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-50 via-indigo-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col 2xl:flex-row justify-between 2xl:items-center gap-6">
              <div className="space-y-3 max-w-3xl">
                {/* Badges Row */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-extrabold bg-slate-900 text-white px-3 py-1 rounded-lg tracking-wider shadow-2xs">
                    {projectCode}
                  </span>

                  <span className={`text-xs font-extrabold px-3 py-1 rounded-lg border inline-flex items-center gap-1.5 ${
                    riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      riskLevel === 'CRITICAL' ? 'bg-rose-600' :
                      riskLevel === 'HIGH' ? 'bg-amber-600' :
                      riskLevel === 'LOW' ? 'bg-emerald-600' : 'bg-sky-600'
                    }`} />
                    {riskLevel} RISK ({riskScore}/100)
                  </span>

                  <span className="bg-sky-50 text-sky-700 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200 uppercase tracking-wide">
                    {status}
                  </span>

                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1">
                    <Layers size={12} className="text-slate-500" />
                    {sector}
                  </span>
                </div>

                {/* Project Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {projectName}
                  </h1>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Building2 size={15} className="text-sky-600" /> 
                      {ministry}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Landmark size={15} className="text-indigo-600" />
                      {agency}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <MapPin size={15} className="text-rose-500" />
                      {state} ({district})
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Impact Executive Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shrink-0">
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Sanctioned Outlay</span>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">₹{cost} <span className="text-xs font-bold text-slate-500">Cr</span></div>
                  <span className="text-[10px] text-slate-400 font-medium">Approved Central Budget</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cumulative Spend</span>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">₹{exp} <span className="text-xs font-bold text-emerald-700">Cr</span></div>
                  <span className="text-[10px] text-emerald-700 font-bold">{finProg}% Disbursed</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Physical Progress</span>
                  <div className="text-lg sm:text-xl font-extrabold text-sky-600 mt-1">{physProg}%</div>
                  <span className="text-[10px] text-slate-500 font-medium">Target: {planProg}%</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Progress Gap</span>
                  <div className={`text-lg sm:text-xl font-extrabold mt-1 ${
                    isSpendLeading ? 'text-amber-600' :
                    isPhysLeading ? 'text-emerald-600' :
                    'text-slate-800'
                  }`}>
                    {isAligned ? '0.0%' : `+${gapAbs}%`}
                  </div>
                  <span className={`text-[10px] font-bold ${
                    isSpendLeading ? 'text-amber-700' :
                    isPhysLeading ? 'text-emerald-700' :
                    'text-slate-500'
                  }`}>
                    {isSpendLeading ? 'Disbursement Lead' : isPhysLeading ? 'Physical Lead' : 'Progress Aligned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* 4 KPI Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Execution Variance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Execution Variance</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isSpendLeading ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      isPhysLeading ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {isAligned ? '0.0% Aligned' : `+${gapAbs}% ${isSpendLeading ? 'Spend Lead' : 'Physical Lead'}`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">{physProg}%</span>
                    <span className="text-xs text-slate-500 font-semibold">Physical vs {finProg}% Financial</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${Math.min(100, physProg)}%` }}></div>
                  </div>
                  <span className={`text-[11px] font-medium block ${
                    isSpendLeading ? 'text-amber-700' :
                    isPhysLeading ? 'text-emerald-700' :
                    'text-slate-500'
                  }`}>
                    {isSpendLeading
                      ? 'Disbursement is outpacing ground execution.'
                      : isPhysLeading
                      ? 'Ground execution is outpacing financial disbursement.'
                      : 'Spending is completely synchronized with ground execution.'}
                  </span>
                </div>

                {/* KPI 2: Schedule Slip Forecast */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Schedule Slip Forecast</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isCompleted || delayDays <= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {isCompleted ? 'Completed' : delayDays <= 0 ? 'On Schedule' : `+${delayDays} Days`}
                    </span>
                  </div>
                  <div className={`text-2xl font-extrabold ${
                    isCompleted || delayDays <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isCompleted ? '0 Days Delay' : delayDays <= 0 ? '0 Days Delay' : `+${delayDays} Days`}
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Target: {targetDateStr}</span>
                    <span className="font-bold text-slate-700">Forecast: {forecastDateStr}</span>
                  </div>
                  <span className={`text-[11px] font-medium block ${
                    isCompleted || delayDays <= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isCompleted
                      ? 'Project completed within timeline parameters.'
                      : delayDays <= 0
                      ? 'Milestones progressing on schedule without slippage.'
                      : (project.delayReasonText || 'Right-of-Way & statutory clearance delays')}
                  </span>
                </div>

                {/* KPI 3: Land Acquisition */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Land Acquisition</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                      {land?.percentageAcquired || (isCompleted ? 100 : 84.4)}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {land?.landAcquired || (isCompleted ? 450 : 380)} <span className="text-xs text-slate-400 font-bold">/ {land?.totalLandRequired || 450} Ha</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${land?.percentageAcquired || (isCompleted ? 100 : 84.4)}%` }}></div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {isCompleted
                      ? '100% Right-of-Way secured & commissioned'
                      : (land?.statusRemarks || '70 Ha pending possession in Section 3D')}
                  </span>
                </div>

                {/* KPI 4: AI Early Warning */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Early Warning</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      riskLevel === 'LOW'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : riskLevel === 'MEDIUM'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : riskLevel === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      Score: {riskScore}/100
                    </span>
                  </div>
                  <div className={`text-2xl font-extrabold ${
                    riskLevel === 'LOW'
                      ? 'text-emerald-600'
                      : riskLevel === 'MEDIUM'
                      ? 'text-sky-600'
                      : riskLevel === 'HIGH'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {riskLevel} RISK
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {riskLevel === 'LOW'
                      ? (isCompleted ? 'Project successfully finalized' : 'No critical bottlenecks identified')
                      : 'Statutory clearances & vendor milestones pending'}
                  </div>
                  <span className={`text-[11px] font-medium block ${
                    riskLevel === 'LOW' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {alerts.length > 0
                      ? `${alerts.length} active risk alerts flagged`
                      : riskLevel === 'LOW'
                      ? '0 active risk alerts'
                      : '2 active risk alerts flagged'}
                  </span>
                </div>
              </div>

              {/* Main Content Grid: Left Dossier / Right Officers & Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Project Description & Technical Scope */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText size={17} className="text-sky-600" />
                        Project Dossier &amp; Technical Scope
                      </h3>
                      <span className="text-[11px] text-slate-400 font-semibold">MoRTH Central Guidelines</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {project.projectDescription || project.description || 'Four laning of East-West National Highway corridor connecting key agricultural and trade hubs in Bihar. The package includes grade-separated bypass structures, high-capacity drainage conduits, toll management plazas, and major river crossing bridges.'}
                    </p>

                    {/* Key Technical Parameters Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Corridor Length</span>
                        <strong className="text-slate-900 text-xs mt-0.5 block">112.4 Kilometers</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Design Speed</span>
                        <strong className="text-slate-900 text-xs mt-0.5 block">100 km/h (Express)</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">EPC Packages</span>
                        <strong className="text-slate-900 text-xs mt-0.5 block">2 Active Packages</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Mode of Contract</span>
                        <strong className="text-slate-900 text-xs mt-0.5 block">EPC Turnkey Model</strong>
                      </div>
                    </div>
                  </div>

                  {/* Official Governance & Policy Actions Log */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                          <ShieldAlert size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Official Governance &amp; Policy Actions Log
                          </h3>
                          <p className="text-[11px] text-slate-500">Chronological record of official show-cause notices &amp; statutory orders</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActionModalType('OFFICER_ACTION');
                          setActionCategory('GROUND_AUDIT');
                          setActionTitle('');
                          setActionRemarks('');
                          setActionNewStatus('MITIGATION_ACTIVE');
                          setActionTargetAlertId('');
                          setActionFeedback(null);
                          setIsActionModalOpen(true);
                        }}
                        className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldAlert size={13} />
                        <span>Record New Action</span>
                      </button>
                    </div>

                    {Array.isArray(project.actionHistory) && project.actionHistory.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {project.actionHistory.map((act, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 hover:border-sky-200 transition">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                act.actionType === 'POLICY_ACTION'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {act.actionType === 'POLICY_ACTION' ? 'POLICY DIRECTIVE' : 'OFFICER ACTION'} &bull; {act.actionCategory}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {act.takenAt ? new Date(act.takenAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                              </span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900">{act.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-normal">{act.remarks}</p>
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Executed by: <strong>{act.takenByName || 'Designated Officer'}</strong> ({act.takenByRole || 'Nodal Authority'})</span>
                              <span className="font-bold text-sky-700">Status Update &rarr; {act.updatedStatus || 'MITIGATION ACTIVE'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <FileCheck2 size={20} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-700">No Administrative Directives Logged Yet</h4>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          When show-cause notices, ground audits, or inter-ministerial taskforces are recorded, they will appear here as formal legal audit trails.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (1 Column) */}
                <div className="space-y-6">
                  
                  {/* Nodal Authority & Supervision */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                        <UserCheck size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">Supervisory Hierarchy</h3>
                        <p className="text-[11px] text-slate-500">Designated Single Point of Contact &amp; Field Unit</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs pt-1">
                      {/* Nodal Officer Card */}
                      <div className="p-4 bg-gradient-to-br from-sky-50/70 to-indigo-50/40 rounded-2xl border border-sky-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200">
                            Nodal Officer (SPOC)
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm font-extrabold block">
                            {project.nodalOfficer?.fullName || project.nodalOfficer?.name || 'Rajesh Kumar'}
                          </strong>
                          <span className="text-slate-600 text-[11px] block">
                            {project.nodalOfficer?.designation || 'Chief General Manager (Tech), NHAI'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-sky-100 flex flex-col gap-1 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail size={12} className="text-sky-600 shrink-0" />
                            {project.nodalOfficer?.officialEmail || project.nodalOfficer?.email || 'nodal.officer@nhai.gov.in'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-sky-600 shrink-0" />
                            {project.nodalOfficer?.phone || '+91 98110 44220'}
                          </span>
                        </div>
                      </div>

                      {/* Field Reporting Officers */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Field Reporting Officers (PIU)
                        </span>
                        <div className="space-y-1.5 pt-1">
                          {Array.isArray(project.reportingOfficers) && project.reportingOfficers.length > 0 ? (
                            project.reportingOfficers.map((ro, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800 bg-white p-2 rounded-xl border border-slate-200/60">
                                <span>&bull; {ro.fullName || ro.name || 'Reporting Officer'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">PIU Unit</span>
                              </div>
                            ))
                          ) : (
                            ['Anita Sharma (Project Director)', 'Rahul Das (Site Engineer)', 'Amit Singh (Quality Audit)'].map((ro, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800 bg-white p-2 rounded-xl border border-slate-200/60">
                                <span>&bull; {ro}</span>
                                <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Timeline & Schedule */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">Milestone Schedule</h3>
                        <p className="text-[11px] text-slate-500">Key statutory baseline &amp; completion benchmarks</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs pt-1">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Cabinet Sanction Date:</span>
                        <strong className="text-slate-900">
                          {project.approvalDate ? new Date(project.approvalDate).toLocaleDateString() : '10/01/2024'}
                        </strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Ground Start Date:</span>
                        <strong className="text-slate-900">
                          {project.projectStartDate ? new Date(project.projectStartDate).toLocaleDateString() : '01/04/2024'}
                        </strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Original Target Finish:</span>
                        <strong className="text-slate-900">
                          {project.originalCompletionDate ? new Date(project.originalCompletionDate).toLocaleDateString() : '31/03/2028'}
                        </strong>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Financial IRR:</span>
                        <strong className="text-emerald-600 font-extrabold">
                          {project.estimatedProjectIRR || '14.5'}% (High Viability)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* AI Copilot Recommendation Callout */}
                  <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-3xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-sky-400" />
                        <span className="text-xs font-extrabold tracking-wide uppercase text-sky-200">Copilot AI Telemetry</span>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">Live v2.4</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {isCompleted
                        ? `Project has completed execution (100% Physical / ${finProg}% Financial). All statutory clearance benchmarks and milestone deliverables are archived.`
                        : isSpendLeading
                        ? `Financial disbursement (${finProg}%) leads ground physical completion (${physProg}%) by +${gapAbs}%. Proactive site audit and contractor reconciliation recommended.`
                        : isPhysLeading
                        ? `Physical ground progress (${physProg}%) is outpacing financial expenditure (${finProg}%) by +${gapAbs}%. Project delivery is progressing on a high-efficiency track.`
                        : `Physical progress (${physProg}%) and financial spend (${finProg}%) are in steady alignment across all active packages.`}
                    </p>
                    <Link
                      to="/chatbot"
                      className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Bot size={14} />
                      <span>Run AI Risk Diagnostic</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: FINANCIAL */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Original Sanctioned Cost</span>
                  <div className="text-2xl font-extrabold text-slate-900">₹{cost} <span className="text-xs font-bold text-slate-500">Cr</span></div>
                  <span className="text-[11px] text-slate-500">Approved by Cabinet Committee</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Revised Capital Outlay</span>
                  <div className="text-2xl font-extrabold text-slate-900">₹{revisedCost} <span className="text-xs font-bold text-slate-500">Cr</span></div>
                  <span className="text-[11px] text-slate-500">Updated in Q2 Review</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Cumulative Expenditure</span>
                  <div className="text-2xl font-extrabold text-emerald-600">₹{exp} <span className="text-xs font-bold text-emerald-700">Cr</span></div>
                  <span className="text-[11px] text-emerald-700 font-bold">{finProg}% Disbursed</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Unspent Balance</span>
                  <div className="text-2xl font-extrabold text-sky-600">₹{Math.max(0, cost - exp)} <span className="text-xs font-bold text-sky-700">Cr</span></div>
                  <span className="text-[11px] text-slate-500">Remaining Project Allocation</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Capital Outlay &amp; Funding Composition</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">Central Support</span>
                    <strong className="text-slate-900 text-base font-extrabold mt-1 block">₹{project.centralSupport || cost} Cr</strong>
                    <span className="text-[10px] text-slate-500">100% Central Sector Fund</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">State Contribution</span>
                    <strong className="text-slate-900 text-base font-extrabold mt-1 block">₹{project.stateSupport || 0} Cr</strong>
                    <span className="text-[10px] text-slate-500">State Road Share</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">Land Acquisition Factor</span>
                    <strong className="text-slate-900 text-base font-extrabold mt-1 block">₹{project.landCost || 120} Cr</strong>
                    <span className="text-[10px] text-slate-500">Section 3D Compensation</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px] font-bold uppercase">Debt / Multilateral Aid</span>
                    <strong className="text-slate-900 text-base font-extrabold mt-1 block">₹{project.debtSupport || 0} Cr</strong>
                    <span className="text-[10px] text-slate-500">External Borrowing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICAL PROGRESS */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Physical vs. Financial Progress Alignment</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Benchmarking actual contractor execution against MoSPI milestones</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-extrabold text-xs rounded-xl border border-amber-200">
                    Variance: +{gap}%
                  </span>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">Actual Physical Execution</span>
                      <span className="text-slate-900 font-extrabold">{physProg}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-sky-500 h-3.5 rounded-full transition-all" style={{ width: `${Math.min(100, physProg)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">Planned Physical Target (MoSPI Scheduled Benchmark)</span>
                      <span className="text-slate-900 font-extrabold">{planProg}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-slate-400 h-3.5 rounded-full transition-all" style={{ width: `${Math.min(100, planProg)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">Cumulative Financial Expenditure Disbursed</span>
                      <span className="text-emerald-700 font-extrabold">{finProg}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-emerald-500 h-3.5 rounded-full transition-all" style={{ width: `${Math.min(100, finProg)}%` }}></div>
                    </div>
                  </div>
                </div>

                {Number(gap) > 10 && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-xs text-amber-900">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-amber-900 block text-xs">
                        Audit Alert: Physical vs Financial Variance Flagged (+{gap}%)
                      </strong>
                      <p className="mt-1 text-amber-800 leading-relaxed font-normal">
                        Financial expenditure ({finProg}%) significantly outpaces actual on-ground physical completion ({physProg}%). Discrepancy is attributable to contractor mobilization advances and upfront land compensation payouts. A joint site inspection is recommended before issuing subsequent milestone disbursements.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MONTHLY REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Reported Cycles</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{reports.length} Months</div>
                  <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 block">April - July 2026</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Latest Spend</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">₹{reports[0]?.expenditure ?? project.expenditure ?? 0} Cr</div>
                  <span className="text-[11px] font-semibold text-sky-600 mt-0.5 block">Cumulative Outlay</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Progress</span>
                  <div className="text-xl font-extrabold text-teal-600 mt-1">{reports[0]?.actualPhysicalProgress ?? project.physicalProgress ?? 0}%</div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">Field Work Completed</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Financial Progress</span>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">{reports[0]?.actualFinancialProgress ?? project.financialProgress ?? 0}%</div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">Funds Utilized</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Submitted Progress Reports Audit Log (Month &amp; Year Breakdown)</h3>
                    <p className="text-xs text-slate-500">Official monthly flash reports and progress returns filed by field project officers</p>
                  </div>
                  {isReportingOfficer && (
                    <Link
                      to={`/submit-report?projectId=${project._id || projectCode}`}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
                    >
                      <UploadCloud size={14} />
                      <span>Submit New Report</span>
                    </Link>
                  )}
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <FileText size={32} className="mx-auto text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-700">No Monthly Reports Filed Yet</h4>
                    <p className="text-[11px] text-slate-400">Reporting officers can submit monthly physical and financial progress.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                        <tr>
                          <th className="py-3.5 px-4">Month &amp; Year</th>
                          <th className="py-3.5 px-4">Cumulative Expenditure</th>
                          <th className="py-3.5 px-4">Physical Progress</th>
                          <th className="py-3.5 px-4">Financial Progress</th>
                          <th className="py-3.5 px-4">Projected Delay</th>
                          <th className="py-3.5 px-4">Delay Reason &amp; Remarks</th>
                          <th className="py-3.5 px-4">Officer / Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reports.map((r, idx) => {
                          const monthLabel = r.monthName || (r.reportingMonth === '2026-04' ? 'April 2026' : r.reportingMonth === '2026-05' ? 'May 2026' : r.reportingMonth === '2026-06' ? 'June 2026' : r.reportingMonth === '2026-07' ? 'July 2026' : r.reportingMonth);
                          const phy = r.actualPhysicalProgress ?? 0;
                          const fin = r.actualFinancialProgress ?? 0;
                          const delay = r.delayDays ?? (r.delayMonths ? r.delayMonths * 30 : 0);

                          return (
                            <tr key={r._id || r.reportingMonth || idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900">{monthLabel}</div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{r.reportingMonth || (r.year ? `${r.year}-${String(r.month).padStart(2, '0')}` : '2026-04')}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-extrabold text-emerald-700">₹{r.expenditure} Cr</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, phy)}%` }}></div>
                                  </div>
                                  <span className="font-bold text-slate-800">{phy}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, fin)}%` }}></div>
                                  </div>
                                  <span className="font-bold text-indigo-700">{fin}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {delay > 0 ? (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                    +{delay} days
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    On Schedule
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 max-w-xs text-slate-600">
                                <div className="line-clamp-2">{r.delayReasonText || r.remarks || 'Statutory return filed'}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                <div className="font-medium">{r.submittedBy?.fullName || r.submittedBy?.name || 'Reporting Officer'}</div>
                                <div className="text-[10px] text-slate-400">Flash Report Official Sync</div>
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
          )}

          {/* TAB 5: LAND & CLEARANCES */}
          {activeTab === 'land_clearances' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Land Acquisition Matrix</h3>
                    <p className="text-[11px] text-slate-500">Right of Way &amp; possession schedule</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Total Land Required:</span>
                    <strong className="text-slate-900">{land?.totalLandRequired || 450} Hectares</strong>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Land Acquired in Possession:</span>
                    <strong className="text-emerald-600 font-extrabold">{land?.landAcquired || 380} Hectares</strong>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Acquisition Percentage:</span>
                    <strong className="text-sky-600 font-extrabold">{land?.percentageAcquired || 84.4}%</strong>
                  </div>
                  <div className="flex justify-between py-2.5 items-center">
                    <span className="text-slate-500 font-medium">Right of Way (ROW) Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                      {land?.rightOfWayStatus || 'Partial Possession (Section 3D in Supaul)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Statutory Clearances Pipeline</h3>
                    <p className="text-[11px] text-slate-500">Environmental, forest &amp; wildlife compliance</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-1">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <strong className="text-amber-900 block font-bold">Forest Clearance Stage II</strong>
                      <span className="text-amber-700 text-[11px]">State Forest Department, MoEFCC</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg">
                      PENDING
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <strong className="text-emerald-900 block font-bold">Environmental Impact Assessment (EIA)</strong>
                      <span className="text-emerald-700 text-[11px]">CPCB Approved</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-lg">
                      APPROVED
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <strong className="text-emerald-900 block font-bold">Wildlife Sanctuary Distance Clearance</strong>
                      <span className="text-emerald-700 text-[11px]">National Board for Wildlife (NBWL)</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-lg">
                      APPROVED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TENDERS & MILESTONES */}
          {activeTab === 'tenders_milestones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Tender Contracts &amp; EPC Packages</h3>
                    <p className="text-[11px] text-slate-500">Awarded packages and contractor entities</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-1">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 font-extrabold">Package-I Main Highway Civil Works</strong>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">AWARDED</span>
                    </div>
                    <span className="text-slate-500 block text-[11px]">Portal Ref: CPP-2024-NH-0482 &bull; L1 Contractor: Larsen &amp; Toubro</span>
                    <div className="flex justify-between pt-2 border-t border-slate-200/60 font-bold text-slate-800">
                      <span>Awarded Value: ₹420 Cr</span>
                      <span className="text-sky-600">Active Execution</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 font-extrabold">Package-II Bridges &amp; Culvert Structures</strong>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">AWARDED</span>
                    </div>
                    <span className="text-slate-500 block text-[11px]">Portal Ref: CPP-2024-NH-0483 &bull; L1 Contractor: Afcons Infrastructure</span>
                    <div className="flex justify-between pt-2 border-t border-slate-200/60 font-bold text-slate-800">
                      <span>Awarded Value: ₹370 Cr</span>
                      <span className="text-sky-600">Active Execution</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Milestone Progression Checklist</h3>
                    <p className="text-[11px] text-slate-500">Critical path engineering milestones</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-1">
                  {[
                    { name: 'Detailed Project Report (DPR)', status: 'COMPLETED', finish: '15/02/2024' },
                    { name: 'Environmental & Forest Stage I Clearance', status: 'COMPLETED', finish: '30/03/2024' },
                    { name: 'Right of Way & Earthwork Mobilization', status: 'IN_PROGRESS', finish: '30/11/2026' },
                    { name: 'Bituminous Pavement & Corridor Commissioning', status: 'PLANNED', finish: '31/03/2028' }
                  ].map((m, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 block font-bold">{m.name}</strong>
                        <span className="text-slate-400 text-[11px]">Target Date: {m.finish}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                        m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        m.status === 'IN_PROGRESS' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Official Project Documents &amp; Sanctions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {[
                  { name: 'Cabinet Administrative Sanction Letter.pdf', type: 'Sanction Letter', size: '2.4 MB', date: '12/01/2024' },
                  { name: 'Comprehensive DPR Study & Geotech Report.pdf', type: 'DPR', size: '18.2 MB', date: '04/02/2024' },
                  { name: 'MoEFCC Stage I Clearance Certificate.pdf', type: 'Clearance', size: '5.1 MB', date: '18/04/2024' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-sky-300 transition">
                    <div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-sky-600 w-fit mb-3">
                        <FileText size={20} />
                      </div>
                      <strong className="text-slate-900 block text-xs font-bold leading-snug">{doc.name}</strong>
                      <span className="text-[11px] text-slate-400 block mt-1">{doc.type} &bull; {doc.size}</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">{doc.date}</span>
                      <button 
                        type="button" 
                        className="text-sky-600 font-bold hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                        onClick={() => alert("Document download initialized for: " + doc.name)}
                      >
                        <span>Download</span>
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: RISK & ALERTS */}
          {activeTab === 'risk_alerts' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">AI Early Warning &amp; Risk Diagnostic</h3>
                  <span className="text-xs font-bold text-slate-400">Automated Risk Engine v2.4</span>
                </div>

                <div className={`p-5 rounded-2xl flex items-start gap-4 border ${
                  riskLevel === 'LOW'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                    : riskLevel === 'MEDIUM'
                    ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200'
                    : riskLevel === 'HIGH'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200'
                }`}>
                  <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-xs ${
                    riskLevel === 'LOW' ? 'bg-emerald-600' : riskLevel === 'MEDIUM' ? 'bg-sky-600' : riskLevel === 'HIGH' ? 'bg-amber-500' : 'bg-rose-600'
                  }`}>
                    {riskScore}
                  </div>
                  <div>
                    <h4 className={`font-extrabold text-sm tracking-tight ${
                      riskLevel === 'LOW' ? 'text-emerald-950' : riskLevel === 'MEDIUM' ? 'text-sky-950' : riskLevel === 'HIGH' ? 'text-amber-950' : 'text-rose-950'
                    }`}>
                      {riskLevel} RISK CLASSIFICATION
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      riskLevel === 'LOW' ? 'text-emerald-900' : riskLevel === 'MEDIUM' ? 'text-sky-900' : riskLevel === 'HIGH' ? 'text-amber-900' : 'text-rose-900'
                    }`}>
                      {riskLevel === 'LOW'
                        ? 'Project execution metrics, statutory milestones, and telemetry feeds are operating within safe tolerance boundaries.'
                        : `Physical vs financial progress mismatch (+${gapAbs}%) triggers an automated predictive delay warning of +${delayDays} days.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Project Specific Risk Signals</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setActionModalType('OFFICER_ACTION');
                      setActionCategory('MITIGATION_MEMO');
                      setActionTitle(`Mitigation protocol for ${projectName}`);
                      setActionRemarks('');
                      setActionNewStatus('MITIGATION_ACTIVE');
                      setActionTargetAlertId(alerts[0]?._id || '');
                      setActionFeedback(null);
                      setIsActionModalOpen(true);
                    }}
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert size={14} />
                    <span>Trigger Mitigation Action</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 text-center">
                      Standard risk envelope. No unresolved critical alerts for this project.
                    </div>
                  ) : (
                    alerts.map((a, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs hover:border-sky-300 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-extrabold border border-rose-200 text-[10px]">
                              {a.severity || 'CRITICAL'}
                            </span>
                            <strong className="text-slate-900 font-bold">{a.title || a.alertType || 'Forest Clearance Delay'}</strong>
                          </div>
                          <span className="text-slate-500 text-[11px] block mt-1 leading-snug">{a.message || a.description || 'Forest Stage II handover pending at Supaul district.'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.status !== 'RESOLVED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcknowledgeAlert(a._id || a.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs cursor-pointer transition"
                              >
                                Acknowledge
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionModalType('OFFICER_ACTION');
                                  setActionCategory('GROUND_AUDIT');
                                  setActionTitle(`Action on Alert: ${a.title || a.alertType}`);
                                  setActionRemarks('');
                                  setActionNewStatus('MITIGATION_ACTIVE');
                                  setActionTargetAlertId(a._id || a.id);
                                  setActionFeedback(null);
                                  setIsActionModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer transition"
                              >
                                Take Action
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* GOVERNANCE / POLICY ACTION MODAL */}
        {isActionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${actionModalType === 'POLICY_ACTION' ? 'bg-purple-600' : 'bg-amber-600'}`}>
                    {actionModalType === 'POLICY_ACTION' ? <Scale size={20} /> : <ShieldAlert size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">
                      {actionModalType === 'POLICY_ACTION' ? 'High-Level Policy Directive' : 'Nodal Officer Ground Action'}
                    </h3>
                    <p className="text-[11px] text-slate-300">Record statutory intervention &amp; resolve project early warning risk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecordAction} className="p-6 space-y-4 text-xs">
                {actionFeedback && (
                  <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                    actionFeedback.isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {actionFeedback.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span className="font-bold">{actionFeedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Action Level</label>
                    <select
                      value={actionModalType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setActionModalType(nextType);
                        if (nextType === 'POLICY_ACTION') {
                          setActionCategory('CCI_FAST_TRACK');
                        } else {
                          setActionCategory('GROUND_AUDIT');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="OFFICER_ACTION">Officer Action (Ground/Nodal)</option>
                      {['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role) && (
                        <option value="POLICY_ACTION">Policy Directive (Ministry/IPMD)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Action Category</label>
                    <select
                      value={actionCategory}
                      onChange={(e) => setActionCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      {actionModalType === 'OFFICER_ACTION' ? (
                        <>
                          <option value="GROUND_AUDIT">Physical Ground Audit &amp; Inspection</option>
                          <option value="SHOW_CAUSE">Formal Show-Cause Notice to Contractor</option>
                          <option value="MITIGATION_MEMO">Official Mitigation Protocol Issued</option>
                          <option value="SITE_COORDINATION">Joint District Inter-Agency Review</option>
                          <option value="TECHNICAL_INSPECTION">Technical Expert Review Commissioned</option>
                        </>
                      ) : (
                        <>
                          <option value="CCI_FAST_TRACK">CCI Fast-Track Committee Escalation</option>
                          <option value="CLEARANCE_TASKFORCE">Inter-Ministerial Clearance Taskforce</option>
                          <option value="FUND_REALLOCATION">Capital Outlay Reallocation / Sanction</option>
                          <option value="STATUTORY_ESCROW">Escrow Account Penalty &amp; Clawback</option>
                          <option value="POLICY_WAIVER">Statutory Procedure Exemption / Waiver</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Action Title / Directive Order Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Directive issued for 24x7 bridge girder fabrication"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remarks, Directives &amp; Timeline</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Specify action orders, assigned contractors, inspection dates, and mitigation timeline..."
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Updated Project Status</label>
                    <select
                      value={actionNewStatus}
                      onChange={(e) => setActionNewStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="MITIGATION_ACTIVE">MITIGATION ACTIVE (Under Action)</option>
                      <option value="IN_PROGRESS">IN PROGRESS (Standard Execution)</option>
                      <option value="ON_TRACK">ON TRACK (Risk Resolved)</option>
                      <option value="CRITICAL_DELAY">CRITICAL DELAY (Escalated)</option>
                    </select>
                  </div>

                  {alerts.length > 0 && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Link / Resolve Alert</label>
                      <select
                        value={actionTargetAlertId}
                        onChange={(e) => setActionTargetAlertId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                      >
                        <option value="">None (General Project Action)</option>
                        {alerts.map((al, idx) => (
                          <option key={idx} value={al._id || al.id}>
                            {al.title || al.alertType} ({al.severity})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAction ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Recording Action...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Record &amp; Update Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
