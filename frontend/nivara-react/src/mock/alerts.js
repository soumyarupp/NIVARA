/**
 * mock/alerts.js
 * Mock data for Early Warning & Alert System APIs (/api/alerts)
 */

export const mockAlerts = [
  {
    id: "ALT-001",
    projectId: "NH27-BR-001",
    projectName: "NH-27 4-Laning (Forbesganj - Muzaffarpur Corridor)",
    agency: "NHAI / MoRTH",
    state: "Bihar",
    severity: "HIGH",
    type: "FUND_PROGRESS_MISMATCH",
    message: "85% of funds disbursed while reported physical progress is only 40%.",
    createdAt: "2026-09-08T18:30:00Z",
    acknowledged: false
  },
  {
    id: "ALT-002",
    projectId: "PRJ-MAHSR-02",
    projectName: "Mumbai – Ahmedabad High Speed Rail (Tunnel Segment)",
    agency: "NHSRCL",
    state: "Maharashtra",
    severity: "CRITICAL",
    type: "STEEP_TIMELINE_SLIPPAGE",
    message: "Undersea tunnel excavation milestone delayed by 14 months against baseline schedule.",
    createdAt: "2026-09-08T14:15:00Z",
    acknowledged: false
  },
  {
    id: "ALT-003",
    projectId: "OD-CRP-001",
    projectName: "Talcher Ultra Mega Thermal Power Project Unit-2",
    agency: "NTPC / Ministry of Power",
    state: "Odisha",
    severity: "HIGH",
    type: "CONTRACTOR_LIQUIDITY_DEFICIT",
    message: "Primary contractor milestone billing variance exceeds 25% for Q2.",
    createdAt: "2026-09-07T11:45:00Z",
    acknowledged: true
  },
  {
    id: "ALT-004",
    projectId: "CMRL-TN-07",
    projectName: "Chennai Metro Phase-2 (Corridor 4 Underground Stretch)",
    agency: "CMRL / MoHUA",
    state: "Tamil Nadu",
    severity: "MEDIUM",
    type: "UTILITY_RELOCATION_DELAY",
    message: "Subsurface water mains relocation pending NOC from local municipal council.",
    createdAt: "2026-09-06T09:20:00Z",
    acknowledged: false
  }
];

export const generateMockAlert = (projectId) => ({
  success: true,
  alert: {
    id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
    projectId: projectId || "NH27-BR-001",
    severity: "HIGH",
    type: "FUND_PROGRESS_MISMATCH",
    message: "Project expenditure is significantly higher than reported physical progress.",
    createdAt: new Date().toISOString(),
    acknowledged: false
  }
});
