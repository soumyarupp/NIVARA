/**
 * script.js
 * -----------------------------------------------------------------------
 * Handles:
 *  - Pulling data from api.js and rendering it into the page
 *  - Font size (A- / A+) accessibility controls
 * -----------------------------------------------------------------------
 */

// ---- Icon SVGs for each feature card ----
const ICONS = {
  radar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>
          </svg>`,
  simulator: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
          </svg>`,
  telemetry: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 15l3-4 3 2 4-6"/>
          </svg>`,
  gateway: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/>
          </svg>`
};

/**
 * Renders the two stat cards in the hero section.
 */
async function renderStats() {
  const stats = await NivaraAPI.getStats();
  document.getElementById("stat-outlay").textContent = stats.totalMonitoredOutlay;
  document.getElementById("stat-risk").textContent = stats.activeRiskSignals;
}

/**
 * Renders the 4 feature cards on the right side of the hero.
 */
async function renderFeatures() {
  const features = await NivaraAPI.getFeatures();
  const grid = document.getElementById("feature-grid");

  grid.innerHTML = features.map(feature => `
    <div class="feature-card">
      <div class="feature-icon">${ICONS[feature.icon] || ""}</div>
      <h3 class="feature-title">${feature.title}</h3>
      <p class="feature-desc">${feature.description}</p>
    </div>
  `).join("");
}

/**
 * Simple accessibility font-size control (A- / A+ buttons).
 */
function setupFontControls() {
  const root = document.documentElement;
  let fontScale = 1;
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.3;
  const STEP = 0.1;

  document.getElementById("font-increase").addEventListener("click", () => {
    fontScale = Math.min(MAX_SCALE, fontScale + STEP);
    root.style.fontSize = `${fontScale * 100}%`;
  });

  document.getElementById("font-decrease").addEventListener("click", () => {
    fontScale = Math.max(MIN_SCALE, fontScale - STEP);
    root.style.fontSize = `${fontScale * 100}%`;
  });
}

// ---- Initialize page ----
document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderFeatures();
  setupFontControls();

  // Navigation to Login / Add Project portal
  const btnAdd = document.querySelector(".btn-add");
  if (btnAdd) {
    btnAdd.addEventListener("click", (e) => {
      if (btnAdd.tagName === "BUTTON") {
        e.preventDefault();
        window.location.href = "login.html";
      }
    });
  }
});
