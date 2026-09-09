import { Router } from 'express';
import {
  submitMonthlyReport,
  getProjectReports,
  getReportById
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(
    'SUPER_ADMIN',
    'IPMD_ADMIN',
    'REPORTING_OFFICER',
    'NODAL_OFFICER',
    'IMPLEMENTATION_AGENCY',
    'AGENCY_ADMIN'
  ),
  submitMonthlyReport
);

router.get('/project/:projectId', getProjectReports);
router.get('/:id', getReportById);

export default router;
