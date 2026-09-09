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

    // Success State -> Redirect to Dashboard workspace
    setAuthAlert({ message: "Authentication successful! Redirecting to Workspace...", isError: false });
    setIsSubmitting(true);
    localStorage.setItem('nivara_auth', 'true');

    setTimeout(() => {
      navigate('/dashboard');
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
            <div className="brand-titles">
              <span className="brand-name">NIVARA</span>
              <span className="brand-tag">Predictive Analytics Platform</span>
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

      {/* ================= CENTERED MAIN LAYOUT ================= */}
      <main className="centered-layout">
        {/* Background Mesh Glows & Grid */}
        <div className="mesh-glow mesh-glow-1"></div>
        <div className="mesh-glow mesh-glow-2"></div>
        <div className="mesh-grid-pattern"></div>

        {/* ===== CENTERED SIGN IN CARD ===== */}
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
      </main>
    </div>
  );
};

export default Login;
