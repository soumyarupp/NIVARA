import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Cpu, 
  FileText, 
  AlertTriangle, 
  CheckSquare, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  PlusCircle,
  FileCheck,
  Sliders,
  BarChart3,
  Bot,
  Building,
  Building2,
  Users,
  Bell,
  Send
} from 'lucide-react';
import authApi, { getStoredUser, formatRoleName } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = ({ isCollapsed: propCollapsed, onToggleCollapse: propToggleCollapse, activePage }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const toggleCollapse = propToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  const currentPath = location.pathname;
  const user = authUser || getStoredUser();
  const role = user?.role || 'SUPER_ADMIN';

  const handleLogout = async () => {
    if (logout) {
      await logout();
    } else {
      await authApi.logout();
    }
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 1024 && !isCollapsed) {
      toggleCollapse();
    }
  };

  const navGroups = useMemo(() => {
    const isSuperAdmin = ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role);
    const isMinistry = ['MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'SUPER_ADMIN', 'IPMD_ADMIN'].includes(role);
    const isAgency = ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'SUPER_ADMIN', 'IPMD_ADMIN'].includes(role);
    const isReporting = role === 'REPORTING_OFFICER';
    const isNodal = role === 'NODAL_OFFICER';

    // Tailored Sidebar for Reporting Officer
    if (isReporting) {
      return [
        {
          title: 'Field Reporting & Telemetry',
          items: [
            { label: 'My Field Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'Live' },
            { label: 'Submit Monthly Report', path: '/submit-report', icon: Send, badge: 'Entry' },
            { label: 'Past Reports History', path: '/reports', icon: FileText, badge: 'Audit' },
            { label: 'Assigned Projects', path: '/projects', icon: FolderKanban }
          ]
        },
        {
          title: 'AI Field Assistance',
          items: [
            { label: 'NIVARA Copilot AI', path: '/chatbot', icon: Bot, badge: 'GPT' },
            { label: 'Field Notifications', path: '/notifications', icon: Bell }
          ]
        }
      ];
    }

    // Tailored Sidebar for Nodal Officer
    if (isNodal) {
      return [
        {
          title: 'Nodal Command & Oversight',
          items: [
            { label: 'Nodal Command Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'Live' },
            { label: 'Early Warnings & Alerts', path: '/alerts', icon: AlertTriangle, badge: 'Signals', badgeColor: 'bg-red-500 text-white' },
            { label: 'Supervised Projects', path: '/projects', icon: FolderKanban },
            { label: 'Field Submissions Review', path: '/reports', icon: FileText }
          ]
        },
        {
          title: 'AI Intelligence & Directives',
          items: [
            { label: 'What-If Delay Simulator', path: '/what-if-simulator', icon: Sliders },
            { label: 'NIVARA Copilot AI', path: '/chatbot', icon: Bot, badge: 'GPT' },
            { label: 'System Notifications', path: '/notifications', icon: Bell }
          ]
        }
      ];
    }

    // Default Macro / Admin Suite
    return [
      {
        title: 'Core Dashboards',
        items: [
          { label: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'Live' },
          { label: 'Projects Registry', path: '/projects', icon: FolderKanban },
          ...(isSuperAdmin || isReporting ? [
            { label: 'Submit Monthly Report', path: '/submit-report', icon: Send, badge: 'Entry' }
          ] : []),
          ...(isSuperAdmin || isAgency ? [
            { label: 'Register New Project', path: '/add-project', icon: PlusCircle }
          ] : [])
        ]
      },
      {
        title: 'AI Intelligence & Simulation',
        items: [
          { label: 'What-If Delay Simulator', path: '/what-if-simulator', icon: Sliders },
          { label: 'Pre-Approval Feasibility', path: '/pre-approval-risk', icon: FileCheck },
          { label: 'Portfolio Analytics', path: '/analytics', icon: BarChart3 },
          { label: 'NIVARA Copilot AI', path: '/chatbot', icon: Bot, badge: 'GPT' }
        ]
      },
      {
        title: 'Alerts & Governance',
        items: [
          { label: 'Early Warnings & Alerts', path: '/alerts', icon: AlertTriangle, badge: 'Realtime', badgeColor: 'bg-red-500 text-white' },
          { label: 'System Notifications', path: '/notifications', icon: Bell },
          { label: 'Prediction Reports', path: '/reports', icon: FileText }
        ]
      },
      ...((isSuperAdmin || isMinistry || isAgency) ? [
        {
          title: isAgency ? 'Officer Administration' : 'Institutional Administration',
          items: [
            ...(isSuperAdmin ? [
              { label: 'Central Ministries', path: '/ministries', icon: Building }
            ] : []),
            ...(isAgency ? [
              { label: 'Agency Officers', path: '/agencies', icon: Users, badge: 'Staff' }
            ] : (isSuperAdmin || isMinistry) ? [
              { label: 'Executing Agencies', path: '/agencies', icon: Building2 }
            ] : []),
            ...(isSuperAdmin || isMinistry ? [
              { label: 'User Governance', path: '/users', icon: Users, badge: isSuperAdmin ? 'Admin' : 'Hierarchy' }
            ] : [])
          ]
        }
      ] : [])
    ];
  }, [role]);

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      <div 
        className={`mobile-sidebar-backdrop ${!isCollapsed ? 'active' : ''}`}
        onClick={toggleCollapse}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <Link to="/dashboard" className="sidebar-brand-link" onClick={handleNavClick}>
            <div className="sidebar-logo-wrapper">
              <img src="/NIVARA logo.png" alt="NIVARA Logo" className="sidebar-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <ShieldCheck className="text-indigo-400" size={24} />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-titles">
                <span className="sidebar-brand-name">NIVARA</span>
                <span className="sidebar-brand-sub">Predictive Governance</span>
              </div>
            )}
          </Link>
          <button 
            type="button" 
            className="sidebar-collapse-btn" 
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-nav-container">
          {navGroups.map((group, idx) => (
            <div key={idx} className="sidebar-nav-group">
              {!isCollapsed && <div className="sidebar-group-title">{group.title}</div>}
              <ul className="sidebar-nav-list">
                {group.items.map((item, itemIdx) => {
                  const IconComponent = item.icon;
                  const isActive = currentPath === item.path || (activePage && item.path.includes(activePage));
                  return (
                    <li key={itemIdx}>
                      <Link 
                        to={item.path} 
                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                        onClick={handleNavClick}
                      >
                        <IconComponent className="sidebar-nav-icon" size={18} />
                        {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
                        {!isCollapsed && item.badge && (
                          <span className={`sidebar-badge ${item.badgeColor || ''}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="sidebar-footer-profile">
          <div className="sidebar-user-avatar">
            <ShieldCheck size={20} className="text-cyan-400" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name truncate max-w-[120px]">{user?.name || user?.fullName || 'NIVARA Officer'}</span>
              <span className="sidebar-user-role">{formatRoleName(role)}</span>
            </div>
          )}
          {!isCollapsed && (
            <button 
              type="button" 
              className="sidebar-logout-icon-btn" 
              onClick={handleLogout} 
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
