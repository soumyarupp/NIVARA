import { PreApproval } from '../models/PreApproval.js';

export async function simulatePreApprovalRisk({
  projectName = 'Proposed Project',
  sector = 'ROAD',
  state = 'National',
  agency = 'NHAI',
  estimatedCost = 500,
  landRequired = true,
  forestClearanceRequired = false,
  litigationRisk = 'LOW',
  userId = null
}) {
  let simulatedScore = 15;
  let predictedDelayMonths = 0;
  const recommendations = [];
  const riskFactors = [];

  if (['RAILWAYS', 'ROAD', 'MINING'].includes(sector.toUpperCase())) {
    simulatedScore += 10;
    predictedDelayMonths += 3;
  } else if (['URBAN_DEVELOPMENT', 'CIVIL_AVIATION'].includes(sector.toUpperCase())) {
    simulatedScore += 8;
    predictedDelayMonths += 2;
  }

  if (estimatedCost > 2000) {
    simulatedScore += 18;
    predictedDelayMonths += 6;
    riskFactors.push('Mega project scale (>₹2000 Cr)');
    recommendations.push('Establish a Dedicated Special Purpose Vehicle (SPV) with monthly inter-ministerial review.');
  } else if (estimatedCost > 500) {
    simulatedScore += 10;
    predictedDelayMonths += 3;
    riskFactors.push('Major project scale (>₹500 Cr)');
  }

  if (landRequired) {
    simulatedScore += 20;
    predictedDelayMonths += 8;
    riskFactors.push('Extensive Land Acquisition Required');
    recommendations.push('Ensure Section 3A/3D notifications are gazetted prior to awarding major civil works.');
  }

  if (forestClearanceRequired) {
    simulatedScore += 22;
    predictedDelayMonths += 10;
    riskFactors.push('Stage-1/Stage-2 Forest Clearance Mandated');
    recommendations.push('Initiate compensatory afforestation land identification and MoEF&CC consultation immediately.');
  }

  if (litigationRisk === 'HIGH') {
    simulatedScore += 20;
    predictedDelayMonths += 6;
    riskFactors.push('High Historical Right-of-Way / Contractor Litigation in State');
    recommendations.push('Deploy robust dispute resolution mechanism and advance stakeholder hearings.');
  } else if (litigationRisk === 'MEDIUM') {
    simulatedScore += 10;
    predictedDelayMonths += 3;
  }

  const finalScore = Math.min(95, Math.max(10, simulatedScore));
  let riskLevel = 'LOW';
  if (finalScore >= 75) riskLevel = 'CRITICAL';
  else if (finalScore >= 55) riskLevel = 'HIGH';
  else if (finalScore >= 35) riskLevel = 'MEDIUM';

  const majorRiskFactor = riskFactors.length > 0 ? riskFactors[0] : 'Normal Project Execution Factors';

  if (recommendations.length === 0) {
    recommendations.push('Standard PM Gati Shakti coordination and quarterly milestone tracking.');
  }

  const record = await PreApproval.create({
    projectName,
    sector,
    state,
    agency,
    estimatedCost,
    landRequired,
    forestClearanceRequired,
    litigationRisk,
    simulatedRiskScore: finalScore,
    simulatedRiskLevel: riskLevel,
    predictedDelayMonths,
    majorRiskFactor,
    recommendations,
    createdBy: userId
  });

  return {
    simulationId: record._id,
    projectName,
    riskScore: finalScore,
    riskLevel,
    predictedDelayMonths,
    majorRiskFactor,
    recommendations,
    evaluatedFactors: riskFactors
  };
}
