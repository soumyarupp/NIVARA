/**
 * predictionApi.js
 * -------------------------------------------------------------------------------------
 * Model-Agnostic Integration Layer for NIVARA Infrastructure Predictive Analytics.
 * 
 * This module acts as the contract bridge between the frontend UI and the downstream
 * ML model-serving endpoint. Currently, it returns realistic mock predictions with
 * simulated latency.
 * 
 * When the ML model pipeline is trained on government infrastructure datasets (budget vs.
 * actual spend, timeline slippage, physical progress %, fund utilization lag, etc.),
 * swap the mock return inside getProjectPrediction() with a real fetch() call.
 * 
 * EXACT JSON CONTRACT:
 * {
 *   "projectId": "string",
 *   "riskScore": 0-100,
 *   "riskLevel": "Low" | "Medium" | "High" | "Critical",
 *   "predictedDelayMonths": number,
 *   "confidence": 0-1,
 *   "topFactors": [
 *     { "factor": "string", "impact": 0-1 }
 *   ],
 *   "riskTrend": [
 *     { "month": "YYYY-MM", "score": 0-100 }
 *   ],
 *   "modelVersion": "string",
 *   "lastUpdated": "ISO 8601 timestamp"
 * }
 * -------------------------------------------------------------------------------------
 */

const PredictionAPI = {

  /**
   * List of monitored Central Sector Mega Projects
   * Used by the Reports directory table / card view.
   */
  async getMonitoredProjects() {
    return [
      {
        id: "PRJ-WDFC-01",
        name: "Western Dedicated Freight Corridor (Dadri – JNPT)",
        sector: "Railways",
        outlay: "₹ 51,800 Cr",
        status: "Delayed Milestone",
        plannedCompletion: "Dec 2026",
        agency: "DFCCIL / Ministry of Railways"
      },
      {
        id: "PRJ-MAHSR-02",
        name: "Mumbai – Ahmedabad High Speed Rail (Bullet Train)",
        sector: "High-Speed Rail",
        outlay: "₹ 1,08,000 Cr",
        status: "Critical Monitoring",
        plannedCompletion: "Aug 2027",
        agency: "NHSRCL"
      },
      {
        id: "PRJ-DME-03",
        name: "Delhi – Mumbai Expressway (Phase 2 Spur Expansion)",
        sector: "Roads & Highways",
        outlay: "₹ 98,230 Cr",
        status: "Under Construction",
        plannedCompletion: "Mar 2027",
        agency: "NHAI / MoRTH"
      },
      {
        id: "PRJ-ZOJILA-04",
        name: "Zojila Strategic All-Weather Mountain Tunnel",
        sector: "Strategic Highways",
        outlay: "₹ 6,800 Cr",
        status: "Severe Slippage",
        plannedCompletion: "Nov 2026",
        agency: "NHIDCL"
      },
      {
        id: "PRJ-DIBANG-05",
        name: "Dibang Multipurpose Hydroelectric Project (2,880 MW)",
        sector: "Power & Hydro",
        outlay: "₹ 31,875 Cr",
        status: "On Schedule",
        plannedCompletion: "Feb 2029",
        agency: "NHPC / Ministry of Power"
      },
      {
        id: "PRJ-NICOBAR-06",
        name: "Great Nicobar International Container Transshipment Port",
        sector: "Ports & Shipping",
        outlay: "₹ 42,000 Cr",
        status: "Pre-Execution",
        plannedCompletion: "Oct 2029",
        agency: "Sagarmala / MoPSW"
      },
      {
        id: "PRJ-CMRL-07",
        name: "Chennai Metro Rail Project (Phase-II, Corridors 3, 4, 5)",
        sector: "Urban Transit",
        outlay: "₹ 63,246 Cr",
        status: "Under Construction",
        plannedCompletion: "Jul 2027",
        agency: "CMRL / MoHUA"
      },
      {
        id: "PRJ-URJA-08",
        name: "Jagdishpur – Haldia & Bokaro-Dhamra Gas Pipeline",
        sector: "Petroleum & Gas",
        outlay: "₹ 12,940 Cr",
        status: "Near Completion",
        plannedCompletion: "Jan 2027",
        agency: "GAIL / MoPNG"
      }
    ];
  },

  /**
   * Fetches AI-generated risk and delay prediction for a specific project.
   *
   * @param {string} projectId - Unique identifier for the monitored project
   * @returns {Promise<Object>} Resolves to the defined JSON contract
   */
  async getProjectPrediction(projectId) {
    // =========================================================================
    // TODO: Replace mock with real model API call here
    // Example future integration:
    //
    // const response = await fetch(`/api/predict/${encodeURIComponent(projectId)}`);
    // if (!response.ok) {
    //   throw new Error(`Model inference failed with status ${response.status}`);
    // }
    // return await response.json();
    // =========================================================================

    // Simulate network and ML model inference latency (600ms)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Curated mock predictions matching the exact government infrastructure scenarios
    const MOCK_PREDICTIONS = {
      "PRJ-WDFC-01": {
        projectId: "PRJ-WDFC-01",
        riskScore: 68,
        riskLevel: "High",
        predictedDelayMonths: 8.5,
        confidence: 0.89,
        topFactors: [
          { factor: "Right of Way (RoW) Clearance Disputes in Urban Segments", impact: 0.38 },
          { factor: "Signaling Equipment Supply Chain Lead Times", impact: 0.27 },
          { factor: "Quarterly Fund Utilization Variance (-14%)", impact: 0.21 },
          { factor: "Sub-contractor Mobilization Lag", impact: 0.14 }
        ],
        riskTrend: [
          { month: "2026-03", score: 48 },
          { month: "2026-04", score: 52 },
          { month: "2026-05", score: 57 },
          { month: "2026-06", score: 61 },
          { month: "2026-07", score: 65 },
          { month: "2026-08", score: 68 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T05:30:00.000Z"
      },
      "PRJ-MAHSR-02": {
        projectId: "PRJ-MAHSR-02",
        riskScore: 82,
        riskLevel: "Critical",
        predictedDelayMonths: 14.0,
        confidence: 0.93,
        topFactors: [
          { factor: "Undersea Tunnel & Complex Geological Excavation Slippage", impact: 0.42 },
          { factor: "Rolling Stock Procurement & Technology Transfer Bilaterals", impact: 0.28 },
          { factor: "Environmental & Coastal Zone Clearance Re-assessments", impact: 0.18 },
          { factor: "Escalation in High-Grade Specialized Steel Import Costs", impact: 0.12 }
        ],
        riskTrend: [
          { month: "2026-03", score: 62 },
          { month: "2026-04", score: 66 },
          { month: "2026-05", score: 71 },
          { month: "2026-06", score: 76 },
          { month: "2026-07", score: 79 },
          { month: "2026-08", score: 82 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T06:15:00.000Z"
      },
      "PRJ-DME-03": {
        projectId: "PRJ-DME-03",
        riskScore: 42,
        riskLevel: "Medium",
        predictedDelayMonths: 3.5,
        confidence: 0.86,
        topFactors: [
          { factor: "Monsoon Inundation & Earthwork Stoppage in Central Plains", impact: 0.35 },
          { factor: "Fly Ash Sourcing & Inter-State Freight Constraints", impact: 0.28 },
          { factor: "Utility Relocation (High-Tension Transmission Lines)", impact: 0.22 },
          { factor: "Contractor Working Capital Liquidity Deficit", impact: 0.15 }
        ],
        riskTrend: [
          { month: "2026-03", score: 54 },
          { month: "2026-04", score: 51 },
          { month: "2026-05", score: 47 },
          { month: "2026-06", score: 46 },
          { month: "2026-07", score: 44 },
          { month: "2026-08", score: 42 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T04:45:00.000Z"
      },
      "PRJ-ZOJILA-04": {
        projectId: "PRJ-ZOJILA-04",
        riskScore: 88,
        riskLevel: "Critical",
        predictedDelayMonths: 18.2,
        confidence: 0.94,
        topFactors: [
          { factor: "Severe Alpine Avalanche Risk & Narrow Winter Construction Window", impact: 0.45 },
          { factor: "Geological Fault Line Strata Collapses & Water Ingress", impact: 0.31 },
          { factor: "Specialized Tunnel Boring Machinery Breakdowns & Spares Delay", impact: 0.16 },
          { factor: "High-Altitude Labor Attrition & Productivity Drops", impact: 0.08 }
        ],
        riskTrend: [
          { month: "2026-03", score: 72 },
          { month: "2026-04", score: 76 },
          { month: "2026-05", score: 80 },
          { month: "2026-06", score: 83 },
          { month: "2026-07", score: 86 },
          { month: "2026-08", score: 88 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T06:00:00.000Z"
      },
      "PRJ-DIBANG-05": {
        projectId: "PRJ-DIBANG-05",
        riskScore: 22,
        riskLevel: "Low",
        predictedDelayMonths: 1.0,
        confidence: 0.91,
        topFactors: [
          { factor: "Forest Diversion Compensatory Afforestation Audit", impact: 0.36 },
          { factor: "Heavy Equipment River-Bridge Transit Permissions", impact: 0.29 },
          { factor: "Turbine Casting Milestone Inspection Cycles", impact: 0.21 },
          { factor: "Local Community Employment Agreement Formalities", impact: 0.14 }
        ],
        riskTrend: [
          { month: "2026-03", score: 28 },
          { month: "2026-04", score: 26 },
          { month: "2026-05", score: 25 },
          { month: "2026-06", score: 24 },
          { month: "2026-07", score: 23 },
          { month: "2026-08", score: 22 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T03:30:00.000Z"
      },
      "PRJ-NICOBAR-06": {
        projectId: "PRJ-NICOBAR-06",
        riskScore: 74,
        riskLevel: "High",
        predictedDelayMonths: 11.5,
        confidence: 0.84,
        topFactors: [
          { factor: "Ecological Tribunal Review & Coral Translocation Compliance", impact: 0.46 },
          { factor: "Remote Island Logistics & Heavy Dredger Mobilization", impact: 0.28 },
          { factor: "Quarry Material & Armored Rock Shipping Capacity", impact: 0.16 },
          { factor: "Global Terminal Operator Concessionaire Negotiations", impact: 0.10 }
        ],
        riskTrend: [
          { month: "2026-03", score: 55 },
          { month: "2026-04", score: 60 },
          { month: "2026-05", score: 65 },
          { month: "2026-06", score: 69 },
          { month: "2026-07", score: 72 },
          { month: "2026-08", score: 74 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T05:00:00.000Z"
      },
      "PRJ-CMRL-07": {
        projectId: "PRJ-CMRL-07",
        riskScore: 46,
        riskLevel: "Medium",
        predictedDelayMonths: 4.2,
        confidence: 0.88,
        topFactors: [
          { factor: "Dense Urban Traffic Diversion Permissions", impact: 0.38 },
          { factor: "Subsurface Utility Clashes (Water Mains & Telecom Conduits)", impact: 0.29 },
          { factor: "Depot Land Acquisition Litigation in Peripheral Sectors", impact: 0.21 },
          { factor: "TBM Cutterhead Wear in Hard Rock Charnockite Strata", impact: 0.12 }
        ],
        riskTrend: [
          { month: "2026-03", score: 41 },
          { month: "2026-04", score: 43 },
          { month: "2026-05", score: 44 },
          { month: "2026-06", score: 45 },
          { month: "2026-07", score: 46 },
          { month: "2026-08", score: 46 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T06:10:00.000Z"
      },
      "PRJ-URJA-08": {
        projectId: "PRJ-URJA-08",
        riskScore: 16,
        riskLevel: "Low",
        predictedDelayMonths: 0.5,
        confidence: 0.95,
        topFactors: [
          { factor: "River Crossing Hydrostatic Pressure Testing Sign-offs", impact: 0.40 },
          { factor: "City Gas Distribution Tie-in Metering Station Works", impact: 0.30 },
          { factor: "Final Cathodic Protection Commissioning", impact: 0.18 },
          { factor: "Restoration of Agricultural RoW Parcels", impact: 0.12 }
        ],
        riskTrend: [
          { month: "2026-03", score: 32 },
          { month: "2026-04", score: 27 },
          { month: "2026-05", score: 23 },
          { month: "2026-06", score: 20 },
          { month: "2026-07", score: 18 },
          { month: "2026-08", score: 16 }
        ],
        modelVersion: "NIVARA-XGB-v2.4-GovRisk",
        lastUpdated: "2026-09-08T02:15:00.000Z"
      }
    };

    // If simulating an error test
    if (projectId === "ERROR_TEST") {
      throw new Error("Simulated prediction model error: Telemetry data unavailable.");
    }

    // Return exact mock if exists
    if (MOCK_PREDICTIONS[projectId]) {
      return JSON.parse(JSON.stringify(MOCK_PREDICTIONS[projectId]));
    }

    // Dynamic fallback matching the contract exactly for any unknown project ID
    return {
      projectId: String(projectId),
      riskScore: 55,
      riskLevel: "High",
      predictedDelayMonths: 6.0,
      confidence: 0.82,
      topFactors: [
        { factor: "Inter-departmental Statutory Clearance Backlogs", impact: 0.36 },
        { factor: "Quarterly Fund Release and Disbursal Lag", impact: 0.28 },
        { factor: "Raw Material Inflation and Supply Bottlenecks", impact: 0.22 },
        { factor: "Site Access and Land Handover Delays", impact: 0.14 }
      ],
      riskTrend: [
        { month: "2026-03", score: 45 },
        { month: "2026-04", score: 48 },
        { month: "2026-05", score: 50 },
        { month: "2026-06", score: 52 },
        { month: "2026-07", score: 54 },
        { month: "2026-08", score: 55 }
      ],
      modelVersion: "NIVARA-XGB-v2.4-GovRisk",
      lastUpdated: new Date().toISOString()
    };
  }
};

// Make available in browser global scope
if (typeof window !== "undefined") {
  window.PredictionAPI = PredictionAPI;
}

// Support CommonJS/module export if running in node/bundler
if (typeof module !== "undefined" && module.exports) {
  module.exports = PredictionAPI;
}
