import { Router } from 'express';
import {
  updateMilestone,
  deleteMilestone
} from '../controllers/milestone.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'NODAL_OFFICER'),
  updateMilestone
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  deleteMilestone
);

export default router;
