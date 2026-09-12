import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, Search, Bell, User, LogOut, ChevronDown, 
  Home, Shield, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import authApi, { getStoredUser, formatRoleName } from '../api/authApi';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

const AdminTopHeader = ({ onToggleSidebar, activeKey = '/dashboard' }) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = authUser || getStoredUser();
  const role = user?.role || 'SUPER_ADMIN';

  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await notificationApi.getNotifications();
        const list = Array.isArray(res)
          ? res
          : (res?.notifications || res?.data?.notifications || res?.data || []);
        setNotifications(list.slice(0, 5));
        setUnreadCount(list.filter(n => !n.isRead).length);
      } catch (err) {
        // Fallback default notifications if offline
        setNotifications([
          { title: 'Critical Cost Overrun Flagged', message: 'Eastern Dedicated Freight Corridor II crossed 30% cost threshold', time: '10m ago', type: 'critical' },
          { title: 'Statutory Clearance Delayed', message: 'Ken-Betwa Link Project environmental clearance cycle pending', time: '2h ago', type: 'warning' },
          { title: 'AI Model Calibrated', message: 'Forecast accuracy calibrated to 99.4% across 186 Central Sector projects', time: '5h ago', type: 'info' }
        ]);
        setUnreadCount(2);
      }
    }
    loadNotifs();
  }, []);

  const handleNotifClick = async (n) => {
    setIsNotifOpen(false);
    const notifId = n._id || n.id;
    if (notifId && !n.isRead) {
      try {
        await notificationApi.markAsRead(notifId);
        setNotifications(prev => prev.map(item => (item._id === notifId || item.id === notifId) ? { ...item, isRead: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (_) {}
    }
    const pId = typeof n.projectId === 'object' && n.projectId !== null
      ? (n.projectId.projectCode || n.projectId._id || n.projectId.id)
      : n.projectId;

    if (n.type === 'REPORT_DUE') {
      navigate('/submit-report');
    } else if (pId) {
      navigate(`/projects/${pId}`);
    } else {
      navigate('/notifications');
    }
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      await authApi.logout();
    }
    navigate('/login');
  };

  return (
    <header className="admin-top-header">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="admin-header-left">
        {onToggleSidebar && (
          <button 
            type="button" 
            className="admin-menu-toggle-btn"
            onClick={onToggleSidebar}
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <nav className="admin-breadcrumb">
          <Link to="/dashboard" className="breadcrumb-link"><Home size={14} /> Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current capitalize">
            {activeKey === '/dashboard' ? 'National Overview' : activeKey.replace('/', '').replace(/-/g, ' ')}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="admin-header-center">
        <div className="admin-global-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects, ministries, risk signals..." 
            className="admin-search-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/projects?search=${encodeURIComponent(e.target.value)}`);
              }
            }}
          />
          <kbd className="search-shortcut">↵</kbd>
        </div>
      </div>

      {/* Right: Notification Control & Profile Dropdown */}
      <div className="admin-header-right">

        {/* Notifications Dropdown */}
        <div className="admin-dropdown-container">
          <button 
            type="button" 
            className="admin-header-btn notif-btn cursor-pointer" 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
            title="System Alerts & Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="admin-notif-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="admin-dropdown-menu notif-dropdown shadow-xl border border-slate-200">
              <div className="dropdown-header">
                <h3>System Notifications</h3>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount} New</span>}
              </div>
              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n, i) => (
                    <div 
                      key={n._id || n.id || i} 
                      onClick={() => handleNotifClick(n)}
                      className={`dropdown-item notif-item ${n.type || 'info'} cursor-pointer hover:bg-slate-50 transition p-3 rounded-xl`}
                    >
                      <div className="notif-item-header flex items-center justify-between">
                        <strong className="notif-item-title text-xs font-bold text-slate-900">{n.title}</strong>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>}
                      </div>
                      <p className="notif-item-desc text-[11px] text-slate-600 line-clamp-2 mt-1">{n.message || n.desc}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-sky-600 hover:text-sky-700">
                  View All Notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="admin-dropdown-container">
          <button 
            type="button" 
            className="admin-profile-menu-btn"
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
          >
            <div className="profile-avatar-box">
              <Shield size={16} className="text-sky-400" />
            </div>
            <div className="profile-btn-titles hidden md:flex">
              <span className="profile-btn-name">{user?.name || user?.fullName || 'NIVARA Officer'}</span>
              <span className="profile-btn-role">{formatRoleName(role)}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {isProfileOpen && (
            <div className="admin-dropdown-menu profile-dropdown">
              <div className="profile-dropdown-user">
                <strong>{user?.name || user?.fullName || 'NIVARA Officer'}</strong>
                <span>{user?.designation || user?.email || formatRoleName(role)}</span>
                <span className="user-status-pill">● Session Active</span>
              </div>
              {role !== 'REPORTING_OFFICER' && (
                <ul className="profile-dropdown-links">
                  <li>
                    <Link to="/projects" onClick={() => setIsProfileOpen(false)}>
                      <User size={15} /> Monitored Projects
                    </Link>
                  </li>
                  <li>
                    <Link to="/alerts" onClick={() => setIsProfileOpen(false)}>
                      <AlertTriangle size={15} /> Active Early Warnings
                    </Link>
                  </li>
                </ul>
              )}
              <div className="profile-dropdown-footer">
                <button type="button" className="logout-btn" onClick={handleLogout}>
                  <LogOut size={15} /> Sign Out of Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopHeader;
