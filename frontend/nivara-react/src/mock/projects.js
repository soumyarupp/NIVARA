/**
 * mock/projects.js
 * Mock data for Projects API (/api/projects)
 */

export const mockProjectsList = [
  {
    id: "NH27-BR-001",
    name: "NH-27 4-Laning (Forbesganj - Muzaffarpur)",
    agency: "NHAI / MoRTH",
    state: "Bihar",
    sector: "Roads & Highways",
    riskLevel: "HIGH",
    delayDays: 47,
    primaryRisk: "Fund-Progress Mismatch",
    outlay: "₹ 850 Cr",
    status: "Delayed Milestone"
  },
  {
    id: "HR-MTR-003",
    name: "Metro Line-3 (Gurugram Corridor)",
    agency: "DMRC / MoHUA",
    state: "Haryana",
    sector: "Urban Transit",
    riskLevel: "MEDIUM",
    delayDays: 18,
    primaryRisk: "Land Acquisition",
    outlay: "₹ 1,450 Cr",
    status: "Under Construction"
  },
  {
    id: "OD-CRP-001",
    name: "Power Plant Unit-2 (Talcher Super Thermal)",
    agency: "NTPC / Ministry of Power",
    state: "Odisha",
    sector: "Power & Energy",
    riskLevel: "HIGH",
    delayDays: 31,
    primaryRisk: "Fund Shortage",
    outlay: "₹ 2,400 Cr",
    status: "Delayed Milestone"
  },
  {
    id: "PRJ-WDFC-01",
    name: "Western Dedicated Freight Corridor (Phase 2)",
    agency: "DFCCIL / Ministry of Railways",
    state: "Gujarat",
    sector: "Railways",
    riskLevel: "CRITICAL",
    delayDays: 62,
    primaryRisk: "RoW Dispute & Signaling",
    outlay: "₹ 51,800 Cr",
    status: "Critical Monitoring"
  },
  {
    id: "AS-HYD-005",
    name: "Subansiri Lower Hydroelectric Project (2,000 MW)",
    agency: "NHPC / Ministry of Power",
    state: "Assam",
    sector: "Power & Energy",
    riskLevel: "CRITICAL",
    delayDays: 85,
    primaryRisk: "Statutory Clearance & River Access",
    outlay: "₹ 21,247 Cr",
    status: "Severe Slippage"
  },
  {
    id: "PRJ-MAHSR-02",
    name: "Mumbai – Ahmedabad High Speed Rail (Bullet Train)",
    agency: "NHSRCL",
    state: "Maharashtra",
    sector: "High-Speed Rail",
    riskLevel: "CRITICAL",
    delayDays: 420,
    primaryRisk: "Undersea Tunnel Excavation",
    outlay: "₹ 1,08,000 Cr",
    status: "Critical Monitoring"
  }
];

export const filterMockProjects = (params = {}) => {
  let filtered = [...mockProjectsList];
  if (params.state) {
    filtered = filtered.filter(p => p.state.toLowerCase() === params.state.toLowerCase());
  }
  if (params.riskLevel) {
    filtered = filtered.filter(p => p.riskLevel.toLowerCase() === params.riskLevel.toLowerCase());
  }
  if (params.sector) {
    filtered = filtered.filter(p => p.sector.toLowerCase().includes(params.sector.toLowerCase()));
  }
  return {
    success: true,
    total: filtered.length,
    projects: filtered
  };
};
