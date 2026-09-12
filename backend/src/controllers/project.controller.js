import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Ministry } from '../models/Ministry.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { LandDetail } from '../models/LandDetail.js';
import { Clearance, CLEARANCE_TYPES } from '../models/Clearance.js';
import { Tender } from '../models/Tender.js';
import { Milestone, MILESTONE_TYPES } from '../models/Milestone.js';
import { Partner } from '../models/Partner.js';
import { ProjectDocument } from '../models/ProjectDocument.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/audit.service.js';
import { recalculateProjectEntities } from '../services/capitalRecalculation.service.js';
import { getProjectAiAnalysis } from '../services/ai.service.js';

/**
 * Helper to build role-scoped MongoDB filter
 */
function buildScopeFilter(user) {
  if (!user) return {};
  const role = user.role;
  if (!role || ['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role)) {
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
      $or: [
        { nodalOfficer: uid },
        { nodalOfficerId: uid },
        { _id: { $in: user.projectIds || [] } }
      ]
    };
  }
  if (role === 'REPORTING_OFFICER') {
    const uid = user._id || user.id;
    return {
      $or: [
        { reportingOfficers: uid },
        { reportingOfficerId: uid },
        { _id: { $in: user.projectIds || [] } }
      ]
    };
  }
  return { _id: null };
}

/**
 * Helper to generate and verify a unique 6-digit project registration number
 */
export async function generateUniqueProjectCode() {
  for (let i = 0; i < 100; i++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await Project.findOne({ projectCode: candidate });
    if (!existing) {
      return candidate;
    }
  }
  // Fallback if random space is crowded
  return String(Date.now()).slice(-6);
}

/**
 * Check and generate an available 6-digit project registration number
 */
export async function getAvailableRegistrationNumber(req, res) {
  try {
    const registrationNumber = await generateUniqueProjectCode();
    return sendSuccess(res, 'Unique registration number generated and verified available', {
      registrationNumber,
      isAvailable: true
    });
  } catch (error) {
    return sendError(res, 'Failed to generate registration number', error.message, 500);
  }
}

/**
 * Create Project (Full creation with status SUBMITTED or DRAFT)
 */
export async function createProject(req, res) {
  try {
    const data = { ...req.body };
    const userId = req.user._id || req.user.id;

    data.createdBy = userId;

    // 1. Resolve Ministry from ministryId or ministry string name
    if (data.ministryId && mongoose.Types.ObjectId.isValid(data.ministryId)) {
      data.lineMinistryId = data.ministryId;
    } else if (data.ministry && typeof data.ministry === 'string') {
      const cleanMin = data.ministry.trim();
      const foundMinistry = await Ministry.findOne({
        $or: [
          { name: new RegExp(cleanMin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { ministryName: new RegExp(cleanMin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { code: new RegExp(`^${cleanMin}$`, 'i') }
        ]
      });
      if (foundMinistry) {
        data.ministryId = foundMinistry._id;
        data.lineMinistryId = foundMinistry._id;
      }
    }

    // 2. Resolve Implementation Agency from implementationAgencyId or agency string name
    if (data.implementationAgencyId && mongoose.Types.ObjectId.isValid(data.implementationAgencyId)) {
      data.implementingAgencyId = data.implementationAgencyId;
    } else if (data.agency && typeof data.agency === 'string') {
      const cleanAgency = data.agency.trim();
      const acronymMatch = cleanAgency.match(/\(([^)]+)\)/);
      const acronym = acronymMatch ? acronymMatch[1].trim() : '';
      const nameWithoutParens = cleanAgency.replace(/\s*\([^)]*\)/g, '').trim();

      const foundAgency = await ImplementationAgency.findOne({
        $or: [
          ...(acronym ? [{ agencyCode: new RegExp(`^${acronym}$`, 'i') }] : []),
          { agencyCode: new RegExp(`^${cleanAgency}$`, 'i') },
          { name: new RegExp(nameWithoutParens.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { agencyName: new RegExp(nameWithoutParens.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { acronym: new RegExp(`^${acronym || cleanAgency}$`, 'i') }
        ]
      });
      if (foundAgency) {
        data.implementationAgencyId = foundAgency._id;
        data.implementingAgencyId = foundAgency._id;
      }
    }

    if (!data.implementationAgencyId && (req.user.agencyId || req.user.organizationId)) {
      data.implementationAgencyId = req.user.agencyId || req.user.organizationId;
      data.implementingAgencyId = data.implementationAgencyId;
    }

    // 3. Verify candidate projectCode is available; if missing or already taken, generate a verified unique 6-digit number
    if (!data.projectCode) {
      data.projectCode = await generateUniqueProjectCode();
    } else {
      const existing = await Project.findOne({ projectCode: String(data.projectCode).trim() });
      if (existing) {
        // If code already taken, assign newly verified unique code
        data.projectCode = await generateUniqueProjectCode();
      } else {
        data.projectCode = String(data.projectCode).trim();
      }
    }

    // 4. Default status and classification
    if (!data.projectStatus) {
      data.projectStatus = data.isDraft ? 'DRAFT' : 'SUBMITTED';
    }
    if (!data.status) {
      data.status = 'IN_PROGRESS';
    }
    if (!data.stage) {
      data.stage = 'Under Implementation';
    }

    // 5. Numerical and cost sanitization
    const costNum = Number(data.originalProjectCost || data.totalCost || data.sanctionedCost) || 0;
    data.originalProjectCost = costNum;
    data.sanctionedCost = costNum;
    data.revisedProjectCost = Number(data.revisedProjectCost) || costNum;
    data.expenditure = Number(data.expenditure) || 0;
    data.physicalProgress = Number(data.physicalProgress) || 0;
    data.financialProgress = Number(data.financialProgress) || 0;
    data.riskScore = Number(data.riskScore) || 0;
    data.riskLevel = data.riskLevel || 'LOW';

    // 6. Safe Nodal Officer validation and resolution
    if (data.nodalOfficer && mongoose.Types.ObjectId.isValid(data.nodalOfficer)) {
      const nodalUser = await User.findById(data.nodalOfficer);
      if (nodalUser) {
        data.nodalOfficerId = nodalUser._id;
        if (!data.nodalOfficerName) data.nodalOfficerName = nodalUser.fullName || nodalUser.name;
        if (!data.nodalOfficerEmail) data.nodalOfficerEmail = nodalUser.officialEmail || nodalUser.email;
        if (!data.nodalOfficerPhone) data.nodalOfficerPhone = nodalUser.phone || '';
        if (!data.nodalOfficerDesignation) data.nodalOfficerDesignation = nodalUser.designation || '';
      } else {
        delete data.nodalOfficer;
      }
    } else if (data.nodalOfficerEmail) {
      const nodalUser = await User.findOne({
        $or: [
          { officialEmail: new RegExp(`^${data.nodalOfficerEmail.trim()}$`, 'i') },
          { email: new RegExp(`^${data.nodalOfficerEmail.trim()}$`, 'i') }
        ]
      });
      if (nodalUser) {
        data.nodalOfficer = nodalUser._id;
        data.nodalOfficerId = nodalUser._id;
        if (!data.nodalOfficerName) data.nodalOfficerName = nodalUser.fullName || nodalUser.name;
        if (!data.nodalOfficerPhone) data.nodalOfficerPhone = nodalUser.phone || '';
        if (!data.nodalOfficerDesignation) data.nodalOfficerDesignation = nodalUser.designation || '';
      }
    } else {
      delete data.nodalOfficer;
    }

    // 7. Safe Reporting Officers validation and resolution
    if (data.reportingOfficers && Array.isArray(data.reportingOfficers)) {
      const validOfficerIds = data.reportingOfficers.filter(id => id && mongoose.Types.ObjectId.isValid(id));
      if (validOfficerIds.length > 0) {
        const validOfficers = await User.find({ _id: { $in: validOfficerIds } });
        data.reportingOfficers = validOfficers.map((u) => u._id);
        if (data.reportingOfficers.length > 0) {
          data.reportingOfficerId = data.reportingOfficers[0];
          if (!data.reportingOfficerName) data.reportingOfficerName = validOfficers[0].fullName || validOfficers[0].name;
          if (!data.reportingOfficerEmail) data.reportingOfficerEmail = validOfficers[0].officialEmail || validOfficers[0].email;
          if (!data.reportingOfficerPhone) data.reportingOfficerPhone = validOfficers[0].phone || '';
        }
      } else {
        data.reportingOfficers = [];
      }
    } else if (data.reportingOfficerEmail) {
      const roUser = await User.findOne({
        $or: [
          { officialEmail: new RegExp(`^${data.reportingOfficerEmail.trim()}$`, 'i') },
          { email: new RegExp(`^${data.reportingOfficerEmail.trim()}$`, 'i') }
        ]
      });
      if (roUser) {
        data.reportingOfficers = [roUser._id];
        data.reportingOfficerId = roUser._id;
        if (!data.reportingOfficerName) data.reportingOfficerName = roUser.fullName || roUser.name;
        if (!data.reportingOfficerPhone) data.reportingOfficerPhone = roUser.phone || '';
      }
    }

    // 8. Location defaults
    if (!data.state) {
      data.state = 'Pan-India';
    }
    if (!data.projectLocation) {
      data.projectLocation = data.district ? `${data.district}, ${data.state}` : data.state;
    }

    const project = await Project.create(data);

    // Save associated statutory clearances if provided
    if (data.clearances && Array.isArray(data.clearances) && data.clearances.length > 0) {
      const validClearances = data.clearances
        .filter(c => c && (c.referenceNumber || c.clearanceType || c.authorityName))
        .map(c => {
          let cType = c.clearanceType || 'OTHER';
          if (!CLEARANCE_TYPES.includes(cType)) {
            cType = 'OTHER';
          }
          return {
            projectId: project._id,
            clearanceType: cType,
            status: ['PENDING', 'APPROVED', 'NOT_REQUIRED', 'REJECTED'].includes(c.status) ? c.status : 'PENDING',
            referenceNumber: String(c.referenceNumber || c.registrationNumber || '').trim(),
            authorityName: c.authorityName || '',
            approvalDate: c.approvalDate ? new Date(c.approvalDate) : null,
            requiredDate: c.requiredDate ? new Date(c.requiredDate) : null,
            pendingReason: c.pendingReason || '',
            remarks: c.remarks || ''
          };
        });
      if (validClearances.length > 0) {
        await Clearance.insertMany(validClearances);
      }
    }

    // Save associated milestones if provided
    if (data.milestones && Array.isArray(data.milestones) && data.milestones.length > 0) {
      const validMilestones = data.milestones
        .filter(m => m && (m.name || m.milestoneName))
        .map(m => {
          let mType = m.milestoneType || m.type || 'CONSTRUCTION';
          if (!MILESTONE_TYPES.includes(mType)) {
            if (/plan|prep/i.test(mType)) mType = 'PROJECT_PLANNING';
            else if (/feasib|dpr/i.test(mType)) mType = 'DPR_FEASIBILITY';
            else if (/land|row/i.test(mType)) mType = 'LAND_ACQUISITION';
            else if (/clearance|approv/i.test(mType)) mType = 'CLEARANCE_APPROVAL';
            else if (/tender/i.test(mType)) mType = 'TENDER_PUBLISH';
            else if (/commiss/i.test(mType)) mType = 'COMMISSIONING';
            else mType = 'CUSTOM';
          }
          return {
            projectId: project._id,
            milestoneName: m.name || m.milestoneName,
            milestoneType: mType,
            originalFinishDate: m.date ? new Date(m.date) : null,
            status: m.status === 'COMPLETED' ? 'COMPLETED' : m.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED',
            weightage: m.weightage || 10
          };
        });
      if (validMilestones.length > 0) {
        await Milestone.insertMany(validMilestones);
      }
    }

    // Asynchronously recalculate sanctioned capital for the affected ministry & agency
    recalculateProjectEntities(project).catch(err => {
      console.error('Error recalculating capital after project creation:', err);
    });

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

    // Asynchronously recalculate sanctioned capital for the affected ministry & agency
    recalculateProjectEntities(project).catch(err => {
      console.error('Error recalculating capital after draft creation:', err);
    });

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

    if (state && !/pan[- ]?india|all/i.test(state.trim())) {
      query.state = { $regex: state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (sector && !/all/i.test(sector.trim())) {
      const secTerm = sector.trim().toLowerCase();
      if (secTerm.includes('road') || secTerm.includes('highway')) {
        query.sector = { $regex: 'road|highway', $options: 'i' };
      } else if (secTerm.includes('rail')) {
        query.sector = { $regex: 'rail', $options: 'i' };
      } else if (secTerm.includes('power') || secTerm.includes('energy')) {
        query.sector = { $regex: 'power|energy|solar|hydro', $options: 'i' };
      } else {
        query.sector = { $regex: sector.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '(&|and)'), $options: 'i' };
      }
    }
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
    let project = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id)
        .populate('ministryId')
        .populate('lineMinistryId')
        .populate('implementationAgencyId')
        .populate('nodalOfficer', 'name fullName officialEmail phone designation')
        .populate('reportingOfficers', 'name fullName officialEmail phone designation')
        .populate('createdBy', 'name fullName officialEmail')
        .lean();
    }

    if (!project) {
      project = await Project.findOne({
        $or: [
          { projectCode: id },
          { projectCode: { $regex: new RegExp(`^${id}$`, 'i') } },
          { projectName: { $regex: new RegExp(id, 'i') } },
          { id: id }
        ]
      })
        .populate('ministryId')
        .populate('lineMinistryId')
        .populate('implementationAgencyId')
        .populate('nodalOfficer', 'name fullName officialEmail phone designation')
        .populate('reportingOfficers', 'name fullName officialEmail phone designation')
        .populate('createdBy', 'name fullName officialEmail')
        .lean();
    }

    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    const callerRole = req.user?.role || 'SUPER_ADMIN';
    const userId = (req.user?._id || req.user?.id || '').toString();

    // Enforce Nodal Officer and Reporting Officer boundary: only view assigned projects
    if (callerRole === 'NODAL_OFFICER') {
      const isAssigned =
        project.nodalOfficer?._id?.toString() === userId ||
        project.nodalOfficer?.toString() === userId ||
        project.nodalOfficerId?.toString() === userId ||
        (req.user?.projectIds || []).map((p) => p.toString()).includes(project._id.toString());
      if (!isAssigned) {
        return sendError(res, 'Access denied. You are only authorized to view projects assigned to you as Nodal Officer.', [], 403);
      }
    } else if (callerRole === 'REPORTING_OFFICER') {
      const isAssigned =
        project.reportingOfficerId?.toString() === userId ||
        (project.reportingOfficers || []).some((o) => (o._id || o).toString() === userId) ||
        (req.user?.projectIds || []).map((p) => p.toString()).includes(project._id.toString());
      if (!isAssigned) {
        return sendError(res, 'Access denied. You are only authorized to view projects assigned to you as Reporting Officer.', [], 403);
      }
    }

    // Fetch related CUF sub-components in parallel using resolved project._id
    const targetProjectId = project._id;
    const [landDetail, clearances, tenders, milestones, partners, documents, latestReports, activeAlerts] =
      await Promise.all([
        LandDetail.findOne({ projectId: targetProjectId }).lean(),
        Clearance.find({ projectId: targetProjectId }).lean(),
        Tender.find({ projectId: targetProjectId }).lean(),
        Milestone.find({ projectId: targetProjectId }).sort({ originalStartDate: 1 }).lean(),
        Partner.find({ projectId: targetProjectId }).lean(),
        ProjectDocument.find({ projectId: targetProjectId }).sort({ uploadedAt: -1 }).lean(),
        MonthlyReport.find({ projectId: targetProjectId }).sort({ reportingMonth: -1 }).limit(12).lean(),
        callerRole === 'REPORTING_OFFICER' 
          ? Promise.resolve([]) 
          : Alert.find({ projectId: targetProjectId, status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] } }).lean()
      ]);

    // Use monthly reports from collection or from embedded array on project
    const resolvedReports = (latestReports && latestReports.length > 0)
      ? latestReports
      : (project.monthlyReports && project.monthlyReports.length > 0)
      ? project.monthlyReports
      : [];

    const currentPhysProg = Number(project.physicalProgress?.overallPercentage ?? project.physicalProgress ?? 0);
    if (currentPhysProg >= 100) {
      project.status = 'COMPLETED';
      project.projectStatus = 'COMPLETED';
      project.riskLevel = 'LOW';
      project.riskScore = 0;
      project.delayDays = 0;
      project.delayMonths = 0;
    }

    return sendSuccess(res, 'Project details retrieved.', {
      ...project,
      landDetail,
      clearances,
      tenders,
      milestones,
      partners,
      documents,
      monthlyReports: resolvedReports,
      monthlyData: project.monthlyData || {},
      historyByYear: project.historyByYear || {},
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
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { projectCode: id }] };
    } else {
      query = { projectCode: id };
    }

    const updateData = { ...req.body };

    // If implementationAgencyId is updated, also sync agency string name if not provided
    if (updateData.implementationAgencyId && !updateData.agency) {
      const agencyDoc = await mongoose.model('ImplementationAgency').findById(updateData.implementationAgencyId);
      if (agencyDoc) {
        updateData.agency = agencyDoc.agencyCode || agencyDoc.name;
      }
    }

    // Link nodal officer if passed or found by email
    if (updateData.nodalOfficer && mongoose.Types.ObjectId.isValid(updateData.nodalOfficer)) {
      updateData.nodalOfficerId = updateData.nodalOfficer;
    } else if (updateData.nodalOfficerEmail) {
      const nodalUser = await User.findOne({
        $or: [
          { officialEmail: new RegExp(`^${updateData.nodalOfficerEmail.trim()}$`, 'i') },
          { email: new RegExp(`^${updateData.nodalOfficerEmail.trim()}$`, 'i') }
        ]
      });
      if (nodalUser) {
        updateData.nodalOfficer = nodalUser._id;
        updateData.nodalOfficerId = nodalUser._id;
      }
    }

    // Link reporting officers if passed or found by email
    if (updateData.reportingOfficers && Array.isArray(updateData.reportingOfficers)) {
      const validIds = updateData.reportingOfficers.filter(id => id && mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        updateData.reportingOfficers = validIds;
        updateData.reportingOfficerId = validIds[0];
      }
    } else if (updateData.reportingOfficerEmail) {
      const roUser = await User.findOne({
        $or: [
          { officialEmail: new RegExp(`^${updateData.reportingOfficerEmail.trim()}$`, 'i') },
          { email: new RegExp(`^${updateData.reportingOfficerEmail.trim()}$`, 'i') }
        ]
      });
      if (roUser) {
        updateData.reportingOfficers = [roUser._id];
        updateData.reportingOfficerId = roUser._id;
      }
    }

    const project = await Project.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
      .populate('implementationAgencyId ministryId')
      .populate('nodalOfficer', 'name fullName officialEmail phone designation')
      .populate('reportingOfficers', 'name fullName officialEmail phone designation');

    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    // Asynchronously recalculate sanctioned capital for the affected ministry & agency
    recalculateProjectEntities(project).catch(err => {
      console.error('Error recalculating capital after project update:', err);
    });

    await logAuditEvent({
      userId: req.user._id || req.user.id,
      action: 'PROJECT_UPDATED',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { projectName: project.projectName, changes: Object.keys(updateData) },
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

    // Asynchronously recalculate sanctioned capital for the affected ministry & agency
    recalculateProjectEntities(project).catch(err => {
      console.error('Error recalculating capital after project deletion:', err);
    });

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

/**
 * Get Similar Past Projects & Benchmark Report Summary
 * Used by Implementation Agencies to analyze historical patterns & risk benchmarks
 */
export async function getSimilarProjectBenchmarks(req, res) {
  try {
    const { sector, totalCost, state, projectType } = req.query;

    const sectorTerms = (sector || '').toLowerCase();
    let sectorRegex = null;
    if (sectorTerms.includes('road') || sectorTerms.includes('highway')) {
      sectorRegex = /road|highway/i;
    } else if (sectorTerms.includes('rail')) {
      sectorRegex = /rail/i;
    } else if (sectorTerms.includes('power') || sectorTerms.includes('energy') || sectorTerms.includes('solar') || sectorTerms.includes('hydro') || sectorTerms.includes('thermal') || sectorTerms.includes('coal')) {
      sectorRegex = /power|energy|hydro|solar|thermal|coal/i;
    } else if (sectorTerms.includes('port') || sectorTerms.includes('ship') || sectorTerms.includes('waterway')) {
      sectorRegex = /port|shipping|waterway/i;
    } else if (sectorTerms.includes('petroleum') || sectorTerms.includes('gas') || sectorTerms.includes('oil')) {
      sectorRegex = /petroleum|gas|oil/i;
    } else if (sectorTerms.includes('avia') || sectorTerms.includes('airport')) {
      sectorRegex = /avia|airport/i;
    } else if (sectorTerms.includes('urban') || sectorTerms.includes('metro') || sectorTerms.includes('transit')) {
      sectorRegex = /urban|metro|transit/i;
    } else if (sectorTerms.includes('water') || sectorTerms.includes('irrigation')) {
      sectorRegex = /water|irrigation/i;
    } else if (sectorTerms.includes('health') || sectorTerms.includes('hospital') || sectorTerms.includes('medical')) {
      sectorRegex = /health|hospital|medical/i;
    } else if (sectorTerms.includes('telecom') || sectorTerms.includes('communication')) {
      sectorRegex = /telecom|communication/i;
    } else if (sectorTerms.includes('steel') || sectorTerms.includes('mining')) {
      sectorRegex = /steel|mining/i;
    } else if (sector && sector.trim()) {
      sectorRegex = new RegExp(sector.trim().replace(/&/g, '').split(' ')[0], 'i');
    }

    let stateRegex = null;
    if (state && typeof state === 'string' && state.trim() && !/pan[- ]?india|all/i.test(state.trim())) {
      stateRegex = new RegExp(state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    // 1. Precise Match: Same Sector AND Same State
    let sameSectorAndStateProjects = [];
    if (sectorRegex && stateRegex) {
      sameSectorAndStateProjects = await Project.find({
        sector: sectorRegex,
        state: stateRegex
      })
      .sort({ riskScore: -1, delayMonths: -1 })
      .limit(10)
      .select('projectName projectCode sector subSector state district originalProjectCost revisedProjectCost expenditure physicalProgress financialProgress riskScore riskLevel delayDays delayMonths status projectStatus delayReason primaryDelayReason')
      .lean();
    }

    // 2. Secondary Match: Same State or Same Sector
    let sameSectorOrStateProjects = [];
    if (sameSectorAndStateProjects.length < 8) {
      const orFilter = [];
      if (sectorRegex) orFilter.push({ sector: sectorRegex });
      if (stateRegex) orFilter.push({ state: stateRegex });

      if (orFilter.length > 0) {
        sameSectorOrStateProjects = await Project.find({
          $or: orFilter,
          _id: { $nin: sameSectorAndStateProjects.map(p => p._id) }
        })
        .sort({ riskScore: -1, delayMonths: -1 })
        .limit(10 - sameSectorAndStateProjects.length)
        .select('projectName projectCode sector subSector state district originalProjectCost revisedProjectCost expenditure physicalProgress financialProgress riskScore riskLevel delayDays delayMonths status projectStatus delayReason primaryDelayReason')
        .lean();
      }
    }

    let combinedProjects = [...sameSectorAndStateProjects, ...sameSectorOrStateProjects];

    // 3. Fallback to top projects if still low
    if (combinedProjects.length < 5) {
      const fallback = await Project.find({
        _id: { $nin: combinedProjects.map(p => p._id) }
      })
      .sort({ riskScore: -1 })
      .limit(10 - combinedProjects.length)
      .select('projectName projectCode sector subSector state district originalProjectCost revisedProjectCost expenditure physicalProgress financialProgress riskScore riskLevel delayDays delayMonths status projectStatus delayReason primaryDelayReason')
      .lean();
      combinedProjects = [...combinedProjects, ...fallback];
    }

    // Compute aggregated metrics for peer projects in same sector & state
    const pool = combinedProjects.length > 0 ? combinedProjects : [];
    const delays = pool.map(p => Number(p.delayMonths) || Math.round((Number(p.delayDays) || 0) / 30.4));
    const avgDelayMonths = delays.length > 0 ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10 : 12;
    const maxDelayMonths = delays.length > 0 ? Math.max(...delays) : 24;

    const riskScores = pool.map(p => Number(p.riskScore) || 50);
    const avgRiskScore = riskScores.length > 0 ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 58;

    const riskDist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    pool.forEach(p => {
      const lvl = (p.riskLevel || 'MEDIUM').toUpperCase();
      if (riskDist[lvl] !== undefined) riskDist[lvl]++;
      else riskDist.MEDIUM++;
    });

    // Compute cost overrun %
    const overruns = pool.map(p => {
      const orig = Number(p.originalProjectCost) || 0;
      const rev = Number(p.revisedProjectCost) || orig;
      return orig > 0 && rev > orig ? ((rev - orig) / orig) * 100 : 0;
    });
    const avgCostOverrunPct = overruns.length > 0 ? Math.round((overruns.reduce((a, b) => a + b, 0) / overruns.length) * 10) / 10 : 8.5;

    const benchmarkSummary = {
      matchedSector: sector || 'Infrastructure',
      matchedState: state || 'All Regions',
      sameSectorAndStateCount: sameSectorAndStateProjects.length,
      sampleProjectsCount: combinedProjects.length,
      averageDelayMonths: avgDelayMonths,
      averageDelayDays: Math.round(avgDelayMonths * 30.4),
      maxDelayMonths: maxDelayMonths,
      averageRiskScore: avgRiskScore,
      riskDistribution: riskDist,
      averageCostOverrunPct: avgCostOverrunPct,
      primaryDelayFactors: [
        { factor: 'Statutory & Forest Clearances', probability: 44, impactLevel: 'HIGH' },
        { factor: 'Right-of-Way & Land Handover', probability: 34, impactLevel: 'HIGH' },
        { factor: 'Utility Shifting (Power/Water Grid)', probability: 16, impactLevel: 'MEDIUM' },
        { factor: 'Monsoon & Terrain Hindrance', probability: 6, impactLevel: 'LOW' }
      ],
      aiRecommendations: [
        `Historical ${sector || 'sector'} projects in ${state || 'this region'} encounter an average schedule delay of ${avgDelayMonths} months.`,
        `Stage-1 & Stage-2 Forest and Environmental clearances should be pre-tracked prior to EPC commercial mobilization.`,
        `Establish dedicated quarterly monitoring for contiguous Right-of-Way (RoW) acquisition in ${state || 'the state'}.`
      ],
      similarProjects: combinedProjects
    };

    return sendSuccess(res, 'Similar projects and benchmark analysis retrieved successfully.', benchmarkSummary);
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve benchmark projects.', [], 500);
  }
}

/**
 * Record Officer Action or Ministry Policy Action on a Project
 */
export async function recordProjectAction(req, res) {
  try {
    const { id } = req.params;
    const {
      actionType = 'OFFICER_ACTION', // 'OFFICER_ACTION' or 'POLICY_ACTION'
      actionCategory, // 'SHOW_CAUSE', 'GROUND_AUDIT', 'CCI_FAST_TRACK', 'MITIGATION_MEMO', 'FUND_REALLOCATION', 'CLEARANCE_TASKFORCE'
      actionTitle,
      remarks,
      newStatus,
      targetAlertId
    } = req.body;

    const userId = req.user._id || req.user.id;
    let project = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id);
    }
    if (!project) {
      project = await Project.findOne({
        $or: [
          { projectCode: id },
          { projectCode: { $regex: new RegExp(`^${id}$`, 'i') } },
          { id: id }
        ]
      });
    }

    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    const actionRecord = {
      actionId: `ACT-${Date.now().toString().slice(-6)}`,
      actionType,
      actionCategory: actionCategory || (actionType === 'POLICY_ACTION' ? 'MINISTERIAL_DIRECTIVE' : 'NODAL_INTERVENTION'),
      title: actionTitle || `${actionType === 'POLICY_ACTION' ? 'Policy Directive' : 'Nodal Officer Action'}: ${actionCategory || 'Ground Review'}`,
      remarks: remarks || 'Official governance action recorded on project dossier.',
      takenBy: userId,
      takenByName: req.user.fullName || req.user.name || 'NIVARA Officer',
      takenByRole: req.user.role,
      takenAt: new Date(),
      previousStatus: project.projectStatus || project.status || 'IN_PROGRESS',
      updatedStatus: newStatus || project.projectStatus || 'MITIGATION_ACTIVE'
    };

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      {
        $push: {
          actionHistory: {
            $each: [actionRecord],
            $position: 0
          }
        },
        $set: {
          latestAction: actionRecord,
          ...(newStatus ? { projectStatus: newStatus, status: newStatus } : {})
        }
      },
      { new: true }
    );

    // If associated alert exists, update or resolve it
    if (targetAlertId) {
      await Alert.findByIdAndUpdate(targetAlertId, {
        status: newStatus === 'RESOLVED' || newStatus === 'ON_TRACK' ? 'RESOLVED' : 'ACKNOWLEDGED',
        resolutionRemarks: remarks,
        resolvedAt: new Date(),
        resolvedBy: userId
      });
    }

    // Officer actions strictly notify ONLY the assigned Reporting Officer(s)
    try {
      const reportingOfficerIds = new Set();
      if (project.reportingOfficerId) {
        reportingOfficerIds.add(project.reportingOfficerId.toString());
      }
      if (Array.isArray(project.reportingOfficers)) {
        project.reportingOfficers.forEach(ro => {
          const roId = (ro._id || ro)?.toString();
          if (roId) reportingOfficerIds.add(roId);
        });
      }

      // If no explicit reporting officer field on project, find user(s) assigned as REPORTING_OFFICER for this project or agency
      if (reportingOfficerIds.size === 0) {
        const agencyRef = project.implementationAgencyId || project.implementingAgencyId;
        const assignedROs = await User.find({
          role: 'REPORTING_OFFICER',
          $or: [
            { projectIds: project._id },
            ...(agencyRef ? [{ agencyId: agencyRef }] : [])
          ]
        }).select('_id');
        assignedROs.forEach(ro => reportingOfficerIds.add(ro._id.toString()));
      }

      for (const roId of reportingOfficerIds) {
        await Notification.create({
          userId: roId,
          projectId: project._id,
          title: `Action Directive: ${project.projectName || 'Project'}`,
          message: `${actionRecord.title} — Status updated to ${actionRecord.updatedStatus}. Directives: ${actionRecord.remarks}`,
          type: 'ACTION_TAKEN',
          severity: actionRecord.actionType === 'POLICY_ACTION' ? 'HIGH' : 'MEDIUM'
        }).catch(err => console.warn('Action notification creation warning:', err.message));
      }
    } catch (notifErr) {
      console.warn('Action notification error:', notifErr.message);
    }

    await logAuditEvent({
      userId,
      action: actionType === 'POLICY_ACTION' ? 'PROJECT_POLICY_ACTION_TAKEN' : 'PROJECT_OFFICER_ACTION_TAKEN',
      resourceType: 'PROJECT',
      resourceId: project._id,
      details: { actionCategory, actionTitle, newStatus, remarks },
      ipAddress: req.ip
    });

    return sendSuccess(res, 'Action recorded and project status updated successfully.', {
      action: actionRecord,
      projectStatus: updatedProject?.projectStatus || updatedProject?.status || project.projectStatus,
      actionHistory: updatedProject?.actionHistory || [actionRecord]
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to record action.', [], 500);
  }
}

/**
 * Fetch AI Risk Prediction, SHAP Explainability & Anomaly Analysis for a Project
 */
export async function getProjectAiPrediction(req, res) {
  try {
    const { id } = req.params;
    let project = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id).populate('implementationAgencyId ministryId');
    }
    if (!project) {
      project = await Project.findOne({
        $or: [{ projectCode: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
      }).populate('implementationAgencyId ministryId');
    }

    if (!project) {
      return sendError(res, 'Project not found for AI prediction.', [], 404);
    }

    const aiAnalysis = await getProjectAiAnalysis(project);
    return sendSuccess(res, 'AI model prediction retrieved successfully.', aiAnalysis);
  } catch (err) {
    return sendError(res, err.message || 'Failed to generate AI prediction.', [], 500);
  }
}
