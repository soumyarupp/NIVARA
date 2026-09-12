import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  Clock, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
  ShieldAlert,
  Send,
  Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { notificationApi } from '../api/notificationApi';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationApi.getNotifications();
      const list = Array.isArray(res)
        ? res
        : (res?.notifications || res?.data?.notifications || res?.data || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleOpenNotification = (notif) => {
    setSelectedNotification(notif);
    const notifId = notif._id || notif.id;
    if (notifId && !notif.isRead) {
      handleMarkAsRead(notifId);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filteredList = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('ALERT') || t.includes('CRITICAL') || t.includes('RISK')) {
      return <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0"><AlertTriangle size={20} /></div>;
    }
    if (t.includes('DELAY') || t.includes('WARNING') || t.includes('MISMATCH')) {
      return <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0"><Clock size={20} /></div>;
    }
    if (t.includes('REPORT') || t.includes('SUCCESS')) {
      return <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0"><CheckCircle2 size={20} /></div>;
    }
    if (t.includes('ACTION')) {
      return <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0"><ShieldAlert size={20} /></div>;
    }
    return <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0"><Info size={20} /></div>;
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
          activeKey="/notifications"
        />

        <main className="admin-scrollable-content text-slate-800">
          {/* Header Banner */}
          <div className="dashboard-banner flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                  <Bell size={24} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Notifications &amp; Broadcasts
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Official directives, telemetry return receipts, milestone timelines, and supervisory actions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  <CheckCheck size={16} />
                  Mark All Read ({unreadCount})
                </button>
              )}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Broadcasts ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('READ')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'READ'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Archived ({notifications.length - unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-semibold">Loading system notification feed...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-20 text-center dashboard-card">
                <Bell size={44} className="text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Notifications in View</h4>
                <p className="text-slate-500 text-xs mt-1">You are all caught up with your dispatches and alerts.</p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const notifId = notif._id || notif.id;
                const pId = typeof notif.projectId === 'object' && notif.projectId !== null
                  ? (notif.projectId.projectCode || notif.projectId._id || notif.projectId.id)
                  : notif.projectId;
                const link = notif.link || (pId ? `/projects/${pId}` : null);

                return (
                  <div
                    key={notifId}
                    className={`p-5 md:p-6 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                      notif.isRead
                        ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        : 'bg-sky-50/50 border-sky-200 shadow-sm ring-1 ring-sky-500/10 hover:border-sky-300'
                    }`}
                  >
                    <div 
                      className="flex items-start gap-4 flex-1 cursor-pointer"
                      onClick={() => handleOpenNotification(notif)}
                    >
                      {getTypeIcon(notif.type)}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 hover:text-sky-600 transition">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                          )}
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            notif.type === 'ACTION_TAKEN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : notif.type === 'REPORT_DUE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : notif.type === 'REPORT_SUBMITTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {(notif.type || 'NOTIFICATION').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl line-clamp-2">
                          {notif.message || notif.body}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} />
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Recent'}
                          </span>
                          {notif.severity && (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              notif.severity === 'HIGH' || notif.severity === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : notif.severity === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {notif.severity} Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenNotification(notif)}
                        className="px-3.5 py-2 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="View Full Message"
                      >
                        <Eye size={14} />
                        <span>View Message</span>
                      </button>

                      {link && (
                        <Link
                          to={link}
                          className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition shadow-2xs flex items-center gap-1"
                        >
                          <span>View Project</span>
                          <ExternalLink size={13} />
                        </Link>
                      )}

                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notifId)}
                          className="p-2 text-slate-500 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs cursor-pointer"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* ================= VIEW NOTIFICATION MESSAGE MODAL ================= */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-600 text-white">
                  {selectedNotification.type === 'ACTION_TAKEN' ? <ShieldAlert size={20} /> : <Bell size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30">
                      {(selectedNotification.type || 'NOTIFICATION').replace(/_/g, ' ')}
                    </span>
                    {selectedNotification.severity && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedNotification.severity === 'HIGH' || selectedNotification.severity === 'CRITICAL'
                          ? 'bg-rose-500/30 text-rose-200'
                          : 'bg-emerald-500/30 text-emerald-200'
                      }`}>
                        {selectedNotification.severity}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Notification Details
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Subject / Directive
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {selectedNotification.title}
                </h4>
              </div>

              {/* Project Reference if available */}
              {selectedNotification.projectId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Associated Project</span>
                    <strong className="text-xs text-slate-900 block">
                      {typeof selectedNotification.projectId === 'object'
                        ? selectedNotification.projectId.projectName
                        : `Project Code: ${selectedNotification.projectId}`}
                    </strong>
                  </div>
                </div>
              )}

              {/* Message Details Box */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Directive Orders &amp; Full Message
                </span>
                <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl text-slate-700 text-xs leading-relaxed font-medium whitespace-pre-line">
                  {selectedNotification.message || selectedNotification.body || 'No detailed message provided.'}
                </div>
              </div>

              {/* Timestamp & Metadata */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Logged At: {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCheck size={14} /> Status: Verified Dispatched
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedNotification.type === 'REPORT_DUE' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotification(null);
                      navigate('/submit-report');
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>Submit Telemetry Return &rarr;</span>
                  </button>
                )}

                {selectedNotification.projectId && (
                  <button
                    type="button"
                    onClick={() => {
                      const pId = typeof selectedNotification.projectId === 'object'
                        ? (selectedNotification.projectId.projectCode || selectedNotification.projectId._id)
                        : selectedNotification.projectId;
                      setSelectedNotification(null);
                      navigate(`/projects/${pId}`);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>Open Project Dossier &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
