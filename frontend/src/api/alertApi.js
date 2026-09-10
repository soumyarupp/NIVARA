import apiClient from './apiClient';

export const alertApi = {
  getAlerts: async (params = {}) => {
    const res = await apiClient.get('/api/alerts', params);
    const alertsList = Array.isArray(res) ? res : (res?.data || res?.alerts || []);
    return { success: true, alerts: alertsList, data: alertsList };
  },

  getAlertById: async (id) => {
    const res = await apiClient.get(`/api/alerts/${id}`);
    const alert = res?.data || res?.alert || res;
    return { success: true, alert };
  },

  acknowledgeAlert: async (id) => {
    return apiClient.patch(`/api/alerts/${id}/acknowledge`);
  },

  resolveAlert: async (id, resolutionRemarks = '') => {
    return apiClient.patch(`/api/alerts/${id}/resolve`, { resolutionRemarks });
  },

  generateAlert: async (projectId) => {
    return apiClient.post('/api/alerts/generate', { projectId });
  }
};

export default alertApi;
