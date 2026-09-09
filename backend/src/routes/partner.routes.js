import { Router } from 'express';
import {
  updatePartner,
  deletePartner
} from '../controllers/partner.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  updatePartner
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  deletePartner
);

export default router;
