import { Router } from 'express';
import {
  submitMonthlyReport,
  getAllReports,
  getProjectReports,
  getReportById,
  generateExecutiveReport
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllReports);

router.post(
  '/',
  authorize(
    'SUPER_ADMIN',
    'IPMD_ADMIN',
    'REPORTING_OFFICER'
  ),
  submitMonthlyReport
);

router.get('/project/:projectId', getProjectReports);
router.get('/:id', getReportById);
router.post('/generate', generateExecutiveReport);

export default router;

