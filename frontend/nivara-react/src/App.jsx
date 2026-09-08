import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddProject from './pages/AddProject';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/add-project" element={<AddProject />} />
        <Route path="/add-project.html" element={<Navigate to="/add-project" replace />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports.html" element={<Navigate to="/reports" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

