import React, { useState, useEffect, useCallback } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const Login = () => {
  const navigate = useNavigate();
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaTilts, setCaptchaTilts] = useState([]);
  const [captchaInputVal, setCaptchaInputVal] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authAlert, setAuthAlert] = useState(null); // { message, isError }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaSpinning, setIsCaptchaSpinning] = useState(false);
  const [language, setLanguage] = useState('EN');

  const generateCaptcha = useCallback(() => {
    let code = "";
    const tilts = [];
    for (let i = 0; i < 6; i++) {
      code += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
      const randomTilt = (Math.random() * 14 - 7).toFixed(1);
      const randomY = (Math.random() * 4 - 2).toFixed(1);
      tilts.push({ tilt: randomTilt, y: randomY });
    }
    setCaptchaCode(code);
    setCaptchaTilts(tilts);
    setCaptchaInputVal('');
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleReloadCaptcha = () => {
    setIsCaptchaSpinning(true);
    generateCaptcha();
    setTimeout(() => {
      setIsCaptchaSpinning(false);
    }, 450);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setAuthAlert({ message: "Please enter your username or work email.", isError: true });
      return;
    }
    if (!password.trim()) {
      setAuthAlert({ message: "Please enter your password.", isError: true });
      return;
    }
    if (!captchaInputVal.trim()) {
      setAuthAlert({ message: "Please enter the 6-character verification code.", isError: true });
      return;
    }
    if (captchaInputVal.trim().toUpperCase() !== captchaCode) {
      setAuthAlert({ message: "Verification code does not match. Please try again.", isError: true });
      generateCaptcha();
      return;
    }

    // Success State -> Redirect to Add Project page
    setAuthAlert({ message: "Authentication successful! Redirecting to Project Management Workspace...", isError: false });
    setIsSubmitting(true);

    setTimeout(() => {
      navigate('/add-project');
    }, 1200);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setAuthAlert({ message: `Password reset instructions have been forwarded to: ${username.trim()}`, isError: false });
    } else {
      setAuthAlert({ message: "Please enter your official username or email above, then click Forgot Password.", isError: true });
    }
  };

  return (
    <div className="login-page-root">
      {/* ================= TOP NAVBAR ================= */}
      <header className="top-nav">
        <div className="nav-left">
          <Link to="/" className="brand-link" title="Return to NIVARA Home">
            <div className="brand-badge">
              <img src="NIVARA logo.png" alt="NIVARA Logo" className="brand-logo-img" />
            </div>
          </Link>
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="nav-util-btn"
            title="Language Selection"
            onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{language}</span>
          </button>

          <button
            type="button"
            className="nav-util-btn"
            title="System Notifications"
            onClick={() => setAuthAlert({ message: "System Notice: All AI Risk Forewarning engines operational (v3.4).", isError: false })}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notif-pulse"></span>
          </button>

          <button type="button" className="nav-util-btn" title="Accessibility Options" onClick={() => alert("Accessibility features active.")}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="4" r="2" />
              <path d="m19 13-4.5-1.5L13 7h-2l-1.5 4.5L5 13l1 2 4-1.5V20h4v-6.5l4 1.5z" />
            </svg>
          </button>

          <Link to="/" className="nav-dashboard-link">
            <span>Home</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ================= MAIN SPLIT CONTAINER ================= */}
      <main className="split-layout">

        {/* ===== LEFT HERO PANEL (~55%) ===== */}
        <section className="hero-panel">
          <div className="mesh-glow mesh-glow-1"></div>
          <div className="mesh-glow mesh-glow-2"></div>
          <div className="mesh-grid-pattern"></div>

          <div className="hero-inner">
            <div className="hero-chip">
              <span className="chip-dot"></span>
              <span>AI-Powered Infrastructure Intelligence</span>
            </div>

            <h1 className="hero-headline">
              Predictive Intelligence for <br />
              <span className="gradient-text">Smarter Infrastructure</span>
            </h1>

            <p className="hero-subheading">“From Data to Foresight.”</p>

            <p className="hero-description">
              NIVARA fuses multi-source telemetry, predictive machine learning, and project
              milestone intelligence to detect risks, prevent delays, and protect capital outlay.
            </p>

            {/* Dynamic AI Predictive Graph Illustration */}
            <div className="ai-visual-card">
              <div className="visual-card-header">
                <div className="visual-pill">
                  <span className="pulse-indicator"></span> Live Telemetry Model
                </div>
                <span className="visual-stat">99.4% Forecast Accuracy</span>
              </div>

              {/* SVG Predictive Graph Line & Connected Nodes */}
              <svg className="predictive-chart-svg" viewBox="0 0 540 180" fill="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9"/>
                    <stop offset="50%" stopColor="#14b8a6"/>
                    <stop offset="100%" stopColor="#38bdf8"/>
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <line x1="20" y1="30" x2="520" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="75" x2="520" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="120" x2="520" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
                <line x1="20" y1="160" x2="520" y2="160" stroke="rgba(255,255,255,0.1)"/>

                <path d="M 30 145 Q 100 125, 160 110 T 290 85 T 410 48 T 510 32 L 510 160 L 30 160 Z" fill="url(#chartGradient)"/>
                <path d="M 30 145 Q 100 125, 160 110 T 290 85 T 410 48 T 510 32" stroke="url(#lineGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#glow)"/>

                <circle cx="30" cy="145" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="160" cy="110" r="4.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="290" cy="85" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="410" cy="48" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow)"/>
                <circle cx="410" cy="48" r="11" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.7"/>
                <circle cx="510" cy="32" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>

                <text x="35" y="135" fill="#94a3b8" fontSize="11" fontFamily="'Plus Jakarta Sans', sans-serif">Baseline</text>
                <text x="265" y="72" fill="#94a3b8" fontSize="11" fontFamily="'Plus Jakarta Sans', sans-serif">Telemetry Influx</text>
                <text x="385" y="32" fill="#38bdf8" fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">AI Forecast</text>
              </svg>

              <div className="visual-footer-stats">
                <div className="stat-pill">
                  <span className="stat-label">Monitored Outlay</span>
                  <span className="stat-num">₹ 48.2 Lakh Cr</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">Early Risk Signals</span>
                  <span className="stat-num stat-highlight">118 Mitigated</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">Model Latency</span>
                  <span className="stat-num">12ms</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ===== RIGHT LOGIN CARD PANEL (~45%) ===== */}
        <section className="card-panel">
          <div className="login-card-container">

            <div className="auth-card">

              <div className="card-header">
                <h2 className="card-title">Access Workspace</h2>
                <p className="card-subtitle">Sign in to manage projects and stream predictive analytics</p>
              </div>

              {/* Alert / Toast Message */}
              {authAlert && (
                <div className={`auth-alert show ${authAlert.isError ? 'error' : 'success'}`} role="alert">
                  {authAlert.message}
                </div>
              )}

              {/* SIGN IN FORM */}
              <form className="auth-form active" onSubmit={handleLoginSubmit}>

                {/* Username Field */}
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username or Official Email <span className="req">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="username"
                      className="form-input"
                      placeholder="name@agency.org or username"
                      autoComplete="username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="password" className="form-label">
                      Password <span className="req">*</span>
                    </label>
                    <a href="#" className="forgot-link" onClick={handleForgotPassword}>Forgot Password?</a>
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="form-input has-action"
                      placeholder="Enter your secure password"
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => setShowPassword(v => !v)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* CAPTCHA / Verification Code */}
                <div className="form-group">
                  <label htmlFor="captcha-input" className="form-label">
                    Verification Code <span className="req">*</span>
                  </label>

                  <div className="captcha-card">
                    <div className="captcha-preview" title="Security Verification Code">
                      <div className="captcha-noise"></div>
                      {captchaCode.split('').map((char, i) => (
                        <span
                          key={i}
                          className={`captcha-char char-${i + 1}`}
                          style={{
                            transform: captchaTilts[i]
                              ? `rotate(${captchaTilts[i].tilt}deg) translateY(${captchaTilts[i].y}px)`
                              : 'none'
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`captcha-reload-btn ${isCaptchaSpinning ? 'spinning' : ''}`}
                      onClick={handleReloadCaptcha}
                      title="Regenerate Verification Code"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                      </svg>
                    </button>
                  </div>

                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="captcha-input"
                      className="form-input captcha-type"
                      placeholder="Enter 6-character code"
                      maxLength="6"
                      autoComplete="off"
                      value={captchaInputVal}
                      onChange={e => setCaptchaInputVal(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Primary Button */}
                <button type="submit" className="btn-primary-cta" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="btn-text">Signing in...</span>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="spinning" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10"></path>
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="btn-text">Sign In</span>
                      <span className="btn-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Badges Footer */}
              <div className="card-security-footer">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Secured with end-to-end encryption</span>
              </div>

            </div>

            {/* Help Link */}
            <div className="sub-card-footer">
              <span>Need assistance? <a href="#" onClick={(e) => { e.preventDefault(); alert('For access provisioning or agency onboarding assistance, contact support@nivara.ai'); }}>Contact NIVARA Support</a></span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default Login;
