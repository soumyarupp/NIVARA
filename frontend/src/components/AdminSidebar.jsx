import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FolderKanban, Cpu, FileText, AlertTriangle, 
  CheckSquare, Users, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Layers, ShieldCheck
} from 'lucide-react';

const AdminSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('nivara_auth');
    navigate('/');
    window.location.reload();
  };

  const navGroups = [
    {
      title: 'Main Workspaces',
      items: [
        { label: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'Live' },
        { label: 'Projects Registry', path: '/projects', icon: FolderKanban, badge: '186' },
        { label: 'Risk Intelligence', path: '/risk-intelligence', icon: Cpu, badge: '6 AI' },
        { label: 'Prediction Reports', path: '/reports', icon: FileText }
      ]
    },
    {
      title: 'Operational Tracking',
      items: [
        { label: 'Early Warnings', path: '/dashboard#risk-overview', icon: AlertTriangle, badge: '18 Risk', badgeColor: 'bg-red-500 text-white' },
        { label: 'Clearance Tracker', path: '/dashboard#clearances', icon: CheckSquare },
        { label: 'Sector Analysis', path: '/dashboard#sector-analysis', icon: Layers }
      ]
    },
    {
      title: 'System & Admin',
      items: [
        { label: 'Add / Update Project', path: '/add-project', icon: TrendingUp },
        { label: 'Settings & Access', path: '/settings', icon: Settings },
        { label: 'Helpdesk & Support', path: '/help', icon: HelpCircle }
      ]
    }
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <Link to="/dashboard" className="sidebar-brand-link">
          <div className="sidebar-logo-wrapper">
            <img src="NIVARA logo.png" alt="NIVARA Logo" className="sidebar-logo-img" />
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
          onClick={onToggleCollapse}
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
                const isActive = currentPath === item.path;
                return (
                  <li key={itemIdx}>
                    <Link 
                      to={item.path} 
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : undefined}
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
            <span className="sidebar-user-name">MoSPI Officer</span>
            <span className="sidebar-user-role">Central Sector Admin</span>
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
  );
};

export default AdminSidebar;
