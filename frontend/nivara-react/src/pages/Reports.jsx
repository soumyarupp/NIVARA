import React, { useState } from 'react';
import './Reports.css';
import { Link } from 'react-router-dom';
import ReportsView from '../components/ReportsView';

const Reports = () => {
  const [fontScale, setFontScale] = useState(1);

  const handleFontIncrease = () => {
    const newScale = Math.min(1.3, fontScale + 0.1);
    setFontScale(newScale);
    document.documentElement.style.fontSize = `${newScale * 100}%`;
  };

  const handleFontDecrease = () => {
    const newScale = Math.max(0.85, fontScale - 0.1);
    setFontScale(newScale);
    document.documentElement.style.fontSize = `${newScale * 100}%`;
  };

  return (
    <>
      {/* ===== Header ===== */}
      <header className="site-header">
        <div className="header-left">
          <Link to="/" className="logo-badge" style={{ textDecoration: 'none' }}>
            <img src="NIVARA logo.png" alt="NIVARA Logo" className="logo-img" />
          </Link>
          <div className="header-titles">
            <p className="header-eyebrow">Government of India</p>
            <p className="header-title">National Infrastructure Vigilance and Risk Analytics</p>
          </div>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/reports" className="nav-link active">Reports</Link>
          <Link to="/" className="nav-link">Dashboard</Link>
        </nav>

        <div className="header-right">
          <Link to="/login" className="btn btn-add" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Add Project / Update
          </Link>
          <Link to="/reports" className="btn btn-reports" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Reports
          </Link>
          <div className="font-controls">
            <button className="font-btn" onClick={handleFontDecrease}>A-</button>
            <button className="font-btn" onClick={handleFontIncrease}>A+</button>
          </div>
        </div>
      </header>

      {/* ===== Main Standalone Content ===== */}
      <main className="standalone-reports-page">
        <div className="page-title-banner">
          <h1>AI Predictive Risk &amp; Delay Reports</h1>
          <p>
            Pre-trained machine learning forecasting engine for Central Sector Mega Projects.
            Evaluates historical spend trajectory, contractor milestone slippage, and statutory clearance delays to forecast overruns before they occur.
          </p>
        </div>

        <ReportsView />
      </main>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <p className="footer-copy">
          © Content Owned by Ministry of Statistics and Programme Implementation, Government of India.
          Developed by National Informatics Centre (NIC).
        </p>
        <div className="footer-links">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Helpdesk / Support</a>
          <Link to="/">Home</Link>
        </div>
      </footer>
    </>
  );
};

export default Reports;
