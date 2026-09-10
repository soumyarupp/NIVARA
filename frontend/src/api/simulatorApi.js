import apiClient from './apiClient';

export const simulatorApi = {
  simulatePreApproval: async ({ sector, state, agency, estimatedCost, projectDurationMonths }) => {
    return apiClient.post('/api/simulator/pre-approval', {
      sector,
      state,
      agency,
      estimatedCost,
      projectDurationMonths
    });
  },

  simulateDelayImpact: async ({ projectId, additionalDelayMonths, costEscalationRate }) => {
    return apiClient.post('/api/simulator/delay-impact', {
      projectId,
      additionalDelayMonths,
      costEscalationRate
    });
  }
};

export default simulatorApi;
