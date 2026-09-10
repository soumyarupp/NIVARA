import { Router } from 'express';
import { classifyDelayReason } from '../services/delayClassifier.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authenticate);

router.post('/classify', async (req, res) => {
  try {
    const { projectId, remark = '' } = req.body;
    const result = await classifyDelayReason(remark);
    return sendSuccess(res, 'Delay reason classified successfully.', {
      projectId,
      ...result
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to classify delay reason.', [], 500);
  }
});

router.post('/classify-batch', async (req, res) => {
  try {
    const { remarks = [] } = req.body;
    const results = await Promise.all(
      remarks.map(async (r) => {
        const text = typeof r === 'string' ? r : (r.text || r.remark || '');
        const classification = await classifyDelayReason(text);
        return {
          id: r.id || undefined,
          text,
          ...classification
        };
      })
    );
    return sendSuccess(res, 'Batch delay remarks classified successfully.', results);
  } catch (err) {
    return sendError(res, err.message || 'Failed to classify batch remarks.', [], 500);
  }
});

export default router;
