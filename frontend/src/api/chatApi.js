import apiClient from './apiClient';

export const chatApi = {
  queryChatbot: async (query) => {
    return apiClient.post('/api/chat/query', { query });
  },
  sendMessage: async (query, options = {}) => {
    return apiClient.post('/api/chat/query', { query, ...options });
  }
};

export default chatApi;
