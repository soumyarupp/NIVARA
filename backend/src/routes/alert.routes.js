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

router.route('/:id/acknowledge')
  .patch(
    authenticate,
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
    acknowledgeAlert
  )
  .post(
    authenticate,
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
    acknowledgeAlert
  );

router.route('/:id/resolve')
  .patch(
    authenticate,
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
    resolveAlert
  )
  .post(
    authenticate,
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
    resolveAlert
  );

export default router;
