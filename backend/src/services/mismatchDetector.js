/**
 * NIVARA Fund vs Physical Progress Mismatch Detector
 */

const THRESHOLDS = {
  HIGH: 30, // Difference > 30%
  MEDIUM: 15, // Difference > 15%
  LOW: 5 // Difference > 5%
};

/**
 * Detects whether fund utilization outpaces physical milestones.
 * @param {number} financialProgress
 * @param {number} physicalProgress
 * @returns {Object} { mismatch, difference, severity, message }
 */
export function detectProgressMismatch(financialProgress = 0, physicalProgress = 0) {
  const fin = Number(financialProgress) || 0;
  const phy = Number(physicalProgress) || 0;
  const diff = Math.round((fin - phy) * 100) / 100;

  if (diff <= THRESHOLDS.LOW) {
    return {
      mismatch: false,
      difference: Math.max(0, diff),
      severity: 'NONE',
      message: 'Financial expenditure is aligned with physical progress.'
    };
  }

  let severity = 'LOW';
  if (diff >= THRESHOLDS.HIGH) {
    severity = 'HIGH';
  } else if (diff >= THRESHOLDS.MEDIUM) {
    severity = 'MEDIUM';
  }

  const message =
    severity === 'HIGH'
      ? `Significant fund-progress mismatch detected. Financial expenditure (${fin}%) outpaces physical progress (${phy}%) by ${diff}%. On-site physical verification and audit review recommended.`
      : `Moderate fund-progress variance detected. Financial expenditure (${fin}%) leads physical progress (${phy}%) by ${diff}%. Progress review recommended.`;

  return {
    mismatch: true,
    difference: diff,
    severity,
    message
  };
}
