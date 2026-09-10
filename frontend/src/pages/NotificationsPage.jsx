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
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import { notificationApi } from '../api/notificationApi';

export default function NotificationsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : (data.notifications || []));
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
                    Notifications & Broadcasts
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    System notifications, milestone approvals, NLP classification summaries, and inter-departmental escalation dispatches.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition"
                >
                  <CheckCheck size={16} />
                  Mark All Read ({unreadCount})
                </button>
              )}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="dashboard-card p-4 flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Broadcasts ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === 'UNREAD'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('READ')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === 'READ'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-sky-50/50 border-sky-200 shadow-sm ring-1 ring-sky-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {getTypeIcon(notif.type)}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-bold text-slate-900">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
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
                          {notif.category && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200/60">
                              {notif.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {link && (
                        <Link
                          to={link}
                          className="px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition shadow-xs"
                        >
                          View Project &rarr;
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notifId)}
                          className="p-2 text-slate-500 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs"
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
    </div>
  );
}
