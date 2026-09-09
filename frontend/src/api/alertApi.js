/**
 * alertApi.js
 * API Service for AI-Powered Early Warning & Alert System
 * Endpoints: GET /api/alerts, GET /api/alerts/:id, POST /api/alerts/:id/acknowledge, POST /api/alerts/generate
 */

import apiClient, { isMockMode } from './apiClient';
import { mockAlerts, generateMockAlert } from '../mock/alerts';

export const alertApi = {
  getAlerts: async () => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 250));
      return { success: true, alerts: mockAlerts };
    }
    return apiClient.get('/api/alerts');
  },

  getAlertById: async (id) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const alert = mockAlerts.find(a => a.id === id);
      return { success: !!alert, alert: alert || null };
    }
    return apiClient.get(`/api/alerts/${id}`);
  },

  acknowledgeAlert: async (id) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const alert = mockAlerts.find(a => a.id === id);
      if (alert) alert.acknowledged = true;
      return { success: true, message: `Alert ${id} acknowledged successfully.` };
    }
    return apiClient.post(`/api/alerts/${id}/acknowledge`);
  },

  generateAlert: async (projectId) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 400));
      return generateMockAlert(projectId);
    }
    return apiClient.post('/api/alerts/generate', { projectId });
  }
};

export default alertApi;
