/**
 * mock/delay.js
 * Mock data for NLP Delay Classifier API (/api/delay/classify)
 */

export const classifyMockDelayRemark = (remark) => {
  const text = (remark || "").toLowerCase();

  let category = "CLEARANCE_PENDING";
  let label = "Clearance Pending";
  let confidence = 0.94;

  if (text.includes("land") || text.includes("acquisition") || text.includes("court") || text.includes("litigation")) {
    category = "LAND_ACQUISITION_LITIGATION";
    label = "Land Acquisition / Litigation";
    confidence = 0.92;
  } else if (text.includes("fund") || text.includes("budget") || text.includes("disbursal") || text.includes("billing")) {
    category = "FUNDING_DISBURSAL_DEFICIT";
    label = "Funding & Disbursal Lag";
    confidence = 0.89;
  } else if (text.includes("contractor") || text.includes("labor") || text.includes("machinery") || text.includes("mobilization")) {
    category = "CONTRACTOR_MOBILIZATION";
    label = "Contractor Capacity & Mobilization";
    confidence = 0.91;
  } else if (text.includes("forest") || text.includes("environment") || text.includes("noc") || text.includes("wildlife")) {
    category = "STATUTORY_ENVIRONMENTAL_CLEARANCE";
    label = "Statutory & Environmental Clearance";
    confidence = 0.95;
  }

  return {
    success: true,
    classification: {
      category,
      label,
      confidence
    }
  };
};

export const classifyMockBatchRemarks = (remarksList) => {
  return {
    success: true,
    results: (remarksList || []).map(item => ({
      projectId: item.projectId || "P001",
      ...classifyMockDelayRemark(item.remark).classification
    }))
  };
};
