/**
 * delayApi.js
 * API Service for NLP-Based Delay Reason Classifier
 * Endpoints: POST /api/delay/classify, POST /api/delay/classify-batch
 */

import apiClient, { isMockMode } from './apiClient';
import { classifyMockDelayRemark, classifyMockBatchRemarks } from '../mock/delay';

export const delayApi = {
  classifyRemark: async (projectId, remark) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 450));
      return {
        projectId,
        ...classifyMockDelayRemark(remark)
      };
    }
    return apiClient.post('/api/delay/classify', { projectId, remark });
  },

  classifyBatchRemarks: async (remarksList) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 700));
      return classifyMockBatchRemarks(remarksList);
    }
    return apiClient.post('/api/delay/classify-batch', { remarks: remarksList });
  }
};

export default delayApi;
