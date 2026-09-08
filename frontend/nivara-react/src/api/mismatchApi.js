/**
 * mismatchApi.js
 * API Service for Fund vs Physical Progress Mismatch Detector
 * Endpoint: POST /api/risk/mismatch
 */

import apiClient, { isMockMode } from './apiClient';
import { analyzeMockMismatch } from '../mock/mismatch';

export const mismatchApi = {
  detectMismatch: async ({ projectId, totalBudget, expenditure, physicalProgress }) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 350));
      return analyzeMockMismatch({ projectId, totalBudget, expenditure, physicalProgress });
    }
    return apiClient.post('/api/risk/mismatch', {
      projectId,
      totalBudget,
      expenditure,
      physicalProgress
    });
  }
};

export default mismatchApi;
