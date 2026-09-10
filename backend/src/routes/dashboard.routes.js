import { Router } from 'express';
import {
  getDashboardSummary,
  getDashboardOverview,
  getRiskDistribution,
  getDelayReasons,
  getStateSummary,
  getSectorSummary,
  getMinistrySummary
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/summary', getDashboardSummary);
router.get('/risk-distribution', getRiskDistribution);
router.get('/delay-reasons', getDelayReasons);
router.get('/state-summary', getStateSummary);
router.get('/sector-summary', getSectorSummary);
router.get('/ministry-summary', getMinistrySummary);

export default router;
