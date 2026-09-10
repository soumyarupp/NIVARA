import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const HeaderNav = ({ activeKey }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fontScale, setFontScale] = useState(1);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPath = activeKey || location.pathname;

  // Check if user is authenticated or on an authenticated route
  const authStored = localStorage.getItem('nivara_auth') === 'true';
  const isAuthRoute = ['/projects', '/dashboard', '/risk-intelligence', '/reports', '/add-project'].includes(currentPath);
  const isAuthenticated = authStored || isAuthRoute;

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

  const handleLogout = () => {
    localStorage.removeItem('nivara_auth');
    navigate('/');
    window.location.reload();
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setIsContactOpen(false);
    }, 2000);
  };

  return (
    <>
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

        {/* Authenticated Workspace Links (Desktop) */}
        {isAuthenticated && (
          <nav className="header-nav header-nav-desktop">
            <Link to="/projects" className={`nav-link ${currentPath === '/projects' ? 'active' : ''}`}>Projects</Link>
            <Link to="/dashboard" className={`nav-link ${currentPath === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/risk-intelligence" className={`nav-link ${currentPath === '/risk-intelligence' ? 'active' : ''}`}>Risk Intelligence</Link>
            <Link to="/reports" className={`nav-link ${currentPath === '/reports' ? 'active' : ''}`}>Reports</Link>
          </nav>
        )}

        {/* Right Section: Desktop Navigation Links */}
        <div className="header-right header-right-desktop">
          <Link
            to="/"
            className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
          >
            Home
          </Link>

          <button
            type="button"
            className="nav-link"
            onClick={() => setIsContactOpen(true)}
          >
            Contact Us
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/add-project" className="btn btn-add" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                + Add Project / Update
              </Link>
              <button
                type="button"
                className="btn btn-reports"
                onClick={handleLogout}
                style={{ background: '#ef4444', borderColor: '#dc2626', color: '#ffffff', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-add" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Sign In to Workspace &rarr;
            </Link>
          )}

          <div className="font-controls">
            <button type="button" className="font-btn" onClick={handleFontDecrease} title="Decrease font size">A-</button>
            <button type="button" className="font-btn" onClick={handleFontIncrease} title="Increase font size">A+</button>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="header-mobile-toggle-wrapper">
          <button 
            type="button" 
            className="header-mobile-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <span style={{ fontSize: '22px', lineHeight: 1 }}>&times;</span>
            ) : (
              <span style={{ fontSize: '20px', lineHeight: 1 }}>&#9776;</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-header-drawer">
          <div className="mobile-drawer-links">
            <Link 
              to="/" 
              className={`mobile-drawer-item ${currentPath === '/' ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/projects" 
                  className={`mobile-drawer-item ${currentPath === '/projects' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Projects Registry
                </Link>
                <Link 
                  to="/dashboard" 
                  className={`mobile-drawer-item ${currentPath === '/dashboard' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Operational Dashboard
                </Link>
                <Link 
                  to="/risk-intelligence" 
                  className={`mobile-drawer-item ${currentPath === '/risk-intelligence' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Risk Intelligence (6 AI)
                </Link>
                <Link 
                  to="/reports" 
                  className={`mobile-drawer-item ${currentPath === '/reports' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Predictive Reports
                </Link>
                <Link 
                  to="/add-project" 
                  className={`mobile-drawer-item ${currentPath === '/add-project' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  + Add / Update Project
                </Link>
              </>
            ) : (
              <Link 
                to="/login" 
                className="mobile-drawer-item mobile-drawer-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In to Workspace &rarr;
              </Link>
            )}
            <button
              type="button"
              className="mobile-drawer-item text-left"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsContactOpen(true);
              }}
            >
              Contact Support
            </button>
            {isAuthenticated && (
              <button
                type="button"
                className="mobile-drawer-item text-red-400 font-bold"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== Contact Us Modal ===== */}
      {isContactOpen && (
        <div
          className="reports-modal-backdrop active"
          onClick={(e) => { if (e.target.classList.contains('reports-modal-backdrop')) setIsContactOpen(false); }}
        >
          <div className="reports-modal-card" style={{ maxWidth: '560px', padding: '28px' }}>
            <div className="reports-modal-header" style={{ marginBottom: '20px' }}>
              <div className="modal-header-left">
                <div className="modal-header-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="modal-header-titles">
                  <h2>Contact NIVARA Ministerial Support</h2>
                  <p>Ministry of Statistics &amp; Programme Implementation (MoSPI)</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsContactOpen(false)} title="Close">&times;</button>
            </div>

            {contactSubmitted ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#166534' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>Message Received Successfully</h3>
                <p style={{ fontSize: '13.5px', color: '#15803d' }}>
                  Your inquiry has been logged in the NIVARA Ministerial Helpdesk system. A representative will get back to your official email shortly.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: '600' }}>Official Helpdesk Email</span>
                    <strong style={{ color: '#0284c7' }}>support@nivara.gov.in</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: '600' }}>Toll-Free Helpline</span>
                    <strong style={{ color: '#0f172a' }}>1800-11-2026</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: '600' }}>Nodal Technical Agency</span>
                    <strong style={{ color: '#334155' }}>National Informatics Centre (NIC), CGO Complex, Lodhi Road, New Delhi</strong>
                  </div>
                </div>

                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                      <input type="text" placeholder="Officer Name" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Official Work Email *</label>
                      <input type="email" placeholder="officer@agency.gov.in" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Ministry / Agency *</label>
                    <input type="text" placeholder="e.g. Ministry of Road Transport & Highways" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Message / Inquiry *</label>
                    <textarea rows="3" placeholder="Specify your inquiry or technical access request..." required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}></textarea>
                  </div>
                  <button type="submit" className="btn btn-add" style={{ marginTop: '6px', width: '100%', justifyContent: 'center' }}>
                    Submit Support Request &rarr;
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderNav;
