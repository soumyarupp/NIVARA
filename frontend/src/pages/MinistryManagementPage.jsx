import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  Building, 
  Plus, 
  Search, 
  Mail, 
  RefreshCw, 
  X,
  ShieldCheck
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { ministryApi } from '../api/ministryApi';
import { useAuth } from '../context/AuthContext';

export default function MinistryManagementPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user: currentUser, role } = useAuth();
  const isSuperAdmin = ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role || currentUser?.role);

  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    nodalOfficerName: '',
  });

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ministryApi.getMinistries();
      const list = Array.isArray(data) ? data : (data?.data || data?.ministries || []);
      setMinistries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load ministries:', err);
      setError('Failed to fetch ministries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistries();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Only Super Admin / IPMD Admin is authorized to register new Ministries.');
      return;
    }

    if (!formData.name || !formData.code) {
      alert('Ministry Name and Code are required.');
      return;
    }

    try {
      setSubmitting(true);
      await ministryApi.createMinistry(formData);
      setShowModal(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        nodalOfficerName: '',
      });
      fetchMinistries();
    } catch (err) {
      alert('Failed to register ministry: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = ministries.filter(m => 
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.nodalOfficerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <div className="admin-main-container">
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/ministries"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                  <Building size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Central Ministries Registry
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Central government ministries sponsoring mega-infrastructure and capital expenditure projects across India.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              {isSuperAdmin ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus size={16} />
                  Register Ministry
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs">
                  <ShieldCheck size={14} className="text-sky-600" />
                  Central Directory (Read Only)
                </span>
              )}
              <button
                onClick={fetchMinistries}
                disabled={loading}
                className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="dashboard-card flex items-center justify-between p-5">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full max-w-md focus-within:border-sky-500 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search ministry name or code (e.g. MoRTH, MoR)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none p-0 focus:ring-0"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              Showing {filtered.length} of {ministries.length} Ministries
            </span>
          </div>

          {/* Ministry Cards Grid */}
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-semibold">Fetching ministries registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center dashboard-card">
              <Building size={44} className="text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No Ministries Found</h4>
              <p className="text-slate-500 text-xs mt-1">Register a new ministry to begin tracking projects under it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map((m) => {
                const ministryId = m._id || m.id;
                return (
                  <div 
                    key={ministryId}
                    className="dashboard-card hover:border-sky-300 transition-all flex flex-col justify-between p-7 mb-0"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold font-mono bg-sky-50 text-sky-700 border border-sky-200">
                          {m.code || 'MIN'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">Registered Body</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                        {m.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-5">
                        {m.description || 'Central administrative ministry overseeing national infrastructure mandates and budget disbursements.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      {m.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400" />
                          <span className="truncate">{m.contactEmail}</span>
                        </div>
                      )}
                      {m.nodalOfficerName && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          <span>Nodal Officer: <strong className="text-slate-800">{m.nodalOfficerName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Building size={20} />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Register Sponsoring Ministry</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ministry Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Road Transport and Highways"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Code / Acronym *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MoRTH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Nodal Officer</label>
                <input
                  type="text"
                  placeholder="e.g. Shri Alok Kumar, Joint Secretary"
                  value={formData.nodalOfficerName}
                  onChange={(e) => setFormData({ ...formData, nodalOfficerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@morth.gov.in"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 011-23714000"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Mandate & scope of projects..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-sky-500 outline-none"
                />
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Registering...' : 'Register Ministry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
