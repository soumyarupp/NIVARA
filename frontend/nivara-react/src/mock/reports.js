/**
 * mock/reports.js
 * Mock data for Report Generation API (/api/reports/generate)
 */

export const generateMockReport = (projectId, reportType) => {
  return {
    success: true,
    reportId: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    projectId: projectId || "NH27-BR-001",
    reportType: reportType || "RISK_ASSESSMENT",
    status: "GENERATED",
    downloadUrl: null,
    message: "Report generation API ready — backend integration pending."
  };
};
