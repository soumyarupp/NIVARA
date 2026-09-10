import { Router } from 'express';
import {
  createUser,
  inviteUser,
  listUsers,
  getUserById,
  updateUser,
  updateUserStatusController,
  assignProject,
  removeProject
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  inviteUserSchema,
  updateUserSchema,
  updateStatusSchema,
  assignProjectSchema,
  removeProjectSchema
} from '../validators/user.validator.js';

const router = Router();

// Apply global authentication to all user management routes
router.use(authenticate);

// Create user directly (SUPER_ADMIN, IPMD_ADMIN, MINISTRY_OFFICER, MINISTRY_ADMIN, IMPLEMENTATION_AGENCY, AGENCY_ADMIN)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  createUser
);

// Invite user
router.post(
  '/invite',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  validate(inviteUserSchema),
  inviteUser
);

// List users (filtered by caller hierarchy)
router.get('/', listUsers);

// Get user by ID
router.get('/:id', getUserById);

// Update user profile
router.patch('/:id', validate(updateUserSchema), updateUser);

// Update user status (INVITED, ACTIVE, SUSPENDED, DEACTIVATED)
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  validate(updateStatusSchema),
  updateUserStatusController
);

// Assign project to officer
router.post(
  '/:id/assign-project',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  validate(assignProjectSchema),
  assignProject
);

// Remove project from officer
router.delete(
  '/:id/project/:projectId',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  validate(removeProjectSchema),
  removeProject
);

export default router;
