import React, { useEffect } from 'react';
import './Login.css';
import { Link } from 'react-router-dom';

const Login = () => {
  useEffect(() => {
    /**
 * login.js
 * NIVARA — Modern Infrastructure Analytics Portal
 * Interactive controller for tabs, captcha, password visibility, and validation
 */

// document.addEventListener("DOMContentLoaded", () => {
  let activeCaptchaCode = "";

  // DOM Elements
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const tabIndicator = document.getElementById("tab-indicator");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const authAlert = document.getElementById("auth-alert");

  const btnReloadCaptcha = document.getElementById("btn-reload-captcha");
  const captchaInput = document.getElementById("captcha-input");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eye-icon");
  const btnForgotPassword = document.getElementById("btn-forgot-password");

  // ================= 1. Dynamic Monospace Modern CAPTCHA =================
  const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const charElements = [
    document.getElementById("c0"),
    document.getElementById("c1"),
    document.getElementById("c2"),
    document.getElementById("c3"),
    document.getElementById("c4"),
    document.getElementById("c5")
  ];

  function generateCaptcha() {
    let code = "";
    const tilts = [-6, 7, -8, 5, -4, 8];

    for (let i = 0; i < 6; i++) {
      const char = CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
      code += char;
      if (charElements[i]) {
        charElements[i].textContent = char;
        // Apply slight jitter
        const randomTilt = (Math.random() * 14 - 7).toFixed(1);
        const randomY = (Math.random() * 4 - 2).toFixed(1);
        charElements[i].style.transform = `rotate(${randomTilt}deg) translateY(${randomY}px)`;
      }
    }
    activeCaptchaCode = code;
    if (captchaInput) {
      captchaInput.value = "";
    }
  }

  if (btnReloadCaptcha) {
    btnReloadCaptcha.addEventListener("click", () => {
      btnReloadCaptcha.classList.add("spinning");
      generateCaptcha();
      setTimeout(() => {
        btnReloadCaptcha.classList.remove("spinning");
      }, 450);
    });
  }

  // Initial generation
  generateCaptcha();

  // ================= 2. Animated Underline Tab Switching =================
  if (tabLogin && tabRegister && tabIndicator) {
    tabLogin.addEventListener("click", () => {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      tabIndicator.style.transform = "translateX(0%)";

      if (formLogin) formLogin.classList.add("active");
      if (formRegister) formRegister.classList.remove("active");
      hideAlert();
    });

    tabRegister.addEventListener("click", () => {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      tabIndicator.style.transform = "translateX(100%)";

      if (formRegister) formRegister.classList.add("active");
      if (formLogin) formLogin.classList.remove("active");
      hideAlert();
    });
  }

  // ================= 3. Password Visibility Toggle =================
  if (togglePasswordBtn && passwordInput && eyeIcon) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";

      if (isPassword) {
        // Eye Off SVG
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24">
          <line x1="1" y1="1" x2="23" y2="23">
        `;
        togglePasswordBtn.title = "Hide password";
      } else {
        // Eye SVG
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z">
          <circle cx="12" cy="12" r="3">
        `;
        togglePasswordBtn.title = "Show password";
      }
    });
  }

  // ================= 4. Alerts Helper =================
  function showAlert(message, isError = true) {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.className = `auth-alert show ${isError ? "error" : "success"}`;
  }

  function hideAlert() {
    if (!authAlert) return;
    authAlert.className = "auth-alert";
    authAlert.textContent = "";
  }

  // ================= 5. Sign In Form Submission =================
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document.getElementById("username")?.value.trim();
      const password = passwordInput?.value.trim();
      const enteredCaptcha = captchaInput?.value.trim().toUpperCase();

      if (!username) {
        showAlert("Please enter your username or work email.");
        return;
      }
      if (!password) {
        showAlert("Please enter your password.");
        return;
      }
      if (!enteredCaptcha) {
        showAlert("Please enter the 6-character verification code.");
        return;
      }
      if (enteredCaptcha !== activeCaptchaCode) {
        showAlert("Verification code does not match. Please try again.");
        generateCaptcha();
        return;
      }

      // Success State
      showAlert("Authentication successful! Loading NIVARA Analytics Workspace...", false);
      const submitBtn = document.getElementById("btn-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-text">Signing in...</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="spinning" style="animation: spin 0.8s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25">
            <path d="M12 2a10 10 0 0 1 10 10">
          </svg>
        `;
      }

      setTimeout(() => {
        /* window.location.href = "index.html" */;
      }, 1200);
    });
  }

  // ================= 6. Registration Form Submission =================
  if (formRegister) {
    formRegister.addEventListener("submit", (e) => {
      e.preventDefault();
      showAlert("Registration submitted! Verification link dispatched to your official email.", false);
      setTimeout(() => {
        tabLogin.click();
      }, 2000);
    });
  }

  // ================= 7. Forgot Password Prompt =================
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("username")?.value.trim();
      if (email) {
        showAlert(`Password reset instructions have been forwarded to: ${email}`, false);
      } else {
        showAlert("Please enter your official username or email above, then click Forgot Password.");
      }
    });
  }

  // ================= 8. Utility Header Buttons =================
  const notifBtn = document.getElementById("notif-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      showAlert("System Notice: All AI Risk Forewarning engines operational (v3.4).", false);
    });
  }

  const langBtn = document.getElementById("lang-btn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const span = langBtn.querySelector("span");
      if (span) {
        span.textContent = span.textContent === "EN" ? "HI" : "EN";
      }
    });
  }
// });

  }, []);

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
  <header className="top-nav">
    <div className="nav-left">
      <a href="index.html" className="brand-link" title="Return to NIVARA Home">
        <div className="brand-badge">
          <img src="NIVARA logo.png" alt="NIVARA Logo" className="brand-logo-img" />
        </div>
        <div className="brand-titles">
          <span className="brand-name">NIVARA</span>
          <span className="brand-tag">Predictive Analytics Platform</span>
        </div>
      </a>
    </div>

    <div className="nav-right">
      <button className="nav-util-btn" id="lang-btn" title="Language: English">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>EN</span>
      </button>

      <button className="nav-util-btn" id="notif-btn" title="System Notifications">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="notif-pulse"></span>
      </button>

      <button className="nav-util-btn" id="acc-btn" title="Accessibility Options">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4" r="2" />
          <path d="m19 13-4.5-1.5L13 7h-2l-1.5 4.5L5 13l1 2 4-1.5V20h4v-6.5l4 1.5z" />
        </svg>
      </button>

      <a href="index.html" className="nav-dashboard-link">
        <span>Dashboard</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  </header>

  {/* ================= MAIN SPLIT CONTAINER ================= */}
  <main className="split-layout">

    {/* ===== LEFT HERO PANEL (~55%) ===== */}
    <section className="hero-panel">
      {/* Background Mesh Glows */}
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
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%" />
                <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
              </linearGradient>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%" />
                <stop offset="0%" stop-color="#0ea5e9"/>
                <stop offset="50%" stop-color="#14b8a6"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Chart Background Grid Lines */}
            <line x1="20" y1="30" x2="520" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
            <line x1="20" y1="75" x2="520" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
            <line x1="20" y1="120" x2="520" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"/>
            <line x1="20" y1="160" x2="520" y2="160" stroke="rgba(255,255,255,0.1)"/>

            {/* Area fill under line */}
            <path d="M 30 145 Q 100 125, 160 110 T 290 85 T 410 48 T 510 32 L 510 160 L 30 160 Z" fill="url(#chartGradient)"/>

            {/* Predictive Smooth Curved Line */}
            <path d="M 30 145 Q 100 125, 160 110 T 290 85 T 410 48 T 510 32" stroke="url(#lineGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#glow)"/>

            {/* Node 1 */}
            <circle cx="30" cy="145" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2"/>
            {/* Node 2 */}
            <circle cx="160" cy="110" r="4.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2"/>
            {/* Node 3 */}
            <circle cx="290" cy="85" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2"/>
            {/* Node 4 (Current Horizon) */}
            <circle cx="410" cy="48" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow)"/>
            <circle cx="410" cy="48" r="11" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.7"/>
            {/* Node 5 (Forecast Target) */}
            <circle cx="510" cy="32" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>

            {/* Floating Data Labels on Graph */}
            <text x="35" y="135" fill="#94a3b8" font-size="11" font-family="'Plus Jakarta Sans', sans-serif">Baseline</text>
            <text x="265" y="72" fill="#94a3b8" font-size="11" font-family="'Plus Jakarta Sans', sans-serif">Telemetry Influx</text>
            <text x="385" y="32" fill="#38bdf8" font-size="11" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">AI Forecast</text>
          </svg>

          {/* Stat Floating Indicators */}
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

        {/* Modern Floating Card (18px radius) */}
        <div className="auth-card">

          {/* Card Header & Animated Tabs */}
          <div className="card-header">
            <h2 className="card-title">Access Workspace</h2>
            <p className="card-subtitle">Sign in to manage projects and stream predictive analytics</p>

            <div className="tabs-wrapper">
              <div className="tabs-track">
                <button type="button" className="tab-btn active" id="tab-login" data-tab="login">
                  <span>Sign In</span>
                </button>
                <button type="button" className="tab-btn" id="tab-register" data-tab="register">
                  <span>Register</span>
                </button>
                {/* Animated Underline Indicator */}
                <div className="tab-indicator" id="tab-indicator"></div>
              </div>
            </div>
          </div>

          {/* Alert / Toast Message */}
          <div id="auth-alert" className="auth-alert" role="alert"></div>

          {/* SIGN IN FORM */}
          <form id="form-login" className="auth-form active">

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
                  autocomplete="username"
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
                <a href="#" className="forgot-link" id="btn-forgot-password">Forgot Password?</a>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  id="password"
                  className="form-input has-action"
                  placeholder="Enter your secure password"
                  autocomplete="current-password"
                  required
                 />
                <button type="button" className="action-btn" id="toggle-password" title="Toggle password visibility" aria-label="Toggle password visibility">
                  <svg id="eye-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
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
                {/* Distorted monospace captcha display */}
                <div className="captcha-preview" id="captcha-preview" title="Security Verification Code">
                  <div className="captcha-noise"></div>
                  <span className="captcha-char char-1" id="c0">7</span>
                  <span className="captcha-char char-2" id="c1">K</span>
                  <span className="captcha-char char-3" id="c2">9</span>
                  <span className="captcha-char char-4" id="c3">M</span>
                  <span className="captcha-char char-5" id="c4">X</span>
                  <span className="captcha-char char-6" id="c5">2</span>
                </div>

                {/* Modern refresh button */}
                <button type="button" className="captcha-reload-btn" id="btn-reload-captcha" title="Regenerate Verification Code" aria-label="Regenerate Verification Code">
                  <svg id="reload-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  maxlength="6"
                  autocomplete="off"
                  required
                 />
              </div>
            </div>

            {/* Primary Gradient CTA Button */}
            <button type="submit" className="btn-primary-cta" id="btn-submit">
              <span className="btn-text">Sign In</span>
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </button>
          </form>

          {/* REGISTER FORM */}
          <form id="form-register" className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-agency" className="form-label">Implementing Agency / Organization <span className="req">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3l6 4H9z"/></svg>
                </span>
                <input type="text" id="reg-agency" className="form-input" placeholder="e.g., National Highways, Metro Rail" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Official Work Email <span className="req">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" id="reg-email" className="form-input" placeholder="officer@agency.org" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Create Password <span className="req">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type="password" id="reg-password" className="form-input" placeholder="Minimum 8 characters" required />
              </div>
            </div>

            <button type="submit" className="btn-primary-cta">
              <span className="btn-text">Create Account</span>
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
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
          <span>Need assistance? <a href="#" onClick="alert('For access provisioning or agency onboarding assistance, contact support@nivara.ai')">Contact NIVARA Support</a></span>
        </div>

      </div>
    </section>

  </main>
    </>
  );
};

export default Login;
