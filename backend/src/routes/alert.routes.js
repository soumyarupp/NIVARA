import { Router } from 'express';
import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert
} from '../controllers/alert.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);

router.patch(
  '/:id/acknowledge',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  acknowledgeAlert
);

router.patch(
  '/:id/resolve',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  resolveAlert
);

export default router;
