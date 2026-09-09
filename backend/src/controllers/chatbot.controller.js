import { executeChatbotQuery } from '../services/chatbot.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function processChatbotQuery(req, res) {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return sendError(res, 'A valid query string is required.', [], 400);
    }

    const result = await executeChatbotQuery(query);
    return sendSuccess(res, 'Query processed successfully.', result);
  } catch (err) {
    return sendError(res, err.message || 'Failed to process chatbot query.', [], 500);
  }
}
