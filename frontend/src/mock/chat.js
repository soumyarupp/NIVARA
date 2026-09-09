/**
 * mock/chat.js
 * Mock data for Interactive AI Chatbot API (/api/chat/query)
 */

export const processMockChatQuery = (query) => {
  const lower = (query || "").toLowerCase();

  if (lower.includes("bihar") || lower.includes("road")) {
    return {
      success: true,
      answer: "There are 2 high-risk road projects matching your criteria in Bihar over ₹500 crore.",
      projects: [
        {
          id: "NH27-BR-001",
          name: "NH-27 4-Laning (Forbesganj - Muzaffarpur)",
          cost: 850,
          riskLevel: "HIGH",
          delayDays: 47,
          riskReason: "Fund-Progress Mismatch"
        },
        {
          id: "BR-EXP-004",
          name: "Patna - Ring Road Southern Spur",
          cost: 1200,
          riskLevel: "HIGH",
          delayDays: 32,
          riskReason: "Land Acquisition & RoW Disputes"
        }
      ]
    };
  }

  if (lower.includes("alert") || lower.includes("nodal")) {
    return {
      success: true,
      answer: "Notification dispatched to Nodal Officer (Er. R. K. Sharma, Chief Engineer NHAI Bihar Zone) for NH-27 project escalation.",
      actionTaken: "ALERT_DISPATCHED",
      details: {
        recipient: "nodal.officer.nh27@nhai.gov.in",
        status: "SENT",
        timestamp: new Date().toISOString()
      }
    };
  }

  return {
    success: true,
    answer: "NIVARA Assistant retrieved 3 active infrastructure items matching your inquiry. Total monitored outlay is ₹48.2 Lakh Cr across 186 Central Sector Mega Projects.",
    projects: [
      {
        id: "NH27-BR-001",
        name: "NH-27 4-Laning",
        cost: 850,
        riskLevel: "HIGH",
        delayDays: 47,
        riskReason: "Fund-Progress Mismatch"
      },
      {
        id: "PRJ-MAHSR-02",
        name: "Mumbai-Ahmedabad High Speed Rail",
        cost: 108000,
        riskLevel: "CRITICAL",
        delayDays: 420,
        riskReason: "Undersea Tunnel Excavation"
      }
    ]
  };
};
