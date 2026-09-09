import { Router } from 'express';
import {
  getMinistries,
  createMinistry,
  getMinistryById
} from '../controllers/ministry.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMinistries);
router.get('/:id', getMinistryById);
router.post('/', authorize('SUPER_ADMIN', 'IPMD_ADMIN'), createMinistry);

export default router;
