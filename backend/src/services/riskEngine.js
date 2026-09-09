/**
 * NIVARA Explainable Multi-Factor Project Risk Engine
 */

import { calculateProgressGap, calculateTimeOverrun, calculateCostOverrun } from '../utils/calculations.js';

export function calculateProjectRisk({
  project = {},
  financialProgress = 0,
  physicalProgress = 0,
  plannedPhysicalProgress = 0,
  daysSinceLastReport = 0,
  pendingClearancesCount = 0,
  remainingLandPercentage = 0
}) {
  const factors = [];

  // 1. Physical Progress Gap (Weight: 25%)
  const gap = calculateProgressGap(plannedPhysicalProgress, physicalProgress);
  let gapScore = 0;
  if (gap > 25) gapScore = 100;
  else if (gap >= 15) gapScore = 80;
  else if (gap >= 10) gapScore = 60;
  else if (gap > 0) gapScore = 30;
  const gapContrib = gapScore * 0.25;
  factors.push({
    factor: 'PHYSICAL_PROGRESS_GAP',
    name: 'Physical Progress Lag',
    rawScore: gapScore,
    weight: 0.25,
    contribution: Math.round(gapContrib * 10) / 10,
    description:
      gap > 0
        ? `Physical progress lags planned milestone by ${gap}%.`
        : 'Physical progress is on track with planned timeline.'
  });

  // 2. Financial vs Physical Progress Mismatch (Weight: 35%)
  const mismatchDiff = Math.max(0, financialProgress - physicalProgress);
  let mismatchScore = 0;
  if (mismatchDiff > 35) mismatchScore = 100;
  else if (mismatchDiff > 20) mismatchScore = 80;
  else if (mismatchDiff > 10) mismatchScore = 50;
  else if (mismatchDiff > 5) mismatchScore = 25;
  const mismatchContrib = mismatchScore * 0.35;
  factors.push({
    factor: 'FUND_PHYSICAL_MISMATCH',
    name: 'Fund vs Physical Mismatch',
    rawScore: mismatchScore,
    weight: 0.35,
    contribution: Math.round(mismatchContrib * 10) / 10,
    description:
      mismatchDiff > 5
        ? `Expenditure percentage (${financialProgress}%) outpaces physical progress (${physicalProgress}%) by ${mismatchDiff}%.`
        : 'Fund utilization matches physical progress.'
  });

  // 3. Reporting Latency / Inactivity (Weight: 5%)
  let reportingScore = 0;
  if (daysSinceLastReport >= 90) reportingScore = 100;
  else if (daysSinceLastReport >= 60) reportingScore = 70;
  else if (daysSinceLastReport >= 30) reportingScore = 40;
  else reportingScore = 0;
  const reportingContrib = reportingScore * 0.05;
  factors.push({
    factor: 'REPORTING_DELAY',
    name: 'Reporting Latency',
    rawScore: reportingScore,
    weight: 0.05,
    contribution: Math.round(reportingContrib * 10) / 10,
    description:
      daysSinceLastReport >= 90
        ? `Critical reporting delay: ${daysSinceLastReport} days since last monthly report submission.`
        : daysSinceLastReport >= 30
        ? `Monthly report overdue by ${daysSinceLastReport} days.`
        : 'Monthly progress reports are up-to-date.'
  });

  // 4. Time Overrun (Weight: 10%)
  const timeOverrun = calculateTimeOverrun(project);
  let timeScore = 0;
  if (timeOverrun.timeOverrunMonths > 24) timeScore = 100;
  else if (timeOverrun.timeOverrunMonths > 12) timeScore = 75;
  else if (timeOverrun.timeOverrunMonths > 6) timeScore = 50;
  else if (timeOverrun.timeOverrunMonths > 0) timeScore = 25;
  const timeContrib = timeScore * 0.10;
  factors.push({
    factor: 'TIME_OVERRUN',
    name: 'Time Overrun',
    rawScore: timeScore,
    weight: 0.10,
    contribution: Math.round(timeContrib * 10) / 10,
    description:
      timeOverrun.timeOverrunMonths > 0
        ? `Estimated time overrun of ${timeOverrun.timeOverrunMonths} months (${timeOverrun.timeOverrunDays} days).`
        : 'Project is progressing within approved schedule.'
  });

  // 5. Cost Overrun (Weight: 5%)
  const costOverrun = calculateCostOverrun(project, project.expenditure || 0);
  let costScore = 0;
  if (costOverrun.costOverrunPercentageOriginal > 30) costScore = 100;
  else if (costOverrun.costOverrunPercentageOriginal > 15) costScore = 70;
  else if (costOverrun.costOverrunPercentageOriginal > 5) costScore = 40;
  const costContrib = costScore * 0.05;
  factors.push({
    factor: 'COST_OVERRUN',
    name: 'Cost Overrun',
    rawScore: costScore,
    weight: 0.05,
    contribution: Math.round(costContrib * 10) / 10,
    description:
      costOverrun.costOverrunPercentageOriginal > 0
        ? `Cost escalation of ₹${costOverrun.costOverrunOriginal} Cr (${costOverrun.costOverrunPercentageOriginal}% over original sanction).`
        : 'Expenditure is within sanctioned cost limit.'
  });

  // 6. Critical Clearances Pending (Weight: 10%)
  let clearanceScore = 0;
  if (pendingClearancesCount >= 3) clearanceScore = 100;
  else if (pendingClearancesCount === 2) clearanceScore = 80;
  else if (pendingClearancesCount === 1) clearanceScore = 60;
  const clearanceContrib = clearanceScore * 0.10;
  factors.push({
    factor: 'CLEARANCE_DELAY',
    name: 'Pending Clearances',
    rawScore: clearanceScore,
    weight: 0.10,
    contribution: Math.round(clearanceContrib * 10) / 10,
    description:
      pendingClearancesCount > 0
        ? `${pendingClearancesCount} statutory/regulatory clearance(s) pending approval.`
        : 'All required statutory clearances are in place.'
  });

  // 7. Land Acquisition Delays (Weight: 10%)
  let landScore = 0;
  if (remainingLandPercentage > 50) landScore = 100;
  else if (remainingLandPercentage > 15) landScore = 70;
  else if (remainingLandPercentage > 0) landScore = 40;
  const landContrib = landScore * 0.10;
  factors.push({
    factor: 'LAND_ACQUISITION',
    name: 'Land Possession',
    rawScore: landScore,
    weight: 0.10,
    contribution: Math.round(landContrib * 10) / 10,
    description:
      remainingLandPercentage > 0
        ? `${remainingLandPercentage}% of project land acquisition is pending.`
        : '100% land possession acquired.'
  });

  const totalScore =
    gapContrib +
    mismatchContrib +
    reportingContrib +
    timeContrib +
    costContrib +
    clearanceContrib +
    landContrib;

  const roundedScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  let riskLevel = 'LOW';
  if (roundedScore >= 80) {
    riskLevel = 'CRITICAL';
  } else if (roundedScore >= 60) {
    riskLevel = 'HIGH';
  } else if (roundedScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskScore: roundedScore,
    riskLevel,
    factors
  };
}
