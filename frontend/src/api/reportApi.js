/**
 * reportApi.js
 * API Service for Report Generation
 * Endpoint: POST /api/reports/generate
 */

import apiClient, { isMockMode } from './apiClient';
import { generateMockReport } from '../mock/reports';

export const reportApi = {
  generateReport: async (projectId, reportType = 'RISK_ASSESSMENT') => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 400));
      return generateMockReport(projectId, reportType);
    }
    return apiClient.post('/api/reports/generate', { projectId, reportType });
  }
};

export default reportApi;
