import { Router } from 'express';
import { predictPreApprovalRisk } from '../controllers/preApproval.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Allow authenticated users to simulate pre-approval risks
router.post('/predict', authenticate, predictPreApprovalRisk);

export default router;
