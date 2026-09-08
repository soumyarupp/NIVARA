import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import {
  inviteNewUser,
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
 * Returns users bounded strictly by caller's organization hierarchy
 */
export const listUsers = async (req, res, next) => {
  try {
    const { role, status, organizationId, search } = req.query;
    const filter = {};

    // Apply organizational boundary
    if (req.user.role !== 'IPMD_ADMIN') {
      const accessibleOrgs = await getAccessibleOrganizationIds(req.user);
      filter.organizationId = { $in: accessibleOrgs };
    } else if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { officialEmail: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
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
