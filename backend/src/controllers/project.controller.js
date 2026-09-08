import { Project } from '../models/Project.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { getAccessibleOrganizationIds, canAccessProject } from '../services/organization.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] || null
});

/**
 * POST /api/projects
 * (IPMD_ADMIN, MINISTRY_ADMIN, AGENCY_ADMIN)
 */
export const createProject = async (req, res, next) => {
  try {
    const { projectName, projectCode, description, lineMinistryId, implementingAgencyId, budgetEstimatedInCrores } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    let resolvedMinistryId = lineMinistryId;
    let resolvedAgencyId = implementingAgencyId;

    if (req.user.role === 'AGENCY_ADMIN') {
      resolvedAgencyId = req.user.organizationId;
      const agency = await Organization.findById(resolvedAgencyId);
      resolvedMinistryId = agency?.parentOrganizationId;
    } else if (req.user.role === 'MINISTRY_ADMIN') {
      resolvedMinistryId = req.user.organizationId;
    }

    if (!resolvedAgencyId || !resolvedMinistryId) {
      return sendError(res, 'Both Line Ministry and Implementing Agency must be specified.', [], 400);
    }

    const agency = await Organization.findById(resolvedAgencyId);
    if (!agency || agency.type !== 'IMPLEMENTING_AGENCY') {
      return sendError(res, 'Invalid Implementing Agency.', [], 400);
    }

    const existing = await Project.findOne({ projectCode: projectCode.toUpperCase() });
    if (existing) {
      return sendError(res, `Project with code ${projectCode.toUpperCase()} already exists.`, [], 409);
    }

    const project = await Project.create({
      projectName: projectName.trim(),
      projectCode: projectCode.trim().toUpperCase(),
      description: description || '',
      lineMinistryId: resolvedMinistryId,
      implementingAgencyId: resolvedAgencyId,
      budgetEstimatedInCrores: budgetEstimatedInCrores || 0,
      createdBy: req.user._id
    });

    await logAuditEvent({
      userId: req.user._id,
      action: 'PROJECT_CREATED',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      ipAddress,
      userAgent,
      metadata: { projectCode: project.projectCode, projectName: project.projectName }
    });

    return sendSuccess(res, 'Project created successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects
 */
export const listProjects = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'NODAL_OFFICER' || req.user.role === 'REPORTING_OFFICER') {
      // Access only assigned projects
      filter.$or = [
        { reportingOfficerId: req.user._id },
        { nodalOfficerId: req.user._id },
        { _id: { $in: req.user.projectIds || [] } }
      ];
    } else if (req.user.role === 'AGENCY_ADMIN') {
      filter.implementingAgencyId = req.user.organizationId;
    } else if (req.user.role === 'MINISTRY_ADMIN') {
      const accessibleAgencies = await getAccessibleOrganizationIds(req.user);
      filter.implementingAgencyId = { $in: accessibleAgencies };
    }

    const projects = await Project.find(filter)
      .populate('lineMinistryId', 'name code')
      .populate('implementingAgencyId', 'name code')
      .populate('reportingOfficerId', 'fullName officialEmail designation')
      .populate('nodalOfficerId', 'fullName officialEmail designation')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Projects retrieved successfully', { count: projects.length, projects }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 */
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('lineMinistryId', 'name code')
      .populate('implementingAgencyId', 'name code')
      .populate('reportingOfficerId', 'fullName officialEmail designation mobileNumber')
      .populate('nodalOfficerId', 'fullName officialEmail designation mobileNumber');

    if (!project) {
      return sendError(res, 'Project not found', [], 404);
    }

    const isAllowed = await canAccessProject(req.user, project);
    if (!isAllowed) {
      return sendError(res, 'Access denied to this project.', [], 403);
    }

    return sendSuccess(res, 'Project details retrieved', { project }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/projects/:id/assign-officers
 */
export const assignOfficersToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reportingOfficerId, nodalOfficerId } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found', [], 404);
    }

    // Role check
    if (req.user.role === 'AGENCY_ADMIN') {
      if (project.implementingAgencyId.toString() !== req.user.organizationId.toString()) {
        return sendError(res, 'Cannot assign officers to projects outside your agency.', [], 403);
      }
    } else if (req.user.role !== 'IPMD_ADMIN' && req.user.role !== 'MINISTRY_ADMIN') {
      return sendError(res, 'Unauthorized to assign officers.', [], 403);
    }

    // Validate reporting officer
    if (reportingOfficerId) {
      const repUser = await User.findById(reportingOfficerId);
      if (!repUser || repUser.role !== 'REPORTING_OFFICER') {
        return sendError(res, 'Assigned user must have the REPORTING_OFFICER role.', [], 400);
      }
      if (repUser.organizationId?.toString() !== project.implementingAgencyId.toString()) {
        return sendError(res, 'Reporting Officer must belong to the same Implementing Agency.', [], 400);
      }
      project.reportingOfficerId = repUser._id;
      if (!repUser.projectIds.map((p) => p.toString()).includes(project._id.toString())) {
        repUser.projectIds.push(project._id);
        await repUser.save();
      }
    }

    // Validate nodal officer
    if (nodalOfficerId) {
      const nodUser = await User.findById(nodalOfficerId);
      if (!nodUser || nodUser.role !== 'NODAL_OFFICER') {
        return sendError(res, 'Assigned user must have the NODAL_OFFICER role.', [], 400);
      }
      if (nodUser.organizationId?.toString() !== project.implementingAgencyId.toString()) {
        return sendError(res, 'Nodal Officer must belong to the same Implementing Agency.', [], 400);
      }
      project.nodalOfficerId = nodUser._id;
      if (!nodUser.projectIds.map((p) => p.toString()).includes(project._id.toString())) {
        nodUser.projectIds.push(project._id);
        await nodUser.save();
      }
    }

    await project.save();

    await logAuditEvent({
      userId: req.user._id,
      action: 'PROJECT_OFFICERS_UPDATED',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      ipAddress,
      userAgent,
      metadata: { reportingOfficerId, nodalOfficerId }
    });

    return sendSuccess(res, 'Project officers assigned successfully', { project }, 200);
  } catch (error) {
    next(error);
  }
};
