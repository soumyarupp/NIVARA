import { Router } from 'express';
import {
  getAgencies,
  createAgency,
  getAgencyById,
  updateAgency,
  updateAgencyStatus
} from '../controllers/agency.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAgencies);
router.get('/:id', getAgencyById);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  createAgency
);
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  updateAgency
);
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  updateAgencyStatus
);

export default router;
