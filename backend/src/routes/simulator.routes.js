import { Router } from 'express';
import { simulateProject } from '../controllers/simulator.controller.js';
import { predictPreApprovalRisk } from '../controllers/preApproval.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/project/:projectId', simulateProject);

router.post('/delay-impact', (req, res) => {
  req.params.projectId = req.body.projectId || req.body.id;
  return simulateProject(req, res);
});

router.post('/pre-approval', predictPreApprovalRisk);

export default router;
