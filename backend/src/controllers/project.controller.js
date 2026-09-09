import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Ministry } from '../models/Ministry.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { LandDetail } from '../models/LandDetail.js';
import { Clearance } from '../models/Clearance.js';
import { Tender } from '../models/Tender.js';
import { Milestone } from '../models/Milestone.js';
import { Partner } from '../models/Partner.js';
import { ProjectDocument } from '../models/ProjectDocument.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Alert } from '../models/Alert.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/audit.service.js';

/**
 * Helper to build role-scoped MongoDB filter
 */
function buildScopeFilter(user) {
  const role = user.role;
  if (['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role)) {
    return {};
  }
  if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role)) {
    return {
      $or: [
        { ministryId: user.ministryId || user.organizationId },
        { lineMinistryId: user.ministryId || user.organizationId }
      ]
    };
  }
  if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(role)) {
    return {
      $or: [
        { implementationAgencyId: user.agencyId || user.organizationId },
        { implementingAgencyId: user.agencyId || user.organizationId },
        { createdBy: user._id || user.id }
      ]
    };
  }
  if (role === 'NODAL_OFFICER') {
    const uid = user._id || user.id;
    return {
      $or: [{ nodalOfficer: uid }, { nodalOfficerId: uid }]
    };
  }
  if (role === 'REPORTING_OFFICER') {
    const uid = user._id || user.id;
    return {
      $or: [{ reportingOfficers: uid }, { reportingOfficerId: uid }]
    };
  }
  return { _id: null };
}

/**
 * Create Project (Full creation with status SUBMITTED or DRAFT)
 */
export async function createProject(req, res) {
  try {
    const data = { ...req.body };
    const userId = req.user._id || req.user.id;

    data.createdBy = userId;
    if (!data.implementationAgencyId && (req.user.agencyId || req.user.organizationId)) {
      data.implementationAgencyId = req.user.agencyId || req.user.organizationId;
    }

    // Default status if not provided
    if (!data.projectStatus) {
      data.projectStatus = data.isDraft ? 'DRAFT' : 'SUBMITTED';
    }

    // Verify Nodal Officer if provided
    if (data.nodalOfficer) {
      const nodalUser = await User.findById(data.nodalOfficer);
      if (!nodalUser) {
        return sendError(res, 'Specified Nodal Officer not found.', [], 400);
      }
    }

    // Verify Reporting Officers if provided
    if (data.reportingOfficers && Array.isArray(data.reportingOfficers)) {
      const validOfficers = await User.find({ _id: { $in: data.reportingOfficers } });
      data.reportingOfficers = validOfficers.map((u) => u._id);
    }

    const project = await Project.create(data);

    await logAuditEvent({
      userId,
      action: project.projectStatus === 'DRAFT' ? 'PROJECT_DRAFT_CREATED' : 'PROJECT_CREATED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { projectName: project.projectName, projectCode: project.projectCode },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Project created successfully.', project, 201);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 'A project with this projectCode already exists.', [], 409);
    }
    return sendError(res, err.message || 'Failed to create project.', [], 400);
  }
}

/**
 * Save Project Draft
 */
export async function saveDraft(req, res) {
  try {
    const data = { ...req.body, projectStatus: 'DRAFT', createdBy: req.user._id || req.user.id };
    if (!data.projectCode) {
      data.projectCode = 'DRAFT-' + Date.now();
    }
    if (!data.projectName) {
      data.projectName = 'Draft Project ' + new Date().toLocaleDateString();
    }
    if (!data.ministryId && (req.user.ministryId || req.user.organizationId)) {
      data.ministryId = req.user.ministryId || req.user.organizationId;
    }
    if (!data.implementationAgencyId && (req.user.agencyId || req.user.organizationId)) {
      data.implementationAgencyId = req.user.agencyId || req.user.organizationId;
    }

    const project = await Project.create(data);
    return sendSuccess(res, 'Project draft saved successfully.', project, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to save project draft.', [], 400);
  }
}

/**
 * Update Project Draft
 */
export async function updateDraft(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    if (project.projectStatus !== 'DRAFT') {
      return sendError(res, 'Only draft projects can be modified via this endpoint.', [], 400);
    }

    Object.assign(project, req.body);
    await project.save();

    return sendSuccess(res, 'Project draft updated successfully.', project);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update draft.', [], 400);
  }
}

/**
 * Submit Project (Validate required fields & change status to SUBMITTED)
 */
export async function submitProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    // Required field validation
    if (!project.projectName || !project.projectCode || !project.originalProjectCost || !project.ministryId) {
      return sendError(res, 'Required project fields (Name, Code, Original Cost, Ministry) must be completed before submission.', [], 400);
    }

    project.projectStatus = 'SUBMITTED';
    await project.save();

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'PROJECT_SUBMITTED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { projectName: project.projectName },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Project submitted for review successfully.', project);
  } catch (err) {
    return sendError(res, err.message || 'Failed to submit project.', [], 400);
  }
}

/**
 * Get Projects with Pagination, Search, and Multi-Attribute Filtering
 */
export async function getProjects(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      state,
      sector,
      riskLevel,
      status,
      projectStatus,
      minCost,
      maxCost,
      ministryId,
      agencyId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = buildScopeFilter(req.user);

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectCode: { $regex: search, $options: 'i' } },
        { projectLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (state) query.state = { $regex: state, $options: 'i' };
    if (sector) query.sector = sector;
    if (riskLevel) query.riskLevel = riskLevel;
    if (status || projectStatus) query.projectStatus = status || projectStatus;
    if (ministryId) query.ministryId = ministryId;
    if (agencyId) query.implementationAgencyId = agencyId;

    if (minCost || maxCost) {
      query.originalProjectCost = {};
      if (minCost) query.originalProjectCost.$gte = Number(minCost);
      if (maxCost) query.originalProjectCost.$lte = Number(maxCost);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Project.countDocuments(query);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const projects = await Project.find(query)
      .populate('ministryId', 'name code')
      .populate('lineMinistryId', 'name code')
      .populate('implementationAgencyId', 'name agencyCode')
      .populate('nodalOfficer', 'name fullName officialEmail phone')
      .populate('reportingOfficers', 'name fullName officialEmail phone')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully.',
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch projects.', [], 500);
  }
}

/**
 * Get Single Project by ID with all CUF components populated
 */
export async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('ministryId')
      .populate('lineMinistryId')
      .populate('implementationAgencyId')
      .populate('nodalOfficer', 'name fullName officialEmail phone designation')
      .populate('reportingOfficers', 'name fullName officialEmail phone designation')
      .populate('createdBy', 'name fullName officialEmail')
      .lean();

    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    // Fetch related CUF sub-components in parallel
    const [landDetail, clearances, tenders, milestones, partners, documents, latestReports, activeAlerts] =
      await Promise.all([
        LandDetail.findOne({ projectId: id }).lean(),
        Clearance.find({ projectId: id }).lean(),
        Tender.find({ projectId: id }).lean(),
        Milestone.find({ projectId: id }).sort({ originalStartDate: 1 }).lean(),
        Partner.find({ projectId: id }).lean(),
        ProjectDocument.find({ projectId: id }).sort({ uploadedAt: -1 }).lean(),
        MonthlyReport.find({ projectId: id }).sort({ reportingMonth: -1 }).limit(12).lean(),
        Alert.find({ projectId: id, status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } }).lean()
      ]);

    return sendSuccess(res, 'Project details retrieved.', {
      ...project,
      landDetail,
      clearances,
      tenders,
      milestones,
      partners,
      documents,
      monthlyReports: latestReports,
      activeAlerts
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch project details.', [], 500);
  }
}

/**
 * Update Project
 */
export async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'PROJECT_UPDATED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { projectName: project.projectName },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Project updated successfully.', project);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update project.', [], 400);
  }
}

/**
 * Delete Project (Draft only)
 */
export async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    if (project.projectStatus !== 'DRAFT' && !['SUPER_ADMIN', 'IPMD_ADMIN'].includes(req.user.role)) {
      return sendError(res, 'Only draft projects can be deleted.', [], 403);
    }

    await Project.findByIdAndDelete(id);
    return sendSuccess(res, 'Project deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete project.', [], 500);
  }
}

/**
 * Reporting Officers Management
 */

export async function addReportingOfficer(req, res) {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return sendError(res, 'Reporting Officer userId is required.', [], 400);
    }

    const officer = await User.findById(userId);
    if (!officer) {
      return sendError(res, 'Reporting officer user not found.', [], 404);
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    if (!project.reportingOfficers) {
      project.reportingOfficers = [];
    }

    const exists = project.reportingOfficers.some((id) => id.toString() === userId.toString());
    if (exists) {
      return sendError(res, 'Officer is already assigned to this project.', [], 409);
    }

    project.reportingOfficers.push(userId);
    await project.save();

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'OFFICER_ASSIGNED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { officerId: userId, role: 'REPORTING_OFFICER' },
      ipAddress: req.ip
    });

    const updatedProject = await Project.findById(projectId).populate('reportingOfficers', 'name fullName officialEmail phone designation');

    return sendSuccess(res, 'Reporting officer added successfully.', updatedProject.reportingOfficers);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add reporting officer.', [], 500);
  }
}

export async function removeReportingOfficer(req, res) {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    project.reportingOfficers = (project.reportingOfficers || []).filter(
      (id) => id.toString() !== userId.toString()
    );
    await project.save();

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'OFFICER_REMOVED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { officerId: userId, role: 'REPORTING_OFFICER' },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Reporting officer removed from project successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to remove reporting officer.', [], 500);
  }
}

export async function getReportingOfficers(req, res) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate(
      'reportingOfficers',
      'name fullName officialEmail phone designation department'
    );
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }
    return sendSuccess(res, 'Reporting officers retrieved.', project.reportingOfficers || []);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch reporting officers.', [], 500);
  }
}

export async function assignNodalOfficer(req, res) {
  try {
    const { projectId } = req.params;
    const { nodalOfficerId } = req.body;

    const officer = await User.findById(nodalOfficerId);
    if (!officer) {
      return sendError(res, 'Nodal Officer not found.', [], 404);
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { nodalOfficer: nodalOfficerId, nodalOfficerId },
      { new: true }
    ).populate('nodalOfficer', 'name fullName officialEmail phone designation');

    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'OFFICER_ASSIGNED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { officerId: nodalOfficerId, role: 'NODAL_OFFICER' },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Nodal Officer assigned successfully.', project.nodalOfficer);
  } catch (err) {
    return sendError(res, err.message || 'Failed to assign Nodal Officer.', [], 500);
  }
}
