/**
 * simulatorApi.js
 * API Service for Pre-Approval Risk Simulator and What-If Delay Impact Simulator
 * Endpoints: POST /api/simulator/pre-approval, POST /api/simulator/delay-impact
 */

import apiClient, { isMockMode } from './apiClient';
import { simulateMockPreApproval, simulateMockDelayImpact } from '../mock/simulator';

export const simulatorApi = {
  simulatePreApproval: async ({ sector, state, agency, estimatedCost, projectDurationMonths }) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 450));
      return simulateMockPreApproval({ sector, state, agency, estimatedCost, projectDurationMonths });
    }
    return apiClient.post('/api/simulator/pre-approval', {
      sector,
      state,
      agency,
      estimatedCost,
      projectDurationMonths
    });
  },

  simulateDelayImpact: async ({ projectId, additionalDelayMonths }) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      return simulateMockDelayImpact({ projectId, additionalDelayMonths });
    }
    return apiClient.post('/api/simulator/delay-impact', {
      projectId,
      additionalDelayMonths
    });
  }
};

export default simulatorApi;
