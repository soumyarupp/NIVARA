import { Router } from 'express';
import {
  updateClearance,
  deleteClearance
} from '../controllers/clearance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'NODAL_OFFICER', 'FIELD_OFFICER'),
  updateClearance
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'NODAL_OFFICER'),
  deleteClearance
);

export default router;
