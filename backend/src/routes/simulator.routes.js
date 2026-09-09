import { Router } from 'express';
import { simulateProject } from '../controllers/simulator.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/project/:projectId', simulateProject);

export default router;
