/**
 * login.js
 * NIVARA — Modern Infrastructure Analytics Portal
 * Interactive controller for tabs, captcha, password visibility, and validation
 */

document.addEventListener("DOMContentLoaded", () => {
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
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
        togglePasswordBtn.title = "Hide password";
      } else {
        // Eye SVG
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
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
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
        `;
      }

      setTimeout(() => {
        window.location.href = "index.html";
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
});
