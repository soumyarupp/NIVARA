import { Router } from 'express';
import { deleteDocument } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  deleteDocument
);

export default router;
