import apiClient from './apiClient';

export const mismatchApi = {
  detectMismatch: async ({ projectId, totalBudget, expenditure, physicalProgress, plannedPhysicalProgress }) => {
    return apiClient.post('/api/risk/mismatch', {
      projectId,
      totalBudget,
      expenditure,
      physicalProgress,
      plannedPhysicalProgress
    });
  }
};

export default mismatchApi;
