import { Router } from 'express';
import { detectProgressMismatch } from '../services/mismatchDetector.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authenticate);

router.post('/mismatch', async (req, res) => {
  try {
    const { projectId, totalBudget, expenditure, physicalProgress, plannedPhysicalProgress } = req.body;
    
    if (totalBudget === undefined || expenditure === undefined || physicalProgress === undefined) {
      return sendError(res, 'totalBudget, expenditure, and physicalProgress are required.', [], 400);
    }

    const mismatch = detectProgressMismatch({
      totalBudget: Number(totalBudget),
      expenditure: Number(expenditure),
      actualPhysicalProgress: Number(physicalProgress),
      plannedPhysicalProgress: plannedPhysicalProgress ? Number(plannedPhysicalProgress) : Number(physicalProgress)
    });

    return sendSuccess(res, 'Progress mismatch analysis completed.', {
      projectId,
      ...mismatch
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to detect mismatch.', [], 500);
  }
});

export default router;
