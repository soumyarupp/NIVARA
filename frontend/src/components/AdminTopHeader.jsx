import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, Search, Bell, User, LogOut, ChevronDown, 
  ExternalLink, Home, Shield, AlertTriangle
} from 'lucide-react';

const AdminTopHeader = ({ onToggleSidebar, activeKey = '/dashboard' }) => {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifications = [
    { title: 'Critical Cost Overrun Flagged', desc: 'Eastern Dedicated Freight Corridor II crossed 30% cost threshold', time: '10m ago', type: 'critical' },
    { title: 'Statutory Clearance Delayed', desc: 'Ken-Betwa Link Project environmental clearance cycle pending', time: '2h ago', type: 'warning' },
    { title: 'AI Model Re-indexed', desc: 'Forecast accuracy calibrated to 99.4% across 186 Central Sector projects', time: '5h ago', type: 'info' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('nivara_auth');
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="admin-top-header">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="admin-header-left">
        <button 
          type="button" 
          className="admin-menu-toggle-btn"
          onClick={onToggleSidebar}
          title="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>

        <nav className="admin-breadcrumb">
          <Link to="/dashboard" className="breadcrumb-link"><Home size={14} /> Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">
            {activeKey === '/dashboard' ? 'National Operational Dashboard' : activeKey.replace('/', '')}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="admin-header-center">
        <div className="admin-global-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search Central Sector projects, ministries, or risk signals (Ctrl+K)..." 
            className="admin-search-input"
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </div>
      </div>

      {/* Right: Notification Control & Profile Dropdown */}
      <div className="admin-header-right">

        {/* Notifications Dropdown */}
        <div className="admin-dropdown-container">
          <button 
            type="button" 
            className="admin-header-btn notif-btn" 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
            title="System Alerts & Notifications"
          >
            <Bell size={18} />
            <span className="admin-notif-pulse"></span>
          </button>

          {isNotifOpen && (
            <div className="admin-dropdown-menu notif-dropdown">
              <div className="dropdown-header">
                <h3>System Notifications</h3>
                <span className="notif-badge">3 New</span>
              </div>
              <div className="dropdown-list">
                {notifications.map((n, i) => (
                  <div key={i} className={`dropdown-item notif-item ${n.type}`}>
                    <div className="notif-item-header">
                      <strong className="notif-item-title">{n.title}</strong>
                      <span className="notif-item-time">{n.time}</span>
                    </div>
                    <p className="notif-item-desc">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <Link to="/reports" onClick={() => setIsNotifOpen(false)}>View All Early Warning Reports &rarr;</Link>
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
              <span className="profile-btn-name">MoSPI Officer</span>
              <span className="profile-btn-role">Admin</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {isProfileOpen && (
            <div className="admin-dropdown-menu profile-dropdown">
              <div className="profile-dropdown-user">
                <strong>Officer Admin</strong>
                <span>MoSPI Ministerial Helpdesk</span>
                <span className="user-status-pill">● Session Active</span>
              </div>
              <ul className="profile-dropdown-links">
                <li>
                  <Link to="/projects" onClick={() => setIsProfileOpen(false)}>
                    <User size={15} /> My Monitored Projects
                  </Link>
                </li>
                <li>
                  <Link to="/reports" onClick={() => setIsProfileOpen(false)}>
                    <AlertTriangle size={15} /> Early Warning Audit Reports
                  </Link>
                </li>
              </ul>
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
