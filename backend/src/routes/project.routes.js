import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProjectById,
  assignOfficersToProject
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createProjectSchema,
  assignOfficersToProjectSchema
} from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);

// Create Project (IPMD_ADMIN, MINISTRY_ADMIN, AGENCY_ADMIN)
router.post(
  '/',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
  validate(createProjectSchema),
  createProject
);

// List accessible projects
router.get('/', listProjects);

// Get project details
router.get('/:id', getProjectById);

// Assign officers to project
router.patch(
  '/:id/assign-officers',
  authorize('IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'),
  validate(assignOfficersToProjectSchema),
  assignOfficersToProject
);

export default router;
