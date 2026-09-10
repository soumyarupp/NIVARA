import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import projectApi from '../api/projectApi';
import ProjectDashboard from '../components/ProjectDashboard';
import ReportsView from '../components/ReportsView';

const DashboardPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const projRes = await projectApi.getProjects();
        if (projRes && projRes.projects) {
          setProjects(projRes.projects);
        }
      } catch (err) {
        console.error("DashboardPage fetch error:", err);
      }
    }
    loadData();
  }, []);

  const handleInspectProject = (proj) => {
    setSelectedProject(proj);
    setActiveModal('reports');
  };

  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Persistent Left Sidebar */}
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main App Container */}
      <div className="admin-main-container">
        {/* Sticky Top Header */}
        <AdminTopHeader 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeKey="/dashboard"
        />

        {/* Scrollable Dashboard View */}
        <main className="admin-scrollable-content">
          <ProjectDashboard 
            projects={projects} 
            onInspect={handleInspectProject} 
          />
        </main>

        {/* Admin Footer */}
        <Footer />
      </div>

      {/* Reports / Inspection Modal */}
      {activeModal === 'reports' && (
        <div className="reports-modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('reports-modal-backdrop')) setActiveModal(null); }}>
          <div className="reports-modal-card">
            <div className="reports-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div className="modal-header-titles">
                  <h2>NIVARA AI Risk Inspection: {selectedProject ? selectedProject.name : 'Central Sector Overview'}</h2>
                  <p>Machine learning early-warning risk audit &amp; milestone forecasts</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)} title="Close Reports">&times;</button>
            </div>
            <ReportsView isModal={true} onClose={() => setActiveModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
