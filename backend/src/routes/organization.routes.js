import { Router } from 'express';
import {
  createMinistry,
  createAgency,
  listOrganizations,
  getOrganizationById
} from '../controllers/organization.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createMinistrySchema,
  createAgencySchema
} from '../validators/organization.validator.js';

const router = Router();

router.use(authenticate);

// Create Ministry (IPMD_ADMIN only)
router.post(
  '/ministry',
  authorize('IPMD_ADMIN'),
  validate(createMinistrySchema),
  createMinistry
);

// Create Implementing Agency (IPMD_ADMIN or MINISTRY_ADMIN)
router.post(
  '/agency',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN'),
  validate(createAgencySchema),
  createAgency
);

// List organizations bounded by scope
router.get('/', listOrganizations);

// Get organization details
router.get('/:id', getOrganizationById);

export default router;
