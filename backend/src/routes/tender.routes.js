import { Router } from 'express';
import {
  updateTender,
  deleteTender
} from '../controllers/tender.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  updateTender
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  deleteTender
);

export default router;
