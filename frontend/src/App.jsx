import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RiskIntelligencePage = lazy(() => import('./pages/RiskIntelligencePage'));
const Reports = lazy(() => import('./pages/Reports'));
const Login = lazy(() => import('./pages/Login'));
const AddProject = lazy(() => import('./pages/AddProject'));

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
      width: '40px',
      height: '40px',
      border: '3px solid rgba(56, 189, 248, 0.2)',
      borderTopColor: '#38bdf8',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', color: '#94a3b8' }}>
      LOADING NIVARA WORKSPACE...
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteLoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects.html" element={<Navigate to="/projects" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />

          <Route path="/risk-intelligence" element={<RiskIntelligencePage />} />
          <Route path="/risk-intelligence.html" element={<Navigate to="/risk-intelligence" replace />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/reports.html" element={<Navigate to="/reports" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />

          <Route path="/add-project" element={<AddProject />} />
          <Route path="/add-project.html" element={<Navigate to="/add-project" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

