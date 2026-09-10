import { Router } from 'express';
import {
  createProject,
  saveDraft,
  updateDraft,
  submitProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addReportingOfficer,
  removeReportingOfficer,
  getReportingOfficers,
  assignNodalOfficer,
  getSimilarProjectBenchmarks,
  recordProjectAction
} from '../controllers/project.controller.js';
import {
  upsertLandDetail,
  getLandDetail
} from '../controllers/land.controller.js';
import {
  addClearance,
  getClearancesByProject
} from '../controllers/clearance.controller.js';
import {
  addTender,
  getTendersByProject
} from '../controllers/tender.controller.js';
import {
  addMilestone,
  getMilestonesByProject
} from '../controllers/milestone.controller.js';
import {
  addPartner,
  getPartnersByProject
} from '../controllers/partner.controller.js';
import {
  uploadDocuments,
  getDocumentsByProject
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Create Project & Draft Workflows
router.post(
  '/',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  createProject
);

router.post(
  '/draft',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  saveDraft
);

router.patch(
  '/:id/draft',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  updateDraft
);

router.post(
  '/:id/submit',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  submitProject
);

// Benchmark & Similar Projects for Implementation Agencies
router.get('/similar-benchmarks', getSimilarProjectBenchmarks);

// Project List & Details
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post(
  '/:id/action',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'NODAL_OFFICER', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  recordProjectAction
);
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  updateProject
);
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  deleteProject
);

// Officer Assignment Management
router.post(
  '/:projectId/reporting-officers',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  addReportingOfficer
);
router.delete(
  '/:projectId/reporting-officers/:userId',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN'),
  removeReportingOfficer
);
router.get('/:projectId/reporting-officers', getReportingOfficers);
router.patch(
  '/:projectId/nodal-officer',
  authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'MINISTRY_OFFICER', 'MINISTRY_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
  assignNodalOfficer
);

// Sub-Component Endpoints Mounted on Project
router.route('/:projectId/land')
  .get(getLandDetail)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    upsertLandDetail
  )
  .put(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    upsertLandDetail
  );

router.route('/:projectId/clearances')
  .get(getClearancesByProject)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    addClearance
  );

router.route('/:projectId/tenders')
  .get(getTendersByProject)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    addTender
  );

router.route('/:projectId/milestones')
  .get(getMilestonesByProject)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    addMilestone
  );

router.route('/:projectId/partners')
  .get(getPartnersByProject)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'),
    addPartner
  );

router.route('/:projectId/documents')
  .get(getDocumentsByProject)
  .post(
    authorize('SUPER_ADMIN', 'IPMD_ADMIN', 'IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'NODAL_OFFICER', 'REPORTING_OFFICER'),
    upload.array('files', 5),
    uploadDocuments
  );

export default router;
