import { Router } from 'express';
import { predictPreApprovalRisk } from '../controllers/preApproval.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Strictly enforce officer authentication on pre-approval risk simulations
router.post('/predict', authenticate, predictPreApprovalRisk);

export default router;
