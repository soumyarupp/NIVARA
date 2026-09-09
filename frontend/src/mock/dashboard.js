/**
 * mock/dashboard.js
 * Mock data layer for Dashboard Overview API (/api/dashboard/overview)
 */

export const mockDashboardOverview = {
  success: true,
  systemStatus: "OPERATIONAL",
  lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ", 21:50 IST",
  summary: {
    totalProjects: 186,
    onTrack: 124,
    atRisk: 44,
    critical: 18,
    totalMonitoredOutlay: "₹48.2 Lakh Crore",
    projectsAtRisk: "118 Projects"
  },
  riskDistribution: {
    low: 124,
    medium: 26,
    high: 18,
    critical: 18
  },
  stateRiskOverview: [
    { state: "Bihar", activeProjects: 14, highRiskCount: 3, criticalCount: 1, primaryIssue: "Land Acquisition & Fund Mismatch" },
    { state: "Odisha", activeProjects: 12, highRiskCount: 2, criticalCount: 2, primaryIssue: "Forest & Environmental Clearances" },
    { state: "Gujarat", activeProjects: 18, highRiskCount: 4, criticalCount: 1, primaryIssue: "RoW Clearances & Utility Shifting" },
    { state: "Haryana", activeProjects: 9, highRiskCount: 1, criticalCount: 0, primaryIssue: "Minor Contractor Mobilization Slippage" },
    { state: "Assam", activeProjects: 11, highRiskCount: 2, criticalCount: 2, primaryIssue: "Monsoon Inundation & Access Road Delays" },
    { state: "Tamil Nadu", activeProjects: 15, highRiskCount: 3, criticalCount: 1, primaryIssue: "Subsurface Geology & TBM Wear" }
  ]
};
