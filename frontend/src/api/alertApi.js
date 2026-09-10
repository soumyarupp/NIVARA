import apiClient from './apiClient';

export const alertApi = {
  getAlerts: async () => {
    const res = await apiClient.get('/api/alerts');
    const alertsList = Array.isArray(res) ? res : (res?.data || res?.alerts || []);
    return { success: true, alerts: alertsList, data: alertsList };
  },

  getAlertById: async (id) => {
    const res = await apiClient.get(`/api/alerts/${id}`);
    const alert = res?.data || res?.alert || res;
    return { success: true, alert };
  },

  acknowledgeAlert: async (id) => {
    return apiClient.post(`/api/alerts/${id}/acknowledge`);
  },

  generateAlert: async (projectId) => {
    return apiClient.post('/api/alerts/generate', { projectId });
  }
};

export default alertApi;
