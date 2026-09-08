import { Router } from 'express';
import {
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

// Invite user (IPMD_ADMIN, MINISTRY_ADMIN, AGENCY_ADMIN)
router.post(
  '/invite',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
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
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
  validate(updateStatusSchema),
  updateUserStatusController
);

// Assign project to officer
router.post(
  '/:id/assign-project',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
  validate(assignProjectSchema),
  assignProject
);

// Remove project from officer
router.delete(
  '/:id/project/:projectId',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
  validate(removeProjectSchema),
  removeProject
);

export default router;
