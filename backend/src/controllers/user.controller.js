import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { Ministry } from '../models/Ministry.js';
import {
  inviteNewUser,
  createUserAccount,
  assignProjectToUser,
  removeProjectFromUser,
  updateUserStatus
} from '../services/user.service.js';
import { getAccessibleOrganizationIds } from '../services/organization.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] || null
});

/**
 * POST /api/users
 * Direct user creation by authorized authority in institutional hierarchy
 */
export const createUser = async (req, res, next) => {
  try {
    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await createUserAccount({
      creatorUser: req.user,
      userData: req.body,
      ipAddress,
      userAgent
    });

    return sendSuccess(res, 'User account created successfully', result, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * POST /api/users/invite
 */
export const inviteUser = async (req, res, next) => {
  try {
    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await inviteNewUser({
      creatorUser: req.user,
      userData: req.body,
      ipAddress,
      userAgent
    });

    return sendSuccess(res, 'Account invitation sent successfully', result, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * GET /api/users
 * Returns users bounded strictly by caller's institutional hierarchy
 */
export const listUsers = async (req, res, next) => {
  try {
    const { role, status, organizationId, ministryId, agencyId, search } = req.query;
    const filter = {};
    const callerRole = req.user?.role || 'SUPER_ADMIN';

    // Apply strict institutional jurisdiction
    if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(callerRole)) {
      const userMinId = req.user.ministryId || req.user.organizationId;
      const childAgencies = await ImplementationAgency.find({ ministryId: userMinId }).select('_id');
      const agencyIds = childAgencies.map(a => a._id);
      filter.$or = [
        { ministryId: userMinId },
        { agencyId: { $in: agencyIds } },
        { organizationId: userMinId }
      ];
    } else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(callerRole)) {
      const userAgId = req.user.agencyId || req.user.organizationId;
      filter.$or = [
        { agencyId: userAgId },
        { organizationId: userAgId }
      ];
      filter.role = { $in: ['NODAL_OFFICER', 'REPORTING_OFFICER'] };
    } else if (['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(callerRole)) {
      filter._id = req.user._id || req.user.id;
    } else if (['SUPER_ADMIN', 'IPMD_ADMIN'].includes(callerRole)) {
      if (organizationId) filter.organizationId = organizationId;
      if (ministryId) filter.ministryId = ministryId;
      if (agencyId) filter.agencyId = agencyId;
    }

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: searchRegex },
          { fullName: searchRegex },
          { email: searchRegex },
          { officialEmail: searchRegex },
          { employeeId: searchRegex },
          { designation: searchRegex }
        ]
      });
    }

    const users = await User.find(filter)
      .populate('ministryId', 'name code')
      .populate('agencyId', 'name agencyCode')
      .populate('organizationId', 'name code type')
      .populate('projectIds', 'projectName projectCode')
      .select('-passwordHash -invitationTokenHash -resetPasswordTokenHash')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Users retrieved successfully', { count: users.length, users }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .populate('organizationId', 'name code type')
      .populate('projectIds', 'projectName projectCode')
      .select('-passwordHash -invitationTokenHash -resetPasswordTokenHash');

    if (!user) {
      return sendError(res, 'User not found', [], 404);
    }

    // Boundary check
    if (req.user.role !== 'IPMD_ADMIN') {
      const accessibleOrgs = await getAccessibleOrganizationIds(req.user);
      if (user.organizationId && !accessibleOrgs.includes(user.organizationId._id.toString())) {
        return sendError(res, 'Access denied: User is outside your organizational jurisdiction.', [], 403);
      }
    }

    return sendSuccess(res, 'User details retrieved', { user }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', [], 404);
    }

    // Scope check
    if (req.user.role !== 'IPMD_ADMIN') {
      const accessibleOrgs = await getAccessibleOrganizationIds(req.user);
      if (user.organizationId && !accessibleOrgs.includes(user.organizationId.toString())) {
        return sendError(res, 'Access denied: Cannot edit users outside your jurisdiction.', [], 403);
      }
    }

    if (updates.fullName) user.fullName = updates.fullName.trim();
    if (updates.mobileNumber) user.mobileNumber = updates.mobileNumber.trim();
    if (updates.designation) user.designation = updates.designation.trim();
    if (updates.employeeId) user.employeeId = updates.employeeId.trim();
    if (updates.department) user.department = updates.department.trim();

    await user.save();

    return sendSuccess(res, 'User profile updated successfully', {
      id: user._id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      designation: user.designation,
      employeeId: user.employeeId,
      department: user.department
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/status
 */
export const updateUserStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await updateUserStatus({
      actorUser: req.user,
      targetUserId: id,
      status,
      ipAddress,
      userAgent
    });

    return sendSuccess(res, `User status updated to ${status}`, result, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * POST /api/users/:id/assign-project
 */
export const assignProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await assignProjectToUser({
      actorUser: req.user,
      targetUserId: id,
      projectId,
      ipAddress,
      userAgent
    });

    return sendSuccess(res, 'Project assigned to officer successfully', result, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * DELETE /api/users/:id/project/:projectId
 */
export const removeProject = async (req, res, next) => {
  try {
    const { id, projectId } = req.params;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await removeProjectFromUser({
      actorUser: req.user,
      targetUserId: id,
      projectId,
      ipAddress,
      userAgent
    });

    return sendSuccess(res, 'Project unassigned from officer successfully', result, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};
