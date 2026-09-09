import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import DashboardPage from './pages/DashboardPage';
import RiskIntelligencePage from './pages/RiskIntelligencePage';
import Reports from './pages/Reports';
import Login from './pages/Login';
import AddProject from './pages/AddProject';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;

