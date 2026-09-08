import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Project } from '../models/Project.js';
import { createAndSendInvitation } from './invitation.service.js';
import { logAuditEvent } from './audit.service.js';
import { getAccessibleOrganizationIds } from './organization.service.js';

/**
 * Validate permission matrix for creating a user with a given role and organization.
 */
export const validateUserCreationAuthority = async (creatorUser, targetRole, targetOrgId) => {
  const creatorRole = creatorUser.role;

  // Rule 1: Nodal and Reporting Officers cannot create any accounts
  if (creatorRole === 'NODAL_OFFICER' || creatorRole === 'REPORTING_OFFICER') {
    throw new Error('Officers are not authorized to create or invite users.');
  }

  // Rule 2: IPMD_ADMIN can create any role
  if (creatorRole === 'IPMD_ADMIN') {
    if (targetRole !== 'IPMD_ADMIN' && !targetOrgId) {
      throw new Error(`Organization is required when creating a ${targetRole}`);
    }
    return;
  }

  // Rule 3: MINISTRY_ADMIN permissions
  if (creatorRole === 'MINISTRY_ADMIN') {
    if (targetRole === 'IPMD_ADMIN' || targetRole === 'MINISTRY_ADMIN') {
      throw new Error('Ministry Admins cannot create IPMD Admins or other Ministry Admins.');
    }

    if (!targetOrgId) {
      throw new Error('Target organization ID is required.');
    }

    // Must be a child agency of the creator's ministry
    const targetOrg = await Organization.findById(targetOrgId);
    if (!targetOrg || targetOrg.type !== 'IMPLEMENTING_AGENCY') {
      throw new Error('Ministry Admins can only assign users to Implementing Agencies.');
    }

    if (targetOrg.parentOrganizationId?.toString() !== creatorUser.organizationId?.toString()) {
      throw new Error('You do not have jurisdiction over this Implementing Agency.');
    }

    return;
  }

  // Rule 4: AGENCY_ADMIN permissions
  if (creatorRole === 'AGENCY_ADMIN') {
    if (targetRole !== 'NODAL_OFFICER' && targetRole !== 'REPORTING_OFFICER') {
      throw new Error('Agency Admins can only create Nodal Officers and Reporting Officers.');
    }

    // Must be for their own agency
    if (targetOrgId && targetOrgId.toString() !== creatorUser.organizationId?.toString()) {
      throw new Error('Agency Admins can only create users for their own Implementing Agency.');
    }

    return;
  }

  throw new Error('Unauthorized account creation request.');
};

/**
 * Invite User Service
 */
export const inviteNewUser = async ({
  creatorUser,
  userData,
  ipAddress,
  userAgent
}) => {
  const normalizedEmail = userData.officialEmail.trim().toLowerCase();

  // 1. Check duplicate email
  const existingUser = await User.findOne({ officialEmail: normalizedEmail });
  if (existingUser) {
    throw new Error(`A user with email ${normalizedEmail} already exists.`);
  }

  // 2. Resolve organizationId
  let resolvedOrgId = userData.organizationId;
  if (creatorUser.role === 'AGENCY_ADMIN') {
    resolvedOrgId = creatorUser.organizationId; // Force to Agency Admin's org
  }

  // 3. Validate authority hierarchy
  await validateUserCreationAuthority(creatorUser, userData.role, resolvedOrgId);

  // 4. Validate organization exists (if not IPMD_ADMIN user)
  if (userData.role !== 'IPMD_ADMIN' && resolvedOrgId) {
    const org = await Organization.findById(resolvedOrgId);
    if (!org) {
      throw new Error('Specified organization does not exist.');
    }
    if (org.status !== 'ACTIVE') {
      throw new Error('Cannot invite users to an inactive organization.');
    }

    if (userData.role === 'MINISTRY_ADMIN' && org.type !== 'MINISTRY') {
      throw new Error('Ministry Admin must be assigned to a Ministry organization.');
    }

    if (['AGENCY_ADMIN', 'NODAL_OFFICER', 'REPORTING_OFFICER'].includes(userData.role) && org.type !== 'IMPLEMENTING_AGENCY') {
      throw new Error(`${userData.role} must be assigned to an Implementing Agency.`);
    }
  }

  // 5. Validate initial projects if provided
  if (userData.projectIds && userData.projectIds.length > 0) {
    if (userData.role !== 'NODAL_OFFICER' && userData.role !== 'REPORTING_OFFICER') {
      throw new Error('Projects can only be assigned to Nodal Officers or Reporting Officers.');
    }

    const projects = await Project.find({ _id: { $in: userData.projectIds } });
    if (projects.length !== userData.projectIds.length) {
      throw new Error('One or more specified project IDs are invalid.');
    }

    // Verify projects belong to the same agency
    for (const proj of projects) {
      if (proj.implementingAgencyId.toString() !== resolvedOrgId.toString()) {
        throw new Error(`Project ${proj.projectName} does not belong to the user's implementing agency.`);
      }
    }
  }

  // 6. Create User record in INVITED status
  const newUser = new User({
    fullName: userData.fullName.trim(),
    officialEmail: normalizedEmail,
    mobileNumber: userData.mobileNumber.trim(),
    designation: userData.designation.trim(),
    employeeId: userData.employeeId.trim(),
    department: userData.department.trim(),
    organizationId: resolvedOrgId || null,
    role: userData.role,
    projectIds: userData.projectIds || [],
    status: 'INVITED',
    emailVerified: false,
    createdBy: creatorUser._id
  });

  await newUser.save();

  // 7. Generate invitation token, send email, and log audit
  await createAndSendInvitation({
    user: newUser,
    actorUserId: creatorUser._id,
    ipAddress,
    userAgent
  });

  // If projects were attached, update the projects' officer references
  if (newUser.projectIds && newUser.projectIds.length > 0) {
    if (newUser.role === 'REPORTING_OFFICER') {
      await Project.updateMany(
        { _id: { $in: newUser.projectIds } },
        { reportingOfficerId: newUser._id }
      );
    } else if (newUser.role === 'NODAL_OFFICER') {
      await Project.updateMany(
        { _id: { $in: newUser.projectIds } },
        { nodalOfficerId: newUser._id }
      );
    }
  }

  await logAuditEvent({
    userId: creatorUser._id,
    action: 'USER_CREATED_AND_INVITED',
    targetUserId: newUser._id,
    resourceType: 'User',
    resourceId: newUser._id.toString(),
    ipAddress,
    userAgent,
    metadata: {
      role: newUser.role,
      officialEmail: newUser.officialEmail,
      organizationId: resolvedOrgId
    }
  });

  return {
    id: newUser._id,
    fullName: newUser.fullName,
    officialEmail: newUser.officialEmail,
    role: newUser.role,
    organizationId: newUser.organizationId,
    status: newUser.status,
    projectIds: newUser.projectIds
  };
};

/**
 * Assign Project to Officer
 */
export const assignProjectToUser = async ({
  actorUser,
  targetUserId,
  projectId,
  ipAddress,
  userAgent
}) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  if (targetUser.role !== 'NODAL_OFFICER' && targetUser.role !== 'REPORTING_OFFICER') {
    throw new Error('Projects can only be assigned to Nodal Officers or Reporting Officers.');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }

  // Cross-Agency validation: Target user and project MUST belong to the same Implementing Agency
  if (
    !targetUser.organizationId ||
    !project.implementingAgencyId ||
    targetUser.organizationId.toString() !== project.implementingAgencyId.toString()
  ) {
    throw new Error('Cannot assign project: User and Project belong to different Implementing Agencies.');
  }

  // Actor authorization check
  if (actorUser.role === 'AGENCY_ADMIN') {
    if (actorUser.organizationId?.toString() !== project.implementingAgencyId.toString()) {
      throw new Error('Agency Admins can only assign projects within their own Implementing Agency.');
    }
  } else if (actorUser.role === 'MINISTRY_ADMIN') {
    const accessibleOrgs = await getAccessibleOrganizationIds(actorUser);
    if (!accessibleOrgs.includes(project.implementingAgencyId.toString())) {
      throw new Error('You do not have jurisdiction over this project.');
    }
  } else if (actorUser.role !== 'IPMD_ADMIN') {
    throw new Error('Unauthorized project assignment attempt.');
  }

  // Update user project list
  const currentProjects = targetUser.projectIds.map((p) => p.toString());
  if (!currentProjects.includes(projectId.toString())) {
    targetUser.projectIds.push(project._id);
    await targetUser.save();
  }

  // Update project officer field
  if (targetUser.role === 'REPORTING_OFFICER') {
    project.reportingOfficerId = targetUser._id;
  } else if (targetUser.role === 'NODAL_OFFICER') {
    project.nodalOfficerId = targetUser._id;
  }
  await project.save();

  await logAuditEvent({
    userId: actorUser._id,
    action: 'PROJECT_ASSIGNED_TO_USER',
    targetUserId: targetUser._id,
    resourceType: 'Project',
    resourceId: project._id.toString(),
    ipAddress,
    userAgent,
    metadata: {
      projectId: project._id,
      projectName: project.projectName,
      officerRole: targetUser.role
    }
  });

  return {
    userId: targetUser._id,
    projectId: project._id,
    projectName: project.projectName,
    role: targetUser.role
  };
};

/**
 * Remove Project from Officer
 */
export const removeProjectFromUser = async ({
  actorUser,
  targetUserId,
  projectId,
  ipAddress,
  userAgent
}) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }

  if (actorUser.role === 'AGENCY_ADMIN') {
    if (actorUser.organizationId?.toString() !== project.implementingAgencyId.toString()) {
      throw new Error('Agency Admins can only modify assignments in their own agency.');
    }
  }

  targetUser.projectIds = targetUser.projectIds.filter(
    (p) => p.toString() !== projectId.toString()
  );
  await targetUser.save();

  if (targetUser.role === 'REPORTING_OFFICER' && project.reportingOfficerId?.toString() === targetUserId.toString()) {
    project.reportingOfficerId = null;
    await project.save();
  } else if (targetUser.role === 'NODAL_OFFICER' && project.nodalOfficerId?.toString() === targetUserId.toString()) {
    project.nodalOfficerId = null;
    await project.save();
  }

  await logAuditEvent({
    userId: actorUser._id,
    action: 'PROJECT_REMOVED_FROM_USER',
    targetUserId: targetUser._id,
    resourceType: 'Project',
    resourceId: project._id.toString(),
    ipAddress,
    userAgent,
    metadata: { projectId: project._id, projectName: project.projectName }
  });

  return { success: true };
};

/**
 * Update User Status (ACTIVE, SUSPENDED, DEACTIVATED)
 */
export const updateUserStatus = async ({
  actorUser,
  targetUserId,
  status,
  ipAddress,
  userAgent
}) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  // Prevent modifying higher or equal authority unless IPMD_ADMIN
  if (actorUser.role === 'MINISTRY_ADMIN' && ['IPMD_ADMIN', 'MINISTRY_ADMIN'].includes(targetUser.role)) {
    throw new Error('Ministry Admins cannot change status of Ministry or IPMD Admins.');
  }

  if (actorUser.role === 'AGENCY_ADMIN' && ['IPMD_ADMIN', 'MINISTRY_ADMIN', 'AGENCY_ADMIN'].includes(targetUser.role)) {
    throw new Error('Agency Admins can only change status of Nodal and Reporting Officers.');
  }

  const oldStatus = targetUser.status;
  targetUser.status = status;
  await targetUser.save();

  await logAuditEvent({
    userId: actorUser._id,
    action: `USER_STATUS_UPDATED_${status}`,
    targetUserId: targetUser._id,
    resourceType: 'User',
    resourceId: targetUser._id.toString(),
    ipAddress,
    userAgent,
    metadata: { oldStatus, newStatus: status }
  });

  return {
    id: targetUser._id,
    fullName: targetUser.fullName,
    status: targetUser.status
  };
};
