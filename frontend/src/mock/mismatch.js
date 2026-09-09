/**
 * mock/mismatch.js
 * Mock data for Fund vs Physical Progress Mismatch API (/api/risk/mismatch)
 */

export const analyzeMockMismatch = (data) => {
  const totalBudget = parseFloat(data.totalBudget || 800);
  const expenditure = parseFloat(data.expenditure || 680);
  const physicalProgress = parseFloat(data.physicalProgress || 40);

  const expPct = Math.round((expenditure / (totalBudget || 1)) * 100);
  const mismatch = Math.max(0, expPct - physicalProgress);

  let riskLevel = "LOW";
  let flagged = false;

  if (mismatch >= 30) {
    riskLevel = "HIGH";
    flagged = true;
  } else if (mismatch >= 15) {
    riskLevel = "MEDIUM";
    flagged = true;
  }

  return {
    success: true,
    analysis: {
      expenditurePercentage: expPct,
      physicalProgressPercentage: physicalProgress,
      mismatchPercentage: mismatch,
      riskLevel,
      flagged,
      reason: `${expPct}% of funds have been utilized while physical progress is only ${physicalProgress}%.`,
      recommendation: "Recommend project review and physical site audit by nodal technical team."
    }
  };
};
