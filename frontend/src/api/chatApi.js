/**
 * chatApi.js
 * API Service for Interactive Dashboard AI Chatbot
 * Endpoint: POST /api/chat/query
 */

import apiClient, { isMockMode } from './apiClient';
import { processMockChatQuery } from '../mock/chat';

export const chatApi = {
  queryChatbot: async (query) => {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 600));
      return processMockChatQuery(query);
    }
    return apiClient.post('/api/chat/query', { query });
  }
};

export default chatApi;
