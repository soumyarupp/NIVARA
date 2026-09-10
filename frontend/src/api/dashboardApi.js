import apiClient from './apiClient';

export const dashboardApi = {
  getOverview: async () => {
    return apiClient.get('/api/dashboard/overview');
  },

  getSummary: async () => {
    return apiClient.get('/api/dashboard/summary');
  },

  getRiskDistribution: async () => {
    return apiClient.get('/api/dashboard/risk-distribution');
  },

  getDelayReasons: async () => {
    return apiClient.get('/api/dashboard/delay-reasons');
  },

  getStateSummary: async () => {
    return apiClient.get('/api/dashboard/state-summary');
  },

  getSectorSummary: async () => {
    return apiClient.get('/api/dashboard/sector-summary');
  },

  getMinistrySummary: async () => {
    return apiClient.get('/api/dashboard/ministry-summary');
  }
};

export default dashboardApi;
