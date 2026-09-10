import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  Building2, 
  Plus, 
  Search, 
  Mail, 
  Building, 
  RefreshCw, 
  X,
  Users,
  UserPlus,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Shield,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  FolderKanban,
  Calendar,
  Briefcase,
  Layers,
  ArrowUpRight,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { agencyApi } from '../api/agencyApi';
import { ministryApi } from '../api/ministryApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

export default function AgencyManagementPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user: currentUser } = useAuth();

  const [agencies, setAgencies] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // Expanded agency accordions for viewing registered officers (for Super Admin / Ministry)
  const [expandedAgencies, setExpandedAgencies] = useState({});

  // View Officer Data Modal
  const [selectedOfficerForView, setSelectedOfficerForView] = useState(null);
  const [showOfficerDetailModal, setShowOfficerDetailModal] = useState(false);

  // Agency Registration Modal (Super Admin / Ministry)
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [submittingAgency, setSubmittingAgency] = useState(false);
  const [agencyFormData, setAgencyFormData] = useState({
    name: '',
    code: '',
    type: 'PSU',
    ministry: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    nodalOfficerName: '',
  });

  // Officer Account Creation Modal (Same Agency: Nodal & Reporting Officers)
  const [showUserModal, setShowUserModal] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [selectedAgencyForUser, setSelectedAgencyForUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'NODAL_OFFICER',
    designation: '',
    phone: '',
    agencyId: '',
    ministryId: ''
  });

  const isSuperAdmin = ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(currentUser?.role);
  const isMinistry = ['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(currentUser?.role);
  const isAgency = ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(currentUser?.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agRes, minRes, usersRes] = await Promise.allSettled([
        agencyApi.getAgencies(),
        ministryApi.getMinistries(),
        userApi.getUsers()
      ]);

      if (agRes.status === 'fulfilled') {
        const a = agRes.value;
        const agencyList = Array.isArray(a) ? a : (a?.data || a?.agencies || []);
        setAgencies(Array.isArray(agencyList) ? agencyList : []);
      } else {
        throw new Error('Failed to load agencies');
      }

      if (minRes.status === 'fulfilled') {
        const m = minRes.value;
        const minList = Array.isArray(m) ? m : (m?.data || m?.ministries || []);
        setMinistries(Array.isArray(minList) ? minList : []);
      }

      if (usersRes.status === 'fulfilled') {
        const u = usersRes.value;
        const userList = Array.isArray(u) ? u : (u?.data?.users || u?.users || u?.data || []);
        setUsers(Array.isArray(userList) ? userList : []);
      }
    } catch (err) {
      console.error('Failed to load agencies directory:', err);
      setError('Failed to fetch agencies directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle View Officers accordion
  const toggleAgencyOfficers = (agencyId) => {
    setExpandedAgencies(prev => ({
      ...prev,
      [agencyId]: !prev[agencyId]
    }));
  };

  // Get all officer accounts for a specific agency
  const getAgencyOfficers = (agencyId) => {
    if (!agencyId) return [];
    return users.filter(u => {
      const uAgId = u.agencyId?._id || u.agencyId || u.agency?._id || u.agency || u.organizationId?._id || u.organizationId;
      return uAgId && uAgId.toString() === agencyId.toString();
    });
  };

  // Smart Automatic Defaults for Officer Attributes based on Role and Affiliated Body
  const getRoleDefaults = (role, agency) => {
    const ag = agency || myAgency;
    const code = ag?.agencyCode || ag?.code || 'AGY';
    const randNum = Math.floor(100 + Math.random() * 900);

    if (role === 'NODAL_OFFICER') {
      return {
        designation: `Project Director / Nodal Officer (${code})`,
        department: 'Project Monitoring & AI Vigilance Directorate',
        employeeId: `${code}-NOD-${randNum}`
      };
    }
    if (role === 'REPORTING_OFFICER') {
      return {
        designation: `Resident Engineer / Field Reporting Officer`,
        department: 'Field Supervision & Ground Progress Unit',
        employeeId: `${code}-REP-${randNum}`
      };
    }
    if (role === 'IMPLEMENTATION_AGENCY' || role === 'AGENCY_ADMIN') {
      return {
        designation: `Chief General Manager / Agency Head (${code})`,
        department: 'Project Implementation & Execution Wing',
        employeeId: `${code}-CGM-${randNum}`
      };
    }
    return {
      designation: 'Joint Secretary / Ministry Officer',
      department: 'Infrastructure Planning & Project Directorate',
      employeeId: `MIN-${randNum}`
    };
  };

  // Open User Creation Modal pre-configured for a given agency
  const openCreateUserModal = (agency, preselectedRole = 'NODAL_OFFICER') => {
    const targetAgency = agency || myAgency;
    const agId = targetAgency?._id || targetAgency?.id || (currentUser?.agencyId?._id || currentUser?.agencyId || '');
    const minId = targetAgency?.ministryId?._id || targetAgency?.ministryId || (typeof targetAgency?.ministry === 'string' ? targetAgency.ministry : (targetAgency?.ministry?._id || currentUser?.ministryId || ''));

    let defaultRole = preselectedRole;
    if (isMinistry) defaultRole = 'IMPLEMENTATION_AGENCY';

    const defaults = getRoleDefaults(defaultRole, targetAgency);

    setSelectedAgencyForUser(targetAgency);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: defaultRole,
      designation: defaults.designation,
      department: defaults.department,
      employeeId: defaults.employeeId,
      phone: '',
      agencyId: agId,
      ministryId: minId
    });
    setShowUserModal(true);
  };

  // Open Officer Details Modal
  const openOfficerDetailsModal = (officer) => {
    setSelectedOfficerForView(officer);
    setShowOfficerDetailModal(true);
  };

  // Toggle Officer Active / Deactive status
  const handleToggleOfficerStatus = async (officer) => {
    const officerId = officer._id || officer.id;
    const isCurrentlyActive = officer.isActive !== false && officer.status !== 'DEACTIVATED';
    const nextStatus = isCurrentlyActive ? 'DEACTIVATED' : 'ACTIVE';
    
    try {
      setStatusLoadingId(officerId);
      await userApi.updateUserStatus(officerId, nextStatus);
      setUsers(prev => prev.map(u => {
        if ((u._id === officerId || u.id === officerId)) {
          return { ...u, status: nextStatus, isActive: nextStatus === 'ACTIVE' };
        }
        return u;
      }));
      if (selectedOfficerForView && (selectedOfficerForView._id === officerId || selectedOfficerForView.id === officerId)) {
        setSelectedOfficerForView(prev => ({
          ...prev,
          status: nextStatus,
          isActive: nextStatus === 'ACTIVE'
        }));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Check if current logged in user can alter status of target officer
  const canToggleStatus = (officer) => {
    if (isSuperAdmin) return true;
    if (isMinistry && ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(officer.role)) return true;
    if (isAgency && ['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(officer.role)) return true;
    return false;
  };

  // Handle Organization / Agency registration (Ministry / Super Admin)
  const handleCreateAgency = async (e) => {
    e.preventDefault();
    if (!agencyFormData.name || !agencyFormData.code) {
      alert('Agency Name and Code are required.');
      return;
    }

    try {
      setSubmittingAgency(true);
      const payload = {
        name: agencyFormData.name,
        agencyCode: agencyFormData.code.toUpperCase(),
        organizationType: agencyFormData.type,
        ministryId: agencyFormData.ministry || (isMinistry ? (currentUser?.ministryId?._id || currentUser?.ministryId) : undefined),
        description: agencyFormData.description,
        email: agencyFormData.contactEmail,
        phone: agencyFormData.contactPhone,
        contactPerson: agencyFormData.nodalOfficerName
      };

      await agencyApi.createAgency(payload);
      setShowAgencyModal(false);
      setAgencyFormData({
        name: '',
        code: '',
        type: 'PSU',
        ministry: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        nodalOfficerName: '',
      });
      fetchData();
    } catch (err) {
      alert('Failed to register agency: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAgency(false);
    }
  };

  // Handle Account Creation (Agency Admin creates Nodal/Reporting Officers; Ministry creates Agency Officers)
  const handleCreateOfficerAccount = async (e) => {
    e.preventDefault();
    if (
      !userFormData.name?.trim() ||
      !userFormData.email?.trim() ||
      !userFormData.password?.trim() ||
      !userFormData.role ||
      !userFormData.phone?.trim()
    ) {
      alert('All fields are required. Please provide Official Name, Email, Password, Role, and Contact Phone.');
      return;
    }

    try {
      setSubmittingUser(true);
      const payload = {
        name: userFormData.name.trim(),
        email: userFormData.email.trim(),
        password: userFormData.password.trim(),
        role: userFormData.role,
        designation: userFormData.designation,
        employeeId: userFormData.employeeId,
        department: userFormData.department,
        phone: userFormData.phone.trim(),
        agency: userFormData.agencyId || undefined,
        ministry: userFormData.ministryId || undefined
      };

      await userApi.createUser(payload);
      setShowUserModal(false);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'NODAL_OFFICER',
        designation: '',
        employeeId: '',
        department: '',
        phone: '',
        agencyId: '',
        ministryId: ''
      });
      fetchData();
    } catch (err) {
      alert('Failed to create account: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingUser(false);
    }
  };

  // Resolve logged in agency context if isAgency
  const myAgencyId = currentUser?.agencyId?._id || currentUser?.agencyId || currentUser?.agency?._id || currentUser?.agency || currentUser?.organizationId;
  const myAgency = agencies.find(a => {
    const agId = (a._id || a.id)?.toString();
    const targetId = myAgencyId?.toString();
    return (targetId && agId === targetId) || (currentUser?.agencyCode && a.agencyCode === currentUser.agencyCode);
  }) || (currentUser?.agency?.name ? currentUser.agency : null) || agencies.find(a => a.agencyCode === 'NHAI') || agencies[0] || {
    name: 'National Highways Authority of India',
    agencyCode: 'NHAI',
    organizationType: 'PSU'
  };

  // Filtered officers for the dedicated Implementation Agency view (Strictly Nodal & Reporting Officers only; exclude Agency Officer account)
  const myAgencyOfficers = isAgency
    ? users.filter(u => ['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(u.role))
    : getAgencyOfficers(myAgency?._id || myAgency?.id || myAgencyId);

  const filteredMyOfficers = myAgencyOfficers.filter(o => {
    const search = searchTerm.toLowerCase();
    const name = o.name || o.fullName || '';
    const email = o.email || o.officialEmail || '';
    const desig = o.designation || '';
    const phone = o.phone || o.mobileNumber || '';
    const matchesSearch = name.toLowerCase().includes(search) || email.toLowerCase().includes(search) || desig.toLowerCase().includes(search) || phone.toLowerCase().includes(search);

    const matchesRole = roleFilter === 'ALL' || o.role === roleFilter;
    const isActive = o.isActive !== false && o.status !== 'DEACTIVATED';
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? isActive : !isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredAgencies = agencies.filter(a => {
    const search = searchTerm.toLowerCase();
    const code = a.agencyCode || a.code || '';
    const name = a.name || '';
    const exec = a.contactPerson || a.nodalOfficerName || '';
    return name.toLowerCase().includes(search) || code.toLowerCase().includes(search) || exec.toLowerCase().includes(search);
  });

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'IMPLEMENTATION_AGENCY' || r === 'AGENCY_ADMIN') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Building2 size={11} /> Agency Officer</span>;
    }
    if (r === 'NODAL_OFFICER') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><UserCheck size={11} /> Nodal Officer</span>;
    }
    if (r === 'REPORTING_OFFICER') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><FileText size={11} /> Reporting Officer</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><Shield size={11} /> {r}</span>;
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
          activeKey="/agencies"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* =========================================================================
              VIEW A: DEDICATED OFFICER COMMAND CENTER FOR IMPLEMENTATION AGENCIES
             ========================================================================= */}
          {isAgency ? (
            <div className="space-y-6">
              {/* Agency Header Banner */}
              <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <Building2 size={24} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          {myAgency?.name || 'Executing Agency'}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {myAgency?.agencyCode || myAgency?.code || 'AGY'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        Provision, oversee, activate, and deactivate Nodal and Reporting Officers under this agency.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={() => openCreateUserModal(myAgency, 'NODAL_OFFICER')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <UserPlus size={15} />
                    + Create Nodal Officer
                  </button>

                  <button
                    onClick={() => openCreateUserModal(myAgency, 'REPORTING_OFFICER')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <UserPlus size={15} />
                    + Create Reporting Officer
                  </button>

                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
                    title="Refresh Officer Directory"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Agency Officers Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="dashboard-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Officers</span>
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-600"><Users size={16} /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{myAgencyOfficers.length}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Staff mapped to agency</div>
                </div>

                <div className="dashboard-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Nodal Officers</span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><UserCheck size={16} /></span>
                  </div>
                  <div className="text-2xl font-black text-amber-700 mt-2">
                    {myAgencyOfficers.filter(o => o.role === 'NODAL_OFFICER').length}
                  </div>
                  <div className="text-[11px] text-amber-600/80 mt-1">AI Alerts &amp; Clearances</div>
                </div>

                <div className="dashboard-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Reporting Officers</span>
                    <span className="p-2 rounded-xl bg-sky-50 text-sky-600"><FileText size={16} /></span>
                  </div>
                  <div className="text-2xl font-black text-sky-700 mt-2">
                    {myAgencyOfficers.filter(o => o.role === 'REPORTING_OFFICER').length}
                  </div>
                  <div className="text-[11px] text-sky-600/80 mt-1">Ground Telemetry Inputs</div>
                </div>

                <div className="dashboard-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Status</span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={16} /></span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-2">
                    {myAgencyOfficers.filter(o => o.isActive !== false && o.status !== 'DEACTIVATED').length}
                  </div>
                  <div className="text-[11px] text-emerald-600/80 mt-1">Authorized accounts</div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="dashboard-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full md:max-w-md focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search officers by name, email, designation, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Roles ({myAgencyOfficers.length})</option>
                    <option value="NODAL_OFFICER">Nodal Officers Only</option>
                    <option value="REPORTING_OFFICER">Reporting Officers Only</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="DEACTIVATED">Deactivated Only</option>
                  </select>
                </div>
              </div>

              {/* Officers Table */}
              {loading ? (
                <div className="py-20 text-center dashboard-card">
                  <RefreshCw size={36} className="animate-spin text-emerald-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-semibold">Loading agency officers directory...</p>
                </div>
              ) : filteredMyOfficers.length === 0 ? (
                <div className="py-16 text-center dashboard-card border-dashed">
                  <Users size={44} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No Officers Found</h4>
                  <p className="text-slate-500 text-xs mt-1">
                    {searchTerm ? 'No officers match your search query.' : 'Provision your first Nodal Officer or Reporting Officer for this agency.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => openCreateUserModal(myAgency, 'NODAL_OFFICER')}
                      className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition"
                    >
                      + Create Nodal Officer
                    </button>
                    <button
                      onClick={() => openCreateUserModal(myAgency, 'REPORTING_OFFICER')}
                      className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition"
                    >
                      + Create Reporting Officer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dashboard-card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-5">Official Name &amp; Email</th>
                          <th className="py-3.5 px-5">System Role</th>
                          <th className="py-3.5 px-5">Designation</th>
                          <th className="py-3.5 px-5">Contact Phone</th>
                          <th className="py-3.5 px-5">Assigned Assets</th>
                          <th className="py-3.5 px-5">Status</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMyOfficers.map((officer) => {
                          const officerId = officer._id || officer.id;
                          const isActive = officer.isActive !== false && officer.status !== 'DEACTIVATED';
                          const assignedProjectsCount = officer.projectIds?.length || 0;
                          const initial = (officer.name || officer.fullName || 'O').charAt(0).toUpperCase();

                          return (
                            <tr 
                              key={officerId} 
                              className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                              onClick={() => openOfficerDetailsModal(officer)}
                            >
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center border border-slate-200 shrink-0">
                                    {initial}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {officer.name || officer.fullName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                      <Mail size={11} /> {officer.email || officer.officialEmail}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                                {getRoleBadge(officer.role)}
                              </td>

                              <td className="py-3.5 px-5 text-slate-700 font-medium">
                                {officer.designation || 'Agency Official'}
                              </td>

                              <td className="py-3.5 px-5 text-slate-600">
                                {officer.phone || officer.mobileNumber || '—'}
                              </td>

                              <td className="py-3.5 px-5">
                                {assignedProjectsCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                                    <FolderKanban size={11} className="text-sky-600" />
                                    {assignedProjectsCount} {assignedProjectsCount === 1 ? 'Project' : 'Projects'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Unassigned</span>
                                )}
                              </td>

                              <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 size={11} /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                    <XCircle size={11} /> Deactivated
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openOfficerDetailsModal(officer)}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                                    title="View Full Officer Data & Profile"
                                  >
                                    <Eye size={13} />
                                    <span>Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleOfficerStatus(officer)}
                                    disabled={statusLoadingId === officerId}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                      isActive 
                                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {statusLoadingId === officerId 
                                      ? '...' 
                                      : (isActive ? 'Deactivate' : 'Activate')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
                VIEW B: MULTI-AGENCY REGISTRY VIEW (FOR SUPER ADMIN / MINISTRY OFFICER)
               ========================================================================= */
            <div>
              {/* Header Banner */}
              <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <Building2 size={24} />
                    </span>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        Executing &amp; Implementation Agencies
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        Central Line Ministries register executing agencies (e.g. NHAI, RVNL) and manage officer governance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  {(isSuperAdmin || isMinistry) && (
                    <button
                      onClick={() => setShowAgencyModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Plus size={16} />
                      Register Agency
                    </button>
                  )}

                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
                    title="Refresh Agency Directory"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Search Toolbar */}
              <div className="dashboard-card flex items-center justify-between p-5 mb-6">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full max-w-md focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search agency name or code (e.g. NHAI, RVNL, NTPC)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
                  />
                </div>
                <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                  Showing {filteredAgencies.length} of {agencies.length} Agencies
                </span>
              </div>

              {/* Agencies Grid */}
              {loading ? (
                <div className="py-24 text-center">
                  <RefreshCw size={36} className="animate-spin text-emerald-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-semibold">Fetching implementation agencies &amp; officer directory...</p>
                </div>
              ) : filteredAgencies.length === 0 ? (
                <div className="py-20 text-center dashboard-card">
                  <Building2 size={44} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No Implementation Agencies Found</h4>
                  <p className="text-slate-500 text-xs mt-1">
                    {isMinistry 
                      ? 'Register an executing agency under your Ministry to begin provisioning accounts and mapping projects.' 
                      : 'No agencies match your current search filters.'}
                  </p>
                  {(isSuperAdmin || isMinistry) && (
                    <button
                      onClick={() => setShowAgencyModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                    >
                      <Plus size={15} /> Register First Agency
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-7">
                  {filteredAgencies.map((agency) => {
                    const agencyId = agency._id || agency.id;
                    const agencyCode = agency.agencyCode || agency.code || 'AGY';
                    const ministryName = agency.ministryId?.name || agency.ministry?.name || (typeof agency.ministry === 'string' ? agency.ministry : null);
                    const agencyOfficers = getAgencyOfficers(agencyId);
                    const nodalCount = agencyOfficers.filter(o => o.role === 'NODAL_OFFICER').length;
                    const reportingCount = agencyOfficers.filter(o => o.role === 'REPORTING_OFFICER').length;
                    const agencyAdminCount = agencyOfficers.filter(o => ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(o.role)).length;
                    const isExpanded = !!expandedAgencies[agencyId];

                    return (
                      <div 
                        key={agencyId}
                        className="dashboard-card hover:border-emerald-300 transition-all p-6 sm:p-7 mb-0 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Agency Badges & Action */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {agencyCode}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700">
                                {agency.organizationType || agency.type || 'PSU'}
                              </span>
                              {ministryName && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                  <Building size={11} /> {ministryName}
                                </span>
                              )}
                            </div>

                            {/* Direct "+ Create Officer Account" button for this Agency */}
                            <button
                              onClick={() => openCreateUserModal(agency)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition shrink-0 cursor-pointer self-start sm:self-auto"
                            >
                              <UserPlus size={14} />
                              + Provision Officer ({agencyCode})
                            </button>
                          </div>

                          {/* Agency Title & Description */}
                          <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                            {agency.name}
                          </h3>
                          
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-5">
                            {agency.description || 'Designated nodal executing entity for capital civil works, engineering EPC oversight, and ground telemetry delivery.'}
                          </p>

                          {/* Officer Accounts Metric Pills for the SAME Agency */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 p-4 bg-slate-50/90 rounded-2xl border border-slate-100">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Agency Accounts</span>
                              <span className="text-base font-extrabold text-slate-900">{agencyOfficers.length} Officers</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-amber-600 block uppercase tracking-wider">Nodal Officers</span>
                              <span className="text-base font-extrabold text-amber-700">{nodalCount} Active</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-sky-600 block uppercase tracking-wider">Reporting Officers</span>
                              <span className="text-base font-extrabold text-sky-700">{reportingCount} Active</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-emerald-600 block uppercase tracking-wider">Agency Admins</span>
                              <span className="text-base font-extrabold text-emerald-700">{agencyAdminCount} Officers</span>
                            </div>
                          </div>
                        </div>

                        {/* Agency Meta & Toggle Officers Accordion */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                          <div className="flex flex-wrap items-center gap-4">
                            {(agency.email || agency.contactEmail) && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail size={13} className="text-slate-400" />
                                <span>{agency.email || agency.contactEmail}</span>
                              </div>
                            )}
                            {(agency.phone || agency.contactPhone) && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Phone size={13} className="text-slate-400" />
                                <span>{agency.phone || agency.contactPhone}</span>
                              </div>
                            )}
                            {(agency.contactPerson || agency.nodalOfficerName) && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Executive: <strong className="text-slate-800">{agency.contactPerson || agency.nodalOfficerName}</strong></span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => toggleAgencyOfficers(agencyId)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-xl border border-sky-200 transition cursor-pointer self-start sm:self-auto"
                          >
                            <Users size={13} />
                            {isExpanded ? 'Hide Officers' : `Manage Officers (${agencyOfficers.length})`}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Expandable Officer Accounts Table */}
                        {isExpanded && (
                          <div className="mt-5 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <Users size={14} className="text-sky-600" />
                                Official Accounts Provisioned under {agency.name} ({agencyCode})
                              </h4>
                              <button
                                onClick={() => openCreateUserModal(agency)}
                                className="text-xs font-bold text-sky-600 hover:text-sky-700 underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={12} /> Add Officer
                              </button>
                            </div>

                            {agencyOfficers.length === 0 ? (
                              <div className="p-6 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                                <p className="text-xs text-slate-500 font-semibold">No Nodal or Reporting Officers have been provisioned under this agency yet.</p>
                                <button
                                  onClick={() => openCreateUserModal(agency)}
                                  className="mt-2.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                                >
                                  + Provision First Officer
                                </button>
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                      <th className="py-3 px-4">Official Name &amp; Email</th>
                                      <th className="py-3 px-4">System Role</th>
                                      <th className="py-3 px-4">Designation</th>
                                      <th className="py-3 px-4">Contact Phone</th>
                                      <th className="py-3 px-4">Account Status</th>
                                      <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {agencyOfficers.map((officer) => {
                                      const officerId = officer._id || officer.id;
                                      const isActive = officer.isActive !== false && officer.status !== 'DEACTIVATED';
                                      const canManage = canToggleStatus(officer);

                                      return (
                                        <tr key={officerId} className="hover:bg-slate-50/80">
                                          <td className="py-3 px-4">
                                            <div className="font-bold text-slate-900">{officer.name || officer.fullName}</div>
                                            <div className="text-[11px] text-slate-400">{officer.email || officer.officialEmail}</div>
                                          </td>
                                          <td className="py-3 px-4">
                                            {getRoleBadge(officer.role)}
                                          </td>
                                          <td className="py-3 px-4 text-slate-700 font-medium">
                                            {officer.designation || 'Agency Official'}
                                          </td>
                                          <td className="py-3 px-4 text-slate-600">
                                            {officer.phone || officer.mobileNumber || '—'}
                                          </td>
                                          <td className="py-3 px-4">
                                            {isActive ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                <CheckCircle2 size={11} /> Active
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                <XCircle size={11} /> Deactivated
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={() => openOfficerDetailsModal(officer)}
                                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                                                title="View Full Profile Data"
                                              >
                                                <Eye size={12} />
                                                <span>Details</span>
                                              </button>

                                              {canManage && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleOfficerStatus(officer)}
                                                  disabled={statusLoadingId === officerId}
                                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    isActive 
                                                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                  }`}
                                                >
                                                  {statusLoadingId === officerId 
                                                    ? '...' 
                                                    : (isActive ? 'Deactivate' : 'Activate')}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* =========================================================================
          MODAL 1: VIEW OFFICER DATA & ASSIGNED PROJECTS (SEE OFFICER DATA)
         ========================================================================= */}
      {showOfficerDetailModal && selectedOfficerForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 font-extrabold text-lg flex items-center justify-center border border-sky-200">
                  {(selectedOfficerForView.name || selectedOfficerForView.fullName || 'O').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedOfficerForView.name || selectedOfficerForView.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getRoleBadge(selectedOfficerForView.role)}
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedOfficerForView.designation || 'Government Official'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowOfficerDetailModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Account Status Card with Instant Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Account Authority Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedOfficerForView.isActive !== false && selectedOfficerForView.status !== 'DEACTIVATED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 size={13} /> Active &amp; Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100/70 px-2.5 py-0.5 rounded-full border border-red-300">
                        <XCircle size={13} /> Deactivated / Suspended
                      </span>
                    )}
                  </div>
                </div>

                {canToggleStatus(selectedOfficerForView) && (
                  <button
                    onClick={() => handleToggleOfficerStatus(selectedOfficerForView)}
                    disabled={statusLoadingId === (selectedOfficerForView._id || selectedOfficerForView.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                      selectedOfficerForView.isActive !== false && selectedOfficerForView.status !== 'DEACTIVATED'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {statusLoadingId === (selectedOfficerForView._id || selectedOfficerForView.id)
                      ? 'Updating...'
                      : (selectedOfficerForView.isActive !== false && selectedOfficerForView.status !== 'DEACTIVATED' ? 'Deactivate Account' : 'Activate Account')}
                  </button>
                )}
              </div>

              {/* Officer Profile Attributes */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">Official Credentials &amp; Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email Address</span>
                    <span className="font-bold text-slate-800 break-all">{selectedOfficerForView.email || selectedOfficerForView.officialEmail}</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Mobile Number</span>
                    <span className="font-bold text-slate-800">{selectedOfficerForView.phone || selectedOfficerForView.mobileNumber || 'Not Provided'}</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID / Code</span>
                    <span className="font-bold text-slate-800">{selectedOfficerForView.employeeId || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Department / Division</span>
                    <span className="font-bold text-slate-800">{selectedOfficerForView.department || 'Infrastructure Cell'}</span>
                  </div>
                </div>
              </div>

              {/* Institutional Affiliation */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">Institutional Affiliation</h4>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Executing Agency:</span>
                    <span className="font-bold text-slate-800">
                      {selectedOfficerForView.agencyId?.name || selectedOfficerForView.agency?.name || myAgency?.name || 'Executing Agency'}
                    </span>
                  </div>
                  {(selectedOfficerForView.ministryId?.name || selectedOfficerForView.ministry?.name || myAgency?.ministryId?.name) && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Sponsoring Ministry:</span>
                      <span className="font-bold text-sky-700">
                        {selectedOfficerForView.ministryId?.name || selectedOfficerForView.ministry?.name || myAgency?.ministryId?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Infrastructure Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKanban size={14} className="text-sky-600" />
                    Assigned Infrastructure Assets ({selectedOfficerForView.projectIds?.length || 0})
                  </h4>
                </div>

                {(!selectedOfficerForView.projectIds || selectedOfficerForView.projectIds.length === 0) ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No infrastructure projects currently assigned to this officer.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOfficerForView.projectIds.map((proj, idx) => {
                      const projName = typeof proj === 'object' ? proj.projectName : `Project ${proj}`;
                      const projCode = typeof proj === 'object' ? proj.projectCode : 'PRJ';
                      const pId = typeof proj === 'object' ? (proj._id || proj.id) : proj;

                      return (
                        <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition">
                          <div>
                            <div className="font-bold text-slate-900">{projName}</div>
                            <div className="text-[11px] font-mono text-slate-500">{projCode}</div>
                          </div>
                          {pId && (
                            <Link
                              to={`/projects/${pId}`}
                              className="text-sky-600 hover:text-sky-700 font-bold text-[11px] flex items-center gap-1 shrink-0"
                            >
                              <span>View Asset</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowOfficerDetailModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Close Data View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PROVISION OFFICER ACCOUNT (NODAL / REPORTING OFFICERS)
         ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Provision Officer Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Executing Agency: <strong className="text-slate-800">{selectedAgencyForUser?.name || myAgency?.name || 'Executing Agency'}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOfficerAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. officer@agency.gov.in"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const defaults = getRoleDefaults(newRole, selectedAgencyForUser || myAgency);
                      setUserFormData({
                        ...userFormData,
                        role: newRole,
                        designation: defaults.designation,
                        department: defaults.department,
                        employeeId: defaults.employeeId
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none font-semibold cursor-pointer"
                  >
                    {isAgency && (
                      <>
                        <option value="NODAL_OFFICER">Nodal Officer (Clearances &amp; AI Alerts)</option>
                        <option value="REPORTING_OFFICER">Reporting Officer (Ground Progress Inputs)</option>
                      </>
                    )}
                    {isMinistry && (
                      <option value="IMPLEMENTATION_AGENCY">Implementation Agency Officer</option>
                    )}
                    {isSuperAdmin && (
                      <>
                        <option value="NODAL_OFFICER">Nodal Officer (Clearances &amp; AI Alerts)</option>
                        <option value="REPORTING_OFFICER">Reporting Officer (Ground Inputs)</option>
                        <option value="IMPLEMENTATION_AGENCY">Implementation Agency Officer</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Designation *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock size={9} /> Locked
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    tabIndex={-1}
                    value={userFormData.designation}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed outline-none select-none"
                    title="Auto-filled according to role and executing agency"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Employee ID *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock size={9} /> System Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    tabIndex={-1}
                    value={userFormData.employeeId || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono font-bold cursor-not-allowed outline-none select-none"
                    title="Auto-generated according to role and agency code"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Department / Cell *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock size={9} /> Locked
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    tabIndex={-1}
                    value={userFormData.department || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-not-allowed outline-none select-none"
                    title="Auto-filled according to role and executing agency"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Locked Agency Context Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Affiliated Executing Agency</span>
                  <span className="font-bold text-slate-800">{selectedAgencyForUser?.name || myAgency?.name || 'Executing Agency'}</span>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold rounded-lg border border-emerald-200 text-xs">
                  {selectedAgencyForUser?.agencyCode || selectedAgencyForUser?.code || myAgency?.agencyCode || 'AGY'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {submittingUser ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REGISTER AGENCY ORGANIZATION (MINISTRY / SUPER ADMIN ONLY)
         ========================================================================= */}
      {showAgencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Building2 size={20} />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Register Implementation Agency</h3>
              </div>
              <button 
                onClick={() => setShowAgencyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Highways Authority of India"
                  value={agencyFormData.name}
                  onChange={(e) => setAgencyFormData({ ...agencyFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Code / Acronym *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NHAI"
                    value={agencyFormData.code}
                    onChange={(e) => setAgencyFormData({ ...agencyFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Agency Type</label>
                  <select
                    value={agencyFormData.type}
                    onChange={(e) => setAgencyFormData({ ...agencyFormData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="PSU">Central PSU</option>
                    <option value="STATUTORY_BODY">Statutory Authority</option>
                    <option value="STATE_DEPT">State Department</option>
                    <option value="AUTONOMOUS_BODY">Autonomous Body</option>
                    <option value="SPV">Special Purpose Vehicle (SPV)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sponsoring Central Ministry { isMinistry && <span className="text-[10px] text-slate-400 font-normal">(Locked to Your Ministry)</span> }
                </label>
                <select
                  value={agencyFormData.ministry}
                  disabled={isMinistry}
                  onChange={(e) => setAgencyFormData({ ...agencyFormData, ministry: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none cursor-pointer disabled:opacity-75 disabled:bg-slate-100"
                >
                  <option value="">-- Direct / Unassigned --</option>
                  {ministries.map(m => (
                    <option key={m._id || m.id} value={m._id || m.id}>{m.name} ({m.code || 'MIN'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Chief Executive / Nodal Officer</label>
                <input
                  type="text"
                  placeholder="e.g. Shri Santosh Kumar Yadav, Chairman"
                  value={agencyFormData.nodalOfficerName}
                  onChange={(e) => setAgencyFormData({ ...agencyFormData, nodalOfficerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. info@nhai.org"
                    value={agencyFormData.contactEmail}
                    onChange={(e) => setAgencyFormData({ ...agencyFormData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 011-25074100"
                    value={agencyFormData.contactPhone}
                    onChange={(e) => setAgencyFormData({ ...agencyFormData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAgencyModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAgency}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {submittingAgency ? 'Registering...' : 'Register Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
