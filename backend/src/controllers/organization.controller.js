import { Organization } from '../models/Organization.js';
import { getAccessibleOrganizationIds } from '../services/organization.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] || null
});

/**
 * POST /api/organizations/ministry
 * (IPMD_ADMIN only)
 */
export const createMinistry = async (req, res, next) => {
  try {
    const { name, code, officialEmail, phone, address } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const existing = await Organization.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, `Organization with code ${code.toUpperCase()} already exists.`, [], 409);
    }

    const ministry = await Organization.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: 'MINISTRY',
      parentOrganizationId: null,
      officialEmail: officialEmail?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      status: 'ACTIVE',
      createdBy: req.user._id
    });

    await logAuditEvent({
      userId: req.user._id,
      action: 'MINISTRY_CREATED',
      resourceType: 'Organization',
      resourceId: ministry._id.toString(),
      ipAddress,
      userAgent,
      metadata: { code: ministry.code, name: ministry.name }
    });

    return sendSuccess(res, 'Ministry created successfully', { ministry }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/organizations/agency
 * (IPMD_ADMIN or MINISTRY_ADMIN)
 */
export const createAgency = async (req, res, next) => {
  try {
    const { name, code, parentOrganizationId, officialEmail, phone, address } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    let ministryId = parentOrganizationId;

    if (req.user.role === 'MINISTRY_ADMIN') {
      ministryId = req.user.organizationId;
    }

    if (!ministryId) {
      return sendError(res, 'Parent Ministry ID is required for an Implementing Agency.', [], 400);
    }

    const parentMinistry = await Organization.findById(ministryId);
    if (!parentMinistry || parentMinistry.type !== 'MINISTRY') {
      return sendError(res, 'Parent organization must be an existing Ministry.', [], 400);
    }

    const existing = await Organization.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, `Organization with code ${code.toUpperCase()} already exists.`, [], 409);
    }

    const agency = await Organization.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: 'IMPLEMENTING_AGENCY',
      parentOrganizationId: ministryId,
      officialEmail: officialEmail?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      status: 'ACTIVE',
      createdBy: req.user._id
    });

    await logAuditEvent({
      userId: req.user._id,
      action: 'IMPLEMENTING_AGENCY_CREATED',
      resourceType: 'Organization',
      resourceId: agency._id.toString(),
      ipAddress,
      userAgent,
      metadata: { code: agency.code, name: agency.name, parentMinistryId: ministryId }
    });

    return sendSuccess(res, 'Implementing Agency created successfully', { agency }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/organizations
 */
export const listOrganizations = async (req, res, next) => {
  try {
    const { type, parentOrganizationId } = req.query;
    const filter = {};

    if (req.user.role !== 'IPMD_ADMIN') {
      const accessibleIds = await getAccessibleOrganizationIds(req.user);
      filter._id = { $in: accessibleIds };
    } else {
      if (parentOrganizationId) filter.parentOrganizationId = parentOrganizationId;
    }

    if (type) filter.type = type;

    const organizations = await Organization.find(filter)
      .populate('parentOrganizationId', 'name code')
      .sort({ name: 1 });

    return sendSuccess(res, 'Organizations retrieved successfully', { count: organizations.length, organizations }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/organizations/:id
 */
export const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id).populate('parentOrganizationId', 'name code');

    if (!organization) {
      return sendError(res, 'Organization not found', [], 404);
    }

    if (req.user.role !== 'IPMD_ADMIN') {
      const accessibleIds = await getAccessibleOrganizationIds(req.user);
      if (!accessibleIds.includes(organization._id.toString())) {
        return sendError(res, 'Access denied to this organization.', [], 403);
      }
    }

    return sendSuccess(res, 'Organization retrieved', { organization }, 200);
  } catch (error) {
    next(error);
  }
};
