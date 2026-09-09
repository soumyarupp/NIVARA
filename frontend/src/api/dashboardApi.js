/**
 * dashboardApi.js
 * API Service for Dashboard Overview
 * Endpoint: GET /api/dashboard/overview
 */

import apiClient, { isMockMode } from './apiClient';
import { mockDashboardOverview } from '../mock/dashboard';

export const dashboardApi = {
  getOverview: async () => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      return mockDashboardOverview;
    }
    return apiClient.get('/api/dashboard/overview');
  }
};

export default dashboardApi;
