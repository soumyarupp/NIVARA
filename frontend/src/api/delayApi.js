import apiClient from './apiClient';

export const delayApi = {
  classifyRemark: async (projectId, remark) => {
    return apiClient.post('/api/delay/classify', { projectId, remark });
  },

  classifyBatchRemarks: async (remarksList) => {
    return apiClient.post('/api/delay/classify-batch', { remarks: remarksList });
  }
};

export default delayApi;
