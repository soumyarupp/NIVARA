import React, { useState } from 'react';
import './Dashboard.css';
import './Reports.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopHeader from '../components/AdminTopHeader';
import Footer from '../components/Footer';
import ReportsView from '../components/ReportsView';

const Reports = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          activeKey="/reports"
        />

        {/* Scrollable Main Content */}
        <main className="admin-scrollable-content px-6 py-6 sm:px-10 sm:py-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">AI Predictive Risk &amp; Delay Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Pre-trained machine learning forecasting engine for Central Sector Mega Projects.
              Evaluates historical spend trajectory, contractor milestone slippage, and statutory clearance delays to forecast overruns before they occur.
            </p>
          </div>

          <ReportsView />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Reports;
