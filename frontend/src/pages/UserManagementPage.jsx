import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Building, 
  Mail, 
  RefreshCw, 
  X,
  UserCheck,
  Building2,
  Lock
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { userApi } from '../api/userApi';
import { ministryApi } from '../api/ministryApi';
import { agencyApi } from '../api/agencyApi';
import { useAuth } from '../context/AuthContext';

export default function UserManagementPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isSuperAdmin = ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(currentUser?.role);
  const isMinistry = ['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(currentUser?.role);
  const isAgency = ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(currentUser?.role);
  const canCreateUsers = isSuperAdmin || isMinistry || isAgency;

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'REPORTING_OFFICER',
    ministry: '',
    agency: '',
    designation: '',
    employeeId: '',
    department: '',
    phone: '',
  });

  const getRoleDefaults = (role, targetAgencyId) => {
    const ag = agencies.find(a => (a._id || a.id)?.toString() === targetAgencyId?.toString()) || { agencyCode: 'AGY' };
    const code = ag.agencyCode || ag.code || 'AGY';
    const randNum = Math.floor(100 + Math.random() * 900);

    if (role === 'SUPER_ADMIN') {
      return {
        designation: 'Principal Secretary / Super Administrator',
        department: 'Cabinet Secretariat / Central Project Monitoring Cell',
        employeeId: `NIVARA-SA-${randNum}`
      };
    }
    if (role === 'IPMD_ADMIN') {
      return {
        designation: 'Director & IPMD Administrator',
        department: 'Infrastructure Project Monitoring Division',
        employeeId: `IPMD-DIR-${randNum}`
      };
    }
    if (role === 'MINISTRY_OFFICER' || role === 'MINISTRY_ADMIN') {
      return {
        designation: 'Joint Secretary / Ministry Officer',
        department: 'Infrastructure Planning & Project Directorate',
        employeeId: `MIN-${randNum}`
      };
    }
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

  const openCreateModal = () => {
    let defaultRole = 'REPORTING_OFFICER';
    if (isMinistry) defaultRole = 'IMPLEMENTATION_AGENCY';
    if (isAgency) defaultRole = 'NODAL_OFFICER';

    const defaultMinistry = (currentUser?.ministryId?._id || currentUser?.ministryId || currentUser?.ministry?._id || currentUser?.ministry || '');
    const defaultAgency = (currentUser?.agencyId?._id || currentUser?.agencyId || currentUser?.agency?._id || currentUser?.agency || currentUser?.organizationId || '');

    const defaults = getRoleDefaults(defaultRole, defaultAgency);

    setFormData({
      name: '',
      email: '',
      password: '',
      role: defaultRole,
      ministry: defaultMinistry,
      agency: defaultAgency,
      designation: defaults.designation,
      department: defaults.department,
      employeeId: defaults.employeeId,
      phone: '',
    });
    setShowModal(true);
  };

  const canToggleStatus = (targetUser) => {
    if (isSuperAdmin) return true;
    if (isMinistry && ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(targetUser.role)) return true;
    if (isAgency && ['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(targetUser.role)) return true;
    return false;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, minRes, agRes] = await Promise.allSettled([
        userApi.getUsers(),
        ministryApi.getMinistries(),
        agencyApi.getAgencies()
      ]);

      if (usersRes.status === 'fulfilled') {
        const u = usersRes.value;
        const userList = Array.isArray(u) ? u : (u?.data?.users || u?.users || u?.data || []);
        setUsers(Array.isArray(userList) ? userList : []);
      } else {
        throw new Error('Failed to load users list');
      }

      if (minRes.status === 'fulfilled') {
        const m = minRes.value;
        const minList = Array.isArray(m) ? m : (m?.data || m?.ministries || []);
        setMinistries(Array.isArray(minList) ? minList : []);
      }

      if (agRes.status === 'fulfilled') {
        const a = agRes.value;
        const agList = Array.isArray(a) ? a : (a?.data || a?.agencies || []);
        setAgencies(Array.isArray(agList) ? agList : []);
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
      setError('Unable to load users from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (user) => {
    const userId = user._id || user.id;
    const nextStatus = user.isActive === false ? true : false;
    try {
      await userApi.updateUserStatus(userId, nextStatus);
      setUsers(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, isActive: nextStatus } : u));
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.password?.trim() ||
      !formData.role ||
      !formData.phone?.trim()
    ) {
      alert('All fields are required. Please provide Official Name, Email, Password, Role, and Contact Phone.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role,
        designation: formData.designation,
        employeeId: formData.employeeId,
        department: formData.department,
        phone: formData.phone.trim(),
        ministry: formData.ministry || undefined,
        agency: formData.agency || undefined,
      };

      await userApi.createUser(payload);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'REPORTING_OFFICER',
        ministry: '',
        agency: '',
        designation: '',
        employeeId: '',
        department: '',
        phone: '',
      });
      fetchData();
    } catch (err) {
      alert('Failed to create user: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && u.isActive !== false) || 
      (statusFilter === 'INACTIVE' && u.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'SUPER_ADMIN' || r === 'IPMD_ADMIN') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"><Shield size={12} /> {r.replace('_', ' ')}</span>;
    }
    if (r === 'MINISTRY_OFFICER') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200"><Building size={12} /> Ministry Officer</span>;
    }
    if (r === 'IMPLEMENTATION_AGENCY') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Building2 size={12} /> Agency Officer</span>;
    }
    if (r === 'NODAL_OFFICER') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><UserCheck size={12} /> Nodal Officer</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Reporting Officer</span>;
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
          activeKey="/users"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                  <Users size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    User & Role Governance
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Manage government officers, administrative privileges, ministry affiliations, and system access rights.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              {canCreateUsers && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition"
                >
                  <UserPlus size={16} />
                  Add Official
                </button>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="dashboard-card flex flex-col md:flex-row gap-4 items-center justify-between p-5">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full md:w-[380px] focus-within:border-sky-500 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by officer name, email, designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="IPMD_ADMIN">IPMD Admin</option>
                  <option value="MINISTRY_OFFICER">Ministry Officer</option>
                  <option value="IMPLEMENTATION_AGENCY">Implementation Agency</option>
                  <option value="NODAL_OFFICER">Nodal Officer</option>
                  <option value="REPORTING_OFFICER">Reporting Officer</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Deactivated Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="dashboard-card p-0 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-semibold">Loading user directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <Users size={44} className="text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Users Found</h4>
                <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                      <th className="py-4 px-5">Official Name & Email</th>
                      <th className="py-4 px-5">Role & Scope</th>
                      <th className="py-4 px-5">Designation</th>
                      <th className="py-4 px-5">Affiliated Body</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const userId = u._id || u.id;
                      const isActive = u.isActive !== false;
                      const ministryName = u.ministry?.name || u.ministryId?.name || (typeof u.ministry === 'string' ? u.ministry : null);
                      const agencyName = u.agency?.name || u.agencyId?.name || (typeof u.agency === 'string' ? u.agency : null);

                      return (
                        <tr key={userId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                                {(u.name || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{u.name}</h4>
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Mail size={11} /> {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            {getRoleBadge(u.role)}
                          </td>

                          <td className="py-4 px-5 text-slate-700 font-semibold">
                            {u.designation || 'Government Officer'}
                          </td>

                          <td className="py-4 px-5 text-xs text-slate-700">
                            {ministryName && (
                              <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 font-semibold">
                                <Building size={11} /> {ministryName}
                              </span>
                            )}
                            {agencyName && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold mt-1 block">
                                <Building2 size={11} /> {agencyName}
                              </span>
                            )}
                            {!ministryName && !agencyName && (
                              <span className="text-slate-400">Central / IPMD</span>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <XCircle size={12} /> Deactivated
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 text-right">
                            {canToggleStatus(u) ? (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                                  isActive 
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">Managed by Parent Org</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <UserPlus size={20} />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Create Official Account</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. officer@morth.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const defaults = getRoleDefaults(newRole, formData.agency);
                      setFormData({
                        ...formData,
                        role: newRole,
                        designation: defaults.designation,
                        department: defaults.department,
                        employeeId: defaults.employeeId
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none font-semibold cursor-pointer"
                  >
                    {isMinistry && (
                      <option value="IMPLEMENTATION_AGENCY">Implementation Agency Officer</option>
                    )}
                    {isAgency && (
                      <>
                        <option value="NODAL_OFFICER">Nodal Officer (Clearances &amp; AI Alerts)</option>
                        <option value="REPORTING_OFFICER">Reporting Officer (Ground Inputs Only)</option>
                      </>
                    )}
                    {isSuperAdmin && (
                      <>
                        <option value="REPORTING_OFFICER">Reporting Officer (Ground Inputs)</option>
                        <option value="NODAL_OFFICER">Nodal Officer (Clearances)</option>
                        <option value="IMPLEMENTATION_AGENCY">Implementation Agency Officer</option>
                        <option value="MINISTRY_OFFICER">Ministry Officer</option>
                        <option value="IPMD_ADMIN">IPMD Administrator</option>
                        <option value="SUPER_ADMIN">Super Administrator</option>
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
                    value={formData.designation}
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
                    value={formData.employeeId || ''}
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
                    value={formData.department || ''}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign Ministry { (isMinistry || isAgency) && <span className="text-[10px] text-slate-400 font-normal">(Locked to Affiliated Ministry)</span> }
                  </label>
                  <select
                    value={formData.ministry}
                    disabled={isMinistry || isAgency}
                    onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none cursor-pointer disabled:opacity-75 disabled:bg-slate-100"
                  >
                    <option value="">-- None / Central --</option>
                    {ministries.map(m => (
                      <option key={m._id || m.id} value={m._id || m.id}>{m.name} ({m.code || 'MIN'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign Agency { isAgency && <span className="text-[10px] text-slate-400 font-normal">(Locked to Your Agency)</span> }
                  </label>
                  <select
                    value={formData.agency}
                    disabled={isAgency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none cursor-pointer disabled:opacity-75 disabled:bg-slate-100"
                  >
                    <option value="">-- None / Direct --</option>
                    {agencies.map(a => (
                      <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({a.code || 'AGY'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  {submitting ? (
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
    </div>
  );
}
