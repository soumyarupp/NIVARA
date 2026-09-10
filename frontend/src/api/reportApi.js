import apiClient from './apiClient';

export const reportApi = {
  getAllReports: async (params = {}) => {
    return apiClient.get('/api/reports', { params });
  },

  submitMonthlyReport: async (reportData) => {
    return apiClient.post('/api/reports', reportData);
  },

  generateReport: async (projectId, reportType = 'RISK_ASSESSMENT') => {
    return apiClient.post('/api/reports/generate', { projectId, reportType });
  },

  getProjectReports: async (projectId) => {
    return apiClient.get(`/api/reports/project/${projectId}`);
  },

  getReportById: async (id) => {
    return apiClient.get(`/api/reports/${id}`);
  }
};

export default reportApi;

