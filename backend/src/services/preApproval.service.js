import { PreApproval } from '../models/PreApproval.js';
import { Project } from '../models/Project.js';
import { MonthlyReport } from '../models/MonthlyReport.js';

/**
 * Data-Driven Pre-Approval Risk Simulation Engine
 * Computes risk scores, delay forecasts, and mitigation strategies
 * dynamically based on real historical project telemetry in MongoDB.
 */
export async function simulatePreApprovalRisk({
  projectName = 'Proposed Project',
  sector = 'Road Transport & Highways',
  state = 'National',
  agency = 'NHAI',
  estimatedCost = 500,
  landRequired = true,
  forestClearanceRequired = false,
  litigationRisk = 'LOW',
  userId = null
}) {
  // 1. Build sector & state search patterns
  const sectorClean = sector.replace(/[\(\)]/g, '').trim();
  const sectorRegex = new RegExp(sectorClean.replace(/&/g, '.*').split(/\s+/).join('.*'), 'i');

  // 2. Query historical projects from MongoDB
  const [sectorProjects, delayStats, allProjectCount] = await Promise.all([
    Project.find({
      $or: [
        { sector: { $regex: sectorRegex } },
        { projectName: { $regex: sectorRegex } }
      ]
    }).select('riskScore delayDays delayMonths originalProjectCost revisedProjectCost state riskLevel').lean(),
    MonthlyReport.aggregate([
      {
        $group: {
          _id: '$delayReasonCategory',
          count: { $sum: 1 },
          avgDelayDays: { $avg: '$delayDays' }
        }
      }
    ]),
    Project.countDocuments()
  ]);

  // Fallback to broader database sample if sector is newly introduced
  const dataset = sectorProjects.length > 0 ? sectorProjects : await Project.find().limit(200).select('riskScore delayDays delayMonths originalProjectCost revisedProjectCost state riskLevel').lean();
  
  // 3. Compute empirical baseline metrics from real database records
  const totalSimilar = dataset.length;
  const avgDbRiskScore = dataset.reduce((acc, p) => acc + (Number(p.riskScore) || 30), 0) / (totalSimilar || 1);
  const avgDbDelayDays = dataset.reduce((acc, p) => acc + (Number(p.delayDays) || 0), 0) / (totalSimilar || 1);
  const avgDbCost = dataset.reduce((acc, p) => acc + (Number(p.originalProjectCost) || 500), 0) / (totalSimilar || 1);
  const criticalCount = dataset.filter(p => ['CRITICAL', 'HIGH'].includes((p.riskLevel || '').toUpperCase())).length;
  const historicalHighRiskRatio = totalSimilar > 0 ? (criticalCount / totalSimilar) : 0.33;

  // Real cost overrun rate in this sector from DB
  const overrunProjects = dataset.filter(p => (p.revisedProjectCost || 0) > (p.originalProjectCost || 0));
  const avgOverrunRate = overrunProjects.length > 0 
    ? overrunProjects.reduce((acc, p) => acc + ((p.revisedProjectCost - p.originalProjectCost) / (p.originalProjectCost || 1)), 0) / overrunProjects.length
    : 0.12;

  // 4. Dynamic Risk Weighting based on empirical data
  let simulatedScore = Math.round(avgDbRiskScore * 0.55); // 55% weighted by real sector performance in DB
  let predictedDelayMonths = Math.max(1, Math.round(avgDbDelayDays / 30));
  const recommendations = [];
  const riskFactors = [];

  // Factor: Sector empirical risk weight
  if (historicalHighRiskRatio > 0.40) {
    simulatedScore += 8;
    riskFactors.push(`Sector High-Risk Prevalence (${Math.round(historicalHighRiskRatio * 100)}% of sector projects currently in High/Critical state in database)`);
  }

  // Factor: Project Scale vs Database Median
  const costNumber = Number(estimatedCost) || 500;
  if (costNumber > avgDbCost * 2 || costNumber > 2500) {
    const scaleOverhead = Math.min(18, Math.round((costNumber / (avgDbCost || 1000)) * 5));
    simulatedScore += scaleOverhead;
    predictedDelayMonths += 6;
    riskFactors.push(`Mega Capital Outlay (₹${costNumber.toLocaleString('en-IN')} Cr is ${Math.round(costNumber / (avgDbCost || 1))}x the sector average)`);
    recommendations.push('Establish a Dedicated Project Implementation Unit (PIU) with monthly inter-ministerial empowered review.');
  } else if (costNumber > avgDbCost) {
    simulatedScore += 6;
    predictedDelayMonths += 3;
    riskFactors.push(`Above-Average Capital Outlay (₹${costNumber.toLocaleString('en-IN')} Cr)`);
  }

  // Factor: Land Acquisition Friction
  if (landRequired) {
    const landDelayStat = delayStats.find(d => d._id === 'LAND_ACQUISITION');
    const landAvgMonths = landDelayStat ? Math.round(landDelayStat.avgDelayDays / 30) : 6;
    simulatedScore += 16;
    predictedDelayMonths += landAvgMonths;
    riskFactors.push(`Land Acquisition & Right-of-Way (Historical DB benchmark: ~${landAvgMonths} months state acquisition lead time)`);
    recommendations.push('Execute Section 3A/3D notification milestones and advance compensation disbursements before civil contract award.');
  }

  // Factor: Forest & Environmental Clearance
  if (forestClearanceRequired) {
    const forestStat = delayStats.find(d => d._id === 'FOREST_CLEARANCE');
    const forestAvgMonths = forestStat ? Math.round(forestStat.avgDelayDays / 30) : 7;
    simulatedScore += 18;
    predictedDelayMonths += forestAvgMonths;
    riskFactors.push(`Stage-I / Stage-II Forest Clearance Mandated (Historical DB benchmark: ~${forestAvgMonths} months MoEF&CC review duration)`);
    recommendations.push('Identify non-forest land for compensatory afforestation in PARIVESH portal simultaneously during DPR finalization.');
  }

  // Factor: State Historical Friction
  const stateProjects = state && state !== 'National' 
    ? dataset.filter(p => new RegExp(state, 'i').test(p.state || ''))
    : [];
  if (stateProjects.length > 0) {
    const stateHighRiskCount = stateProjects.filter(p => ['CRITICAL', 'HIGH'].includes((p.riskLevel || '').toUpperCase())).length;
    const stateRiskRatio = stateHighRiskCount / stateProjects.length;
    if (stateRiskRatio > 0.45) {
      simulatedScore += 10;
      predictedDelayMonths += 4;
      riskFactors.push(`State Corridor Execution Lag (${state} state cluster has ${Math.round(stateRiskRatio * 100)}% critical project ratio)`);
      recommendations.push(`Appoint a State Nodal Officer for dedicated inter-departmental utility shifting and RoW clearance in ${state}.`);
    }
  }

  // Factor: Litigation & Complex Utility Shifting
  if (litigationRisk === 'HIGH') {
    simulatedScore += 12;
    predictedDelayMonths += 4;
    riskFactors.push('Elevated Utility Shifting & Legal Dispute Exposure');
    recommendations.push('Deploy pre-construction ground-penetrating radar (GPR) utility surveys to avoid mid-execution contractor dispute claims.');
  } else if (litigationRisk === 'MEDIUM') {
    simulatedScore += 6;
    predictedDelayMonths += 2;
  }

  // 5. Final Calibrated Score & Level
  const finalScore = Math.min(95, Math.max(12, simulatedScore));
  let riskLevel = 'LOW';
  if (finalScore >= 70) riskLevel = 'CRITICAL';
  else if (finalScore >= 50) riskLevel = 'HIGH';
  else if (finalScore >= 30) riskLevel = 'MEDIUM';

  const majorRiskFactor = riskFactors.length > 0 ? riskFactors[0] : 'Standard Sector Telemetry Baseline';

  if (recommendations.length === 0) {
    recommendations.push('Maintain standard monthly flash report cadence and PM Gati Shakti GIS multi-modal alignment.');
  }

  // 6. Persist Simulation in MongoDB
  const record = await PreApproval.create({
    projectName,
    sector,
    state,
    agency,
    estimatedCost: costNumber,
    landRequired: Boolean(landRequired),
    forestClearanceRequired: Boolean(forestClearanceRequired),
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
    evaluatedFactors: riskFactors,
    empiricalBenchmarks: {
      similarProjectsAnalyzed: totalSimilar,
      totalRepositoryProjects: allProjectCount,
      sectorAvgRiskScore: Math.round(avgDbRiskScore),
      sectorAvgDelayMonths: Math.round(avgDbDelayDays / 30),
      historicalCostOverrunRate: `${(avgOverrunRate * 100).toFixed(1)}%`
    }
  };
}

