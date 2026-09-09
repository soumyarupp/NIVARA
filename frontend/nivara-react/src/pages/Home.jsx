import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';
import dashboardApi from '../api/dashboardApi';

const Home = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    lastUpdated: "08 Sep 2026, 21:50 IST",
    summary: {
      totalMonitoredOutlay: "₹48.2 Lakh Crore",
      projectsAtRisk: "118 Projects"
    }
  });

  useEffect(() => {
    async function initData() {
      try {
        const data = await dashboardApi.getOverview();
        if (data && data.summary) {
          setOverview(data);
        }
      } catch (err) {
        console.error("Home overview fetch error:", err);
      }
    }
    initData();
  }, []);

  return (
    <div className="dashboard-page-wrapper">
      <HeaderNav activeKey="/" />

      <main className="page-container">
        {/* ===== HERO SECTION ===== */}
        <section className="hero">
          <div className="hero-left">
            <div className="status-badge-row">
              <div className="system-status-pill">
                <span className="status-pulse-dot"></span>
                ● SYSTEM STATUS: OPERATIONAL
              </div>
              <div className="timestamp-pill">
                Data last updated: {overview.lastUpdated}
              </div>
            </div>

            <h1 className="hero-title">NIVARA: National Infrastructure Vigilance and Risk Analytics</h1>

            <p className="hero-subtitle">
              Next-Generation Predictive Governance &amp; Infrastructure Intelligence Platform
              for Central Sector Mega Projects, backed by advanced ML forecasting.
            </p>

            <div className="hero-supporting-line">
              AI-powered monitoring, early warning and decision support for Central Sector infrastructure projects.
            </div>

            <div className="stat-cards">
              <div className="stat-card">
                <p className="stat-label">Total Monitored Outlay</p>
                <p className="stat-value">{overview.summary.totalMonitoredOutlay}</p>
              </div>
              <div
                className="stat-card stat-card--risk"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/login')}
              >
                <p className="stat-label">Projects at Risk</p>
                <p className="stat-value stat-value--risk">{overview.summary.projectsAtRisk}</p>
                <span style={{ fontSize: '11.5px', color: 'var(--color-red)', fontWeight: '700', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View Prediction Reports &rarr;
                </span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-visual-card">
              <div className="visual-card-top">
                <div className="visual-badge">
                  <span className="status-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                  LIVE NATIONAL TELEMETRY RADAR
                </div>
                <span className="visual-accuracy">99.4% Forecast Accuracy</span>
              </div>

              <svg viewBox="0 0 500 160" style={{ width: '100%', height: '140px' }} fill="none">
                <defs>
                  <linearGradient id="heroChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="heroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9"/>
                    <stop offset="50%" stopColor="#14b8a6"/>
                    <stop offset="100%" stopColor="#38bdf8"/>
                  </linearGradient>
                </defs>

                <line x1="20" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.1)"/>

                <path d="M 30 135 Q 100 115, 160 100 T 290 75 T 400 42 T 470 28 L 470 140 L 30 140 Z" fill="url(#heroChartGrad)"/>
                <path d="M 30 135 Q 100 115, 160 100 T 290 75 T 400 42 T 470 28" stroke="url(#heroLineGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

                <circle cx="30" cy="135" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="160" cy="100" r="4.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="290" cy="75" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="400" cy="42" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5"/>
                <circle cx="470" cy="28" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>

                <text x="35" y="125" fill="#94a3b8" fontSize="10">Baseline</text>
                <text x="265" y="62" fill="#94a3b8" fontSize="10">Telemetry Influx</text>
                <text x="375" y="28" fill="#38bdf8" fontSize="10" fontWeight="700">AI Forecast</text>
              </svg>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Central Sector</span>
                  <strong style={{ color: '#ffffff', fontSize: '13px' }}>186 Projects</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Risk Signals</span>
                  <strong style={{ color: '#f87171', fontSize: '13px' }}>118 Mitigated</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Model Latency</span>
                  <strong style={{ color: '#38bdf8', fontSize: '13px' }}>12ms</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRIVATE MODULES ACCESS CARDS ===== */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">NIVARA Platform Workspaces</h2>
            <p className="section-subtitle">
              Select a dedicated module below to inspect private analytics, project watchlists, AI engines, and risk reports.
            </p>
          </div>

          <div className="ai-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

            {/* Card 1: Projects */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="ai-feature-title">1. Projects Workspace</h3>
                <p className="ai-feature-desc">
                  Monitor high-priority Central Sector assets, state risk clusters, delay factors, and ministerial intervention watchlists.
                </p>
              </div>
              <Link to="/login" className="btn-feature-action" style={{ textDecoration: 'none' }}>
                <span>Access Projects</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Card 2: Dashboard */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/></svg>
                </div>
                <h3 className="ai-feature-title">2. Analytics Dashboard</h3>
                <p className="ai-feature-desc">
                  View aggregate portfolio cost evolution, sector-wise expenditure analysis, risk score distribution, and financial health breakdown.
                </p>
              </div>
              <Link to="/login" className="btn-feature-action" style={{ textDecoration: 'none' }}>
                <span>Access Dashboard</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Card 3: Risk Intelligence */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.5 7.5"/></svg>
                </div>
                <h3 className="ai-feature-title">3. Risk Intelligence</h3>
                <p className="ai-feature-desc">
                  Explore NIVARA's 6 AI Machine Learning engines: Early Warning Alerts, AI Chatbot, NLP Delay Classifier, Fund vs Physical Mismatch, Pre-Approval Simulator, and What-If Delay Impact.
                </p>
              </div>
              <Link to="/login" className="btn-feature-action" style={{ textDecoration: 'none' }}>
                <span>Explore Risk Intelligence</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Card 4: Reports */}
            <div className="ai-feature-card">
              <div className="ai-feature-top">
                <div className="ai-feature-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 1-2 2v16a2 2 0 0 1 2 2h12a2 2 0 0 1 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="ai-feature-title">4. Risk &amp; Delay Reports</h3>
                <p className="ai-feature-desc">
                  Access comprehensive machine learning early-warning risk reports, milestone forecasts, and contractor performance audits.
                </p>
              </div>
              <Link to="/login" className="btn-feature-action" style={{ textDecoration: 'none' }}>
                <span>View Reports</span>
                <span>&rarr;</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ===== ACCESS CTA BANNER ===== */}
        <section className="dashboard-section" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '36px', marginTop: '30px' }}>
          <div style={{ maxWidth: '640px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>Authorized Official Workspace Access</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              Detailed project telemetry, expenditure data, statutory clearance delays, and AI predictive simulations are confidential and restricted to authorized government officials.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-add" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: '700', borderRadius: '10px' }}>
                Sign In to Official Workspace &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
