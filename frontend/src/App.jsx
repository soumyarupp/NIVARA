import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Core Public Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// Core Protected Workspaces
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('./pages/ProjectDetailsPage'));
const AddProject = lazy(() => import('./pages/AddProject'));
const SubmitReportPage = lazy(() => import('./pages/SubmitReportPage'));

// AI & Analytics
const WhatIfSimulatorPage = lazy(() => import('./pages/WhatIfSimulatorPage'));
const PreApprovalPage = lazy(() => import('./pages/PreApprovalPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));

// Alerts, Notifications & Audits
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Reports = lazy(() => import('./pages/Reports'));

// Administrative Directories
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const MinistryManagementPage = lazy(() => import('./pages/MinistryManagementPage'));
const AgencyManagementPage = lazy(() => import('./pages/AgencyManagementPage'));

const RouteLoadingSpinner = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0d14',
    color: '#38bdf8',
    gap: '16px',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{
      width: '42px',
      height: '42px',
      border: '3px solid rgba(56, 189, 248, 0.2)',
      borderTopColor: '#38bdf8',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', color: '#94a3b8' }}>
      INITIALIZING NIVARA INTELLIGENCE SUITE...
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<RouteLoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/login.html" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Authenticated Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />

            <Route path="/projects" element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/projects.html" element={<Navigate to="/projects" replace />} />

            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectDetailsPage />
              </ProtectedRoute>
            } />

            <Route path="/submit-report" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN', 'REPORTING_OFFICER']}>
                  <SubmitReportPage />
                </RoleRoute>
              </ProtectedRoute>
            } />

            <Route path="/add-project" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN']}>
                  <AddProject />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/add-project.html" element={<Navigate to="/add-project" replace />} />

            {/* AI Intelligence & Simulation */}
            <Route path="/risk-intelligence" element={<Navigate to="/alerts" replace />} />
            <Route path="/risk-intelligence.html" element={<Navigate to="/alerts" replace />} />

            <Route path="/what-if-simulator" element={
              <ProtectedRoute>
                <WhatIfSimulatorPage />
              </ProtectedRoute>
            } />

            <Route path="/pre-approval-risk" element={
              <ProtectedRoute>
                <PreApprovalPage />
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />

            <Route path="/chatbot" element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            } />

            {/* Alerts & Notifications */}
            <Route path="/alerts" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'NODAL_OFFICER']}>
                  <AlertsPage />
                </RoleRoute>
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/reports.html" element={<Navigate to="/reports" replace />} />

            {/* Admin Directories */}
            <Route path="/ministries" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN']}>
                  <MinistryManagementPage />
                </RoleRoute>
              </ProtectedRoute>
            } />

            <Route path="/agencies" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN']}>
                  <AgencyManagementPage />
                </RoleRoute>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN']}>
                  <UserManagementPage />
                </RoleRoute>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
