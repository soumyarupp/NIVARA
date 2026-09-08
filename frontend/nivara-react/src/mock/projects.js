/**
 * mock/projects.js
 * Mock data for Projects API (/api/projects)
 * Extended with progress, cost, delay, weekly reports, and risk categorization
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
    status: "Delayed Milestone",
    progress: 38,
    costUsed: 62,
    delayMonths: 8,
    weeklyReport: "Earthwork resumed after monsoon break. Pavement laying pending at Ch. 42–58 km. Fund utilization higher than physical progress — flagged for review."
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
    status: "Under Construction",
    progress: 64,
    costUsed: 58,
    delayMonths: 3,
    weeklyReport: "TBM breakthrough at Station-4 completed. Elevated viaduct casting at 78%. Minor land dispute at Sector-56 entry portal under mediation."
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
    status: "Delayed Milestone",
    progress: 45,
    costUsed: 71,
    delayMonths: 6,
    weeklyReport: "Boiler drum erection 90% complete. Turbine foundation delayed due to revised geological assessment. Awaiting supplementary budget allocation of ₹180 Cr."
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
    status: "Critical Monitoring",
    progress: 29,
    costUsed: 48,
    delayMonths: 14,
    weeklyReport: "Track laying halted on 3 sections due to RoW disputes with state PWD. European signaling vendor delayed shipment by 4 months. Escalated to PMO."
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
    status: "Severe Slippage",
    progress: 22,
    costUsed: 55,
    delayMonths: 24,
    weeklyReport: "Dam construction stalled pending revised Environmental Impact Assessment. Upstream cofferdam seepage issue being addressed. Community consultation pending."
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
    status: "Critical Monitoring",
    progress: 34,
    costUsed: 42,
    delayMonths: 36,
    weeklyReport: "Undersea tunnel TBM advance at 1.2 km/month. Viaduct pier construction in Surat–Vadodara section at 65%. Japanese technical team reviewing schedule revision."
  },
  {
    id: "KA-MET-002",
    name: "Bengaluru Metro Phase-2 (ORR Line Extension)",
    agency: "BMRCL / MoHUA",
    state: "Karnataka",
    sector: "Urban Transit",
    riskLevel: "LOW",
    delayDays: 5,
    primaryRisk: "Minor Contractor Delay",
    outlay: "₹ 6,800 Cr",
    status: "On Track",
    progress: 82,
    costUsed: 74,
    delayMonths: 1,
    weeklyReport: "Station finishing works on schedule. Track alignment testing completed on 12 km stretch. All milestones progressing within acceptable variance."
  },
  {
    id: "TN-PORT-004",
    name: "Chennai Outer Harbour Container Terminal",
    agency: "Chennai Port Trust / MoPS",
    state: "Tamil Nadu",
    sector: "Ports & Shipping",
    riskLevel: "LOW",
    delayDays: 0,
    primaryRisk: "None",
    outlay: "₹ 4,200 Cr",
    status: "On Track",
    progress: 91,
    costUsed: 85,
    delayMonths: 0,
    weeklyReport: "Quay wall construction 100% complete. Crane installation in progress — 4 of 6 STS cranes operational. Container yard paving 88% done. On schedule for Dec 2026 commissioning."
  },
  {
    id: "RJ-SOL-008",
    name: "Rajasthan Ultra Mega Solar Park (4,000 MW)",
    agency: "SECI / MNRE",
    state: "Rajasthan",
    sector: "Renewable Energy",
    riskLevel: "LOW",
    delayDays: 2,
    primaryRisk: "Minor Transmission Linkage",
    outlay: "₹ 16,500 Cr",
    status: "On Track",
    progress: 76,
    costUsed: 68,
    delayMonths: 0,
    weeklyReport: "Module installation at 3,040 MW capacity. Inverter stations commissioned for Phase 1 & 2. Minor 2-day delay in 765kV substation handover — non-critical."
  },
  {
    id: "MP-DAM-006",
    name: "Ken-Betwa River Interlinking Project",
    agency: "NWDA / Ministry of Jal Shakti",
    state: "Madhya Pradesh",
    sector: "Water Resources",
    riskLevel: "MEDIUM",
    delayDays: 22,
    primaryRisk: "Environmental Clearance Revision",
    outlay: "₹ 44,605 Cr",
    status: "Under Construction",
    progress: 18,
    costUsed: 25,
    delayMonths: 4,
    weeklyReport: "Daudhan Dam foundation excavation at 40%. Wildlife corridor assessment submitted to NBWL. Canal alignment survey 72% complete. Awaiting Stage-II forest clearance."
  },
  {
    id: "WB-BRG-009",
    name: "2nd Hooghly Bridge Approach Flyover",
    agency: "NHAI / MoRTH",
    state: "West Bengal",
    sector: "Roads & Highways",
    riskLevel: "MEDIUM",
    delayDays: 15,
    primaryRisk: "Utility Shifting",
    outlay: "₹ 1,120 Cr",
    status: "Under Construction",
    progress: 55,
    costUsed: 52,
    delayMonths: 3,
    weeklyReport: "Pier cap casting completed for spans 1–8. Underground utility (gas pipeline) shifting delayed by 15 days. Traffic diversion plan revised. Foundation work on-going."
  },
  {
    id: "UP-EXP-010",
    name: "Ganga Expressway (Meerut–Prayagraj)",
    agency: "UPEIDA / MoRTH",
    state: "Uttar Pradesh",
    sector: "Roads & Highways",
    riskLevel: "LOW",
    delayDays: 3,
    primaryRisk: "None",
    outlay: "₹ 36,230 Cr",
    status: "On Track",
    progress: 68,
    costUsed: 60,
    delayMonths: 0,
    weeklyReport: "Pavement laying ahead of schedule on 4 of 12 packages. All ROBs and underpasses progressing normally. Land acquisition 99.8% complete."
  }
];

export const filterMockProjects = (params = {}) => {
  let filtered = [...mockProjectsList];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.agency.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );
  }
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
