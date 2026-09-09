/**
 * NIVARA Official MoSPI/IPMD Financial & Progress Calculation Utilities
 */

/**
 * Calculates financial progress percentage.
 * Formula: (expenditure / originalProjectCost) * 100
 * @param {number} expenditure - Total actual expenditure in INR Crores
 * @param {number} originalProjectCost - Original sanctioned cost in INR Crores
 * @returns {number} Financial progress percentage (rounded to 2 decimal places)
 */
export function calculateFinancialProgress(expenditure = 0, originalProjectCost = 0) {
  const exp = Number(expenditure) || 0;
  const orig = Number(originalProjectCost) || 0;

  if (orig <= 0) return 0;
  if (exp <= 0) return 0;

  const progress = (exp / orig) * 100;
  return Math.max(0, Math.round(progress * 100) / 100);
}

/**
 * Calculates physical progress gap.
 * Formula: plannedPhysicalProgress - actualPhysicalProgress
 * @param {number} planned
 * @param {number} actual
 * @returns {number} Progress gap (percentage points)
 */
export function calculateProgressGap(planned = 0, actual = 0) {
  const p = Number(planned) || 0;
  const a = Number(actual) || 0;
  const gap = p - a;
  return Math.round(gap * 100) / 100;
}

/**
 * Calculates Time Overrun according to MoSPI/IPMD methodology.
 *
 * For ongoing projects:
 *   - If revised completion date has not lapsed: revised - original
 *   - If revised completion date has lapsed: current date - original (and current - revised)
 * For completed projects:
 *   - actual - original, and actual - revised
 *
 * @param {Object} project
 * @returns {Object} { timeOverrunMonths, timeOverrunDays, isOverdue, methodology }
 */
export function calculateTimeOverrun(project) {
  const now = new Date();
  const originalDate = project.originalCompletionDate ? new Date(project.originalCompletionDate) : null;
  const revisedDate = project.revisedCompletionDate ? new Date(project.revisedCompletionDate) : null;
  const actualDate = project.actualCompletionDate ? new Date(project.actualCompletionDate) : null;
  const isCompleted = project.projectStatus === 'COMPLETED' || !!actualDate;

  if (!originalDate) {
    return {
      timeOverrunMonths: 0,
      timeOverrunDays: 0,
      isOverdue: false,
      overrunRelativeToOriginal: 0,
      overrunRelativeToRevised: 0,
      methodology: 'No original completion date available'
    };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const msPerMonth = msPerDay * 30.4375;

  if (isCompleted) {
    const end = actualDate || now;
    const diffOrigDays = Math.round((end - originalDate) / msPerDay);
    const diffRevDays = revisedDate ? Math.round((end - revisedDate) / msPerDay) : diffOrigDays;

    return {
      timeOverrunMonths: Math.max(0, Math.round((diffOrigDays / 30.4375) * 10) / 10),
      timeOverrunDays: Math.max(0, diffOrigDays),
      overrunRelativeToOriginal: Math.max(0, diffOrigDays),
      overrunRelativeToRevised: Math.max(0, diffRevDays),
      isOverdue: diffOrigDays > 0,
      status: 'COMPLETED',
      methodology: 'Actual completion date minus original & revised completion dates'
    };
  }

  // Ongoing project
  if (revisedDate && revisedDate > now) {
    // Revised date has not lapsed yet
    const diffOrigDays = Math.round((revisedDate - originalDate) / msPerDay);
    return {
      timeOverrunMonths: Math.max(0, Math.round((diffOrigDays / 30.4375) * 10) / 10),
      timeOverrunDays: Math.max(0, diffOrigDays),
      overrunRelativeToOriginal: Math.max(0, diffOrigDays),
      overrunRelativeToRevised: 0,
      isOverdue: diffOrigDays > 0,
      status: 'ONGOING_REVISED_ACTIVE',
      methodology: 'Revised completion date minus original completion date'
    };
  } else {
    // Either revised date has lapsed or no revised date exists
    const compareTarget = revisedDate || originalDate;
    const diffTargetDays = Math.round((now - compareTarget) / msPerDay);
    const diffOrigDays = Math.round((now - originalDate) / msPerDay);

    return {
      timeOverrunMonths: Math.max(0, Math.round((diffOrigDays / 30.4375) * 10) / 10),
      timeOverrunDays: Math.max(0, diffOrigDays),
      overrunRelativeToOriginal: Math.max(0, diffOrigDays),
      overrunRelativeToRevised: revisedDate ? Math.max(0, diffTargetDays) : Math.max(0, diffOrigDays),
      isOverdue: diffOrigDays > 0,
      status: 'ONGOING_DELAYED',
      methodology: 'Current date minus original & revised completion dates'
    };
  }
}

/**
 * Calculates Cost Overrun according to MoSPI methodology.
 *
 * @param {Object} project
 * @param {number} latestExpenditure
 * @returns {Object} { costOverrunOriginal, costOverrunPercentageOriginal, costOverrunRevised, costOverrunPercentageRevised }
 */
export function calculateCostOverrun(project, latestExpenditure = 0) {
  const originalCost = Number(project.originalProjectCost) || 0;
  const revisedCost = Number(project.revisedProjectCost) || originalCost;
  const expenditure = Number(latestExpenditure || project.expenditure || project.totalActualExpenditure || 0);

  // Projected or actual final cost
  const effectiveCost = Math.max(revisedCost, expenditure);

  const overrunOriginal = originalCost > 0 ? Math.max(0, effectiveCost - originalCost) : 0;
  const percentageOriginal = originalCost > 0 ? (overrunOriginal / originalCost) * 100 : 0;

  const overrunRevised = revisedCost > 0 ? Math.max(0, expenditure - revisedCost) : 0;
  const percentageRevised = revisedCost > 0 ? (overrunRevised / revisedCost) * 100 : 0;

  return {
    costOverrunOriginal: Math.round(overrunOriginal * 100) / 100,
    costOverrunPercentageOriginal: Math.round(percentageOriginal * 100) / 100,
    costOverrunRevised: Math.round(overrunRevised * 100) / 100,
    costOverrunPercentageRevised: Math.round(percentageRevised * 100) / 100,
    isCostOverrun: overrunOriginal > 0
  };
}
