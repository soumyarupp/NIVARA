/**
 * mock/simulator.js
 * Mock data for Pre-Approval Risk Simulator and What-If Delay Impact Simulator (/api/simulator/*)
 */

export const simulateMockPreApproval = (data) => {
  const cost = parseFloat(data.estimatedCost || 2500);
  const duration = parseInt(data.projectDurationMonths || 36, 10);
  const state = data.state || "Odisha";

  let predictedDelayMonths = Math.round(duration * 0.22);
  let riskLevel = "MEDIUM";
  let majorRiskFactor = "Land Acquisition & Forest Clearances";

  if (cost > 2000) {
    riskLevel = "HIGH";
    predictedDelayMonths = Math.round(duration * 0.35);
    majorRiskFactor = "Environmental Clearances & Contractor Capacity";
  }

  return {
    success: true,
    prediction: {
      riskLevel,
      predictedDelayMonths,
      majorRiskFactor,
      historicalAverageDelayMonths: predictedDelayMonths + 6,
      recommendation: `Consider completing critical land and statutory clearances in ${state} before formal administrative approval.`
    }
  };
};

export const simulateMockDelayImpact = (data) => {
  const months = parseInt(data.additionalDelayMonths || 6, 10);
  const costPct = (months * 2.15).toFixed(1);
  const estimatedAdditionalCost = (months * 18.4).toFixed(2);

  const baseDate = new Date("2028-06-30");
  baseDate.setMonth(baseDate.getMonth() + months);

  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');

  let riskLevel = "LOW";
  if (months >= 8) riskLevel = "CRITICAL";
  else if (months >= 5) riskLevel = "HIGH";
  else if (months >= 2) riskLevel = "MEDIUM";

  return {
    success: true,
    simulation: {
      originalCompletionDate: "2028-06-30",
      newCompletionDate: `${yyyy}-${mm}-${dd}`,
      additionalCostPercentage: parseFloat(costPct),
      estimatedAdditionalCost: parseFloat(estimatedAdditionalCost),
      riskLevel
    }
  };
};
