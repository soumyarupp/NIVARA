import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import '../pages/Reports.css';
import { Link, useNavigate } from 'react-router-dom';
import NivaraAPI from '../api/api';
import ReportsView from '../components/ReportsView';

const ICONS = {
  radar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>
    </svg>
  ),
  simulator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  ),
  telemetry: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 15l3-4 3 2 4-6"/>
    </svg>
  ),
  gateway: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/>
    </svg>
  )
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalMonitoredOutlay: '₹ 48.2 Lakh Cr', activeRiskSignals: '118 Projects' });
  const [features, setFeatures] = useState([]);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [modalInitialProjectId, setModalInitialProjectId] = useState(null);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedStats = await NivaraAPI.getStats();
        if (fetchedStats) setStats(fetchedStats);

        const fetchedFeatures = await NivaraAPI.getFeatures();
        if (fetchedFeatures) setFeatures(fetchedFeatures);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    }
    fetchData();
  }, []);

  const openReportsModal = (projectId = null) => {
    setModalInitialProjectId(projectId);
    setIsReportsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeReportsModal = () => {
    setIsReportsModalOpen(false);
    setModalInitialProjectId(null);
    document.body.style.overflow = "";
  };

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
          <Link to="/" className="nav-link active">Home</Link>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert("Publications repository: Accessing Ministry Annual Infrastructure Reports (2025-26)"); }}>Publications</a>
          <Link to="/" className="nav-link">Dashboard</Link>
        </nav>

        <div className="header-right">
          <Link to="/login" className="btn btn-add" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Add Project / Update
          </Link>
          <button type="button" className="btn btn-reports" onClick={() => openReportsModal()}>
            Reports
          </button>
          <div className="font-controls">
            <button type="button" className="font-btn" onClick={handleFontDecrease}>A-</button>
            <button type="button" className="font-btn" onClick={handleFontIncrease}>A+</button>
          </div>
        </div>
      </header>

      {/* ===== Main Hero Section ===== */}
      <main>
        <section className="hero">
          <div className="hero-left">
            <span className="hero-pill">
              <svg className="pill-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
              </svg>
              National Infrastructure Intelligence Portal
            </span>

            <h1 className="hero-title">NIVARA: National Infrastructure Vigilance and Risk Analytics</h1>

            <p className="hero-subtitle">
              Next-Generation Predictive Governance &amp; Infrastructure Intelligence Platform
              for Central Sector Mega Projects, backed by advanced ML forecasting.
            </p>

            <div className="stat-cards">
              <div className="stat-card stat-card--outlay">
                <p className="stat-label">Total Monitored Outlay</p>
                <p className="stat-value">{stats.totalMonitoredOutlay}</p>
              </div>
              <div
                className="stat-card stat-card--risk"
                style={{ cursor: 'pointer' }}
                title="Click to view AI Prediction Reports"
                onClick={() => openReportsModal()}
              >
                <p className="stat-label">Active Risk Signals</p>
                <p className="stat-value stat-value--risk">{stats.activeRiskSignals}</p>
                <span style={{ fontSize: '11.5px', color: 'var(--color-red)', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View Prediction Reports &rarr;
                </span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{ICONS[feature.icon] || null}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
                {feature.icon === "radar" && (
                  <button
                    type="button"
                    className="btn-view-prediction"
                    style={{ marginTop: '10px', width: 'fit-content' }}
                    onClick={() => openReportsModal()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Generate Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <p className="footer-copy">
          © Content Owned by Ministry of Statistics and Programme Implementation, Government of India.
          Developed by National Informatics Centre (NIC).
        </p>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Standard Government of India Open Data License."); }}>Terms of Service</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: NIVARA Platform Data Privacy Protocol."); }}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Helpdesk / Support: Contact support@nivara.gov.in"); }}>Helpdesk / Support</a>
        </div>
      </footer>

      {/* ===== Reports Modal ===== */}
      {isReportsModalOpen && (
        <div className="reports-modal-backdrop active" onClick={(e) => { if (e.target.classList.contains('reports-modal-backdrop')) closeReportsModal(); }}>
          <div className="reports-modal-card">
            <div className="reports-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div className="modal-header-titles">
                  <h2>NIVARA AI Predictive Risk &amp; Delay Reports</h2>
                  <p>Machine learning early-warning engine for Central Sector Mega Projects</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeReportsModal} title="Close Reports">&times;</button>
            </div>
            <ReportsView isModal={true} onClose={closeReportsModal} initialProjectId={modalInitialProjectId} />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
