/**
 * api.js
 * -----------------------------------------------------------------------
 * This file is the data layer for the NIVARA frontpage.
 * Right now it returns mock data that matches the reference design.
 * When a real backend is ready, replace the bodies of these functions
 * with actual fetch() calls to your endpoints — the rest of the site
 * (script.js) will keep working unchanged as long as the returned
 * shape stays the same.
 * -----------------------------------------------------------------------
 */

const NivaraAPI = {

  /**
   * Fetches the top-line stat numbers shown in the hero section.
   * Replace with: return fetch('/api/stats').then(r => r.json());
   */
  async getStats() {
    // ---- MOCK DATA (swap for real API call) ----
    return {
      totalMonitoredOutlay: "₹ 48.2 Lakh Cr",
      activeRiskSignals: "118 Projects"
    };
  },

  /**
   * Fetches the feature cards shown on the right side of the hero.
   * Replace with: return fetch('/api/features').then(r => r.json());
   */
  async getFeatures() {
    // ---- MOCK DATA (swap for real API call) ----
    return [
      {
        title: "Predictive Risk Radar",
        description: "Real-time anomaly detection and delay forecasting for mega projects.",
        icon: "radar"
      },
      {
        title: "AI Scenario Simulator",
        description: "Simulate supply chain and budget bottlenecks before execution.",
        icon: "simulator"
      },
      {
        title: "National Telemetry",
        description: "Aggregated live progress metrics from central sector ministries.",
        icon: "telemetry"
      },
      {
        title: "Enterprise Gateway",
        description: "Encrypted access controls and audit trails for stakeholders.",
        icon: "gateway"
      }
    ];
  }
};
