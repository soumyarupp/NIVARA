import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { Ministry } from '../models/Ministry.js';
import { Project } from '../models/Project.js';
import { createAndSendInvitation } from './invitation.service.js';
import { logAuditEvent } from './audit.service.js';
import { getAccessibleOrganizationIds } from './organization.service.js';
import { hashPassword } from '../utils/password.js';

/**
 * Validate institutional permission matrix for creating/inviting a user with a given role.
 * Rules:
 * 1. Ministry Officer / Admin -> Can ONLY create Implementation Agency accounts.
 * 2. Implementation Agency -> Can ONLY create Nodal Officers and Reporting Officers.
 * 3. Super Admin / IPMD Admin -> Can create all roles.
 * 4. Nodal / Reporting Officers -> Cannot create any accounts.
 */
export const validateUserCreationAuthority = async (creatorUser, targetRole, targetOrgId, targetAgencyId) => {
  const creatorRole = creatorUser.role;

  // Rule 1: Nodal and Reporting Officers cannot create any accounts
  if (['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(creatorRole)) {
    throw new Error('Officers are not authorized to create or invite users.');
  }

  // Rule 2: Super Admin / IPMD Admin can create any role
  if (['SUPER_ADMIN', 'IPMD_ADMIN'].includes(creatorRole)) {
    return;
  }

  // Rule 3: Ministry Officer / Ministry Admin permissions
  if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(creatorRole)) {
    if (!['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(targetRole)) {
      throw new Error('Ministry Officers are only authorized to create Implementation Agency accounts.');
    }
    return;
  }

  // Rule 4: Implementation Agency / Agency Admin permissions
  // Agency ONLY controls (creates) Nodal Officers and Reporting Officers
  if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(creatorRole)) {
    if (!['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(targetRole)) {
      throw new Error('Implementation Agencies are only authorized to create Nodal Officers and Reporting Officers.');
    }
    return;
  }

  throw new Error('Unauthorized account creation request.');
};

/**
 * Direct Account Creation Service (with password)
 */
export const createUserAccount = async ({
  creatorUser,
  userData,
  ipAddress,
  userAgent
}) => {
  const normalizedEmail = (userData.officialEmail || userData.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Official email address is required.');
  }

  // 1. Check duplicate email
  const existingUser = await User.findOne({
    $or: [{ officialEmail: normalizedEmail }, { email: normalizedEmail }]
  });
  if (existingUser) {
    throw new Error(`A user with email ${normalizedEmail} already exists.`);
  }

  const targetRole = userData.role;
  let resolvedMinistryId = userData.ministryId || userData.ministry || null;
  let resolvedAgencyId = userData.agencyId || userData.agency || null;
  let resolvedOrgId = userData.organizationId || null;

  // 2. Enforce Creator Role Jurisdiction & Resolve Agency/Ministry
  if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(creatorUser.role)) {
    if (!['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(targetRole)) {
      throw new Error('Ministry Officers are only authorized to create Implementation Agency accounts.');
    }
    resolvedMinistryId = creatorUser.ministryId || creatorUser.organizationId;
    if (resolvedAgencyId) {
      const ag = await ImplementationAgency.findById(resolvedAgencyId);
      if (ag && ag.ministryId && creatorUser.ministryId && ag.ministryId.toString() !== creatorUser.ministryId.toString()) {
        throw new Error('You do not have jurisdiction over this Implementation Agency.');
      }
    }
  } else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(creatorUser.role)) {
    if (!['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(targetRole)) {
      throw new Error('Implementation Agencies can only create Nodal Officers and Reporting Officers.');
    }
    resolvedAgencyId = creatorUser.agencyId || creatorUser.organizationId || userData.agencyId || userData.agency;
    resolvedMinistryId = creatorUser.ministryId || userData.ministryId || userData.ministry || null;
    if (resolvedAgencyId && !resolvedMinistryId) {
      const ag = await ImplementationAgency.findById(resolvedAgencyId);
      if (ag && ag.ministryId) {
        resolvedMinistryId = ag.ministryId;
      }
    }
  } else if (['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(creatorUser.role)) {
    throw new Error('Officers are not authorized to create accounts.');
  }

  await validateUserCreationAuthority(creatorUser, targetRole, resolvedOrgId, resolvedAgencyId);

  const fullName = (userData.fullName || userData.name || '').trim();
  if (!fullName) {
    throw new Error('Official Full Name is required.');
  }

  if (!userData.password || typeof userData.password !== 'string' || userData.password.trim() === '') {
    throw new Error('Password is required.');
  }
  if (userData.password.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (!targetRole) {
    throw new Error('System Role is required.');
  }

  const phone = (userData.mobileNumber || userData.phone || '').trim();
  if (!phone) {
    throw new Error('Contact Phone number is required.');
  }

  // 3. Hash secret password
  const rawPassword = userData.password.trim();
  const passwordHash = await hashPassword(rawPassword);

  // Resolve agency info for smart codes
  let agencyCode = 'AGY';
  if (resolvedAgencyId) {
    const ag = await ImplementationAgency.findById(resolvedAgencyId);
    if (ag && (ag.agencyCode || ag.code)) {
      agencyCode = ag.agencyCode || ag.code;
    }
  }

  // Automatic smart defaults for designation, department, and employeeId based on role & agency
  let defaultDesignation = 'Government Infrastructure Official';
  let defaultDepartment = 'Infrastructure Project Directorate';
  let defaultEmployeeId = `${agencyCode}-${Math.floor(100 + Math.random() * 900)}`;

  if (targetRole === 'NODAL_OFFICER') {
    defaultDesignation = `Project Director / Nodal Officer (${agencyCode})`;
    defaultDepartment = 'Project Monitoring & AI Vigilance Directorate';
    defaultEmployeeId = `${agencyCode}-NOD-${Math.floor(100 + Math.random() * 900)}`;
  } else if (targetRole === 'REPORTING_OFFICER') {
    defaultDesignation = `Resident Engineer / Field Reporting Officer`;
    defaultDepartment = 'Field Supervision & Ground Progress Unit';
    defaultEmployeeId = `${agencyCode}-REP-${Math.floor(100 + Math.random() * 900)}`;
  } else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(targetRole)) {
    defaultDesignation = `Chief General Manager / Agency Head (${agencyCode})`;
    defaultDepartment = 'Project Implementation & Execution Wing';
    defaultEmployeeId = `${agencyCode}-CGM-${Math.floor(100 + Math.random() * 900)}`;
  } else if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(targetRole)) {
    defaultDesignation = 'Joint Secretary / Ministry Nodal Officer';
    defaultDepartment = 'Infrastructure Planning & Project Directorate';
    defaultEmployeeId = `MIN-${Math.floor(100 + Math.random() * 900)}`;
  } else if (targetRole === 'SUPER_ADMIN') {
    defaultDesignation = 'Principal Secretary / Super Administrator';
    defaultDepartment = 'Cabinet Secretariat / Central Project Monitoring Cell';
    defaultEmployeeId = `NIVARA-SA-${Math.floor(100 + Math.random() * 900)}`;
  } else if (targetRole === 'IPMD_ADMIN') {
    defaultDesignation = 'Director & IPMD Administrator';
    defaultDepartment = 'Infrastructure Project Monitoring Division';
    defaultEmployeeId = `IPMD-DIR-${Math.floor(100 + Math.random() * 900)}`;
  }

  const finalDesignation = (userData.designation || '').trim() || defaultDesignation;
  const finalDepartment = (userData.department || '').trim() || defaultDepartment;
  const finalEmployeeId = (userData.employeeId || '').trim() || defaultEmployeeId;

  if (!finalDesignation) {
    throw new Error('Designation is required.');
  }
  if (!finalDepartment) {
    throw new Error('Department is required.');
  }
  if (!finalEmployeeId) {
    throw new Error('Employee ID is required.');
  }

  // 4. Create User Record in ACTIVE status
  const newUser = new User({
    name: fullName,
    fullName: fullName,
    email: normalizedEmail,
    officialEmail: normalizedEmail,
    mobileNumber: phone,
    phone: phone,
    designation: finalDesignation,
    employeeId: finalEmployeeId,
    department: finalDepartment,
    ministryId: resolvedMinistryId,
    agencyId: resolvedAgencyId,
    organizationId: resolvedOrgId || resolvedAgencyId || resolvedMinistryId,
    role: targetRole,
    projectIds: userData.projectIds || [],
    password: passwordHash,
    passwordHash: passwordHash,
    status: 'ACTIVE',
    isActive: true,
    emailVerified: true,
    createdBy: creatorUser._id || creatorUser.id
  });

  await newUser.save();

  // 5. Update project references if projectIds provided
  if (newUser.projectIds && newUser.projectIds.length > 0) {
    if (newUser.role === 'REPORTING_OFFICER') {
      await Project.updateMany(
        { _id: { $in: newUser.projectIds } },
        { reportingOfficerId: newUser._id }
      );
    } else if (newUser.role === 'NODAL_OFFICER') {
      await Project.updateMany(
        { _id: { $in: newUser.projectIds } },
        { nodalOfficerId: newUser._id, nodalOfficer: newUser._id }
      );
    }
  }

  await logAuditEvent({
    userId: creatorUser._id || creatorUser.id,
    action: 'USER_CREATED',
    targetUserId: newUser._id,
    resourceType: 'User',
    resourceId: newUser._id.toString(),
    ipAddress,
    userAgent,
    metadata: {
      role: newUser.role,
      officialEmail: newUser.officialEmail,
      agencyId: resolvedAgencyId,
      ministryId: resolvedMinistryId
    }
  });

  return {
    id: newUser._id,
    _id: newUser._id,
    name: newUser.name,
    fullName: newUser.fullName,
    email: newUser.email,
    officialEmail: newUser.officialEmail,
    role: newUser.role,
    designation: newUser.designation,
    ministryId: newUser.ministryId,
    agencyId: newUser.agencyId,
    status: newUser.status,
    isActive: newUser.isActive,
    projectIds: newUser.projectIds
  };
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

  const actorRole = actorUser.role;

  // 1. Authority Validation
  if (['SUPER_ADMIN', 'IPMD_ADMIN'].includes(actorRole)) {
    // Super Admin has full jurisdiction
  } else if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(actorRole)) {
    // Ministry can only activate/deactivate Implementation Agency accounts under their ministry
    if (!['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(targetUser.role)) {
      throw new Error('Ministry Officers are only authorized to activate or deactivate Implementation Agency accounts.');
    }
    const actorMinId = actorUser.ministryId || actorUser.organizationId;
    const targetMinId = targetUser.ministryId || targetUser.organizationId;
    if (actorMinId && targetMinId && actorMinId.toString() !== targetMinId.toString()) {
      throw new Error('Cannot modify status of an agency outside your Ministry jurisdiction.');
    }
  } else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(actorRole)) {
    // Agency ONLY controls (activates & deactivates) Nodal Officers and Reporting Officers under their agency
    if (!['NODAL_OFFICER', 'REPORTING_OFFICER'].includes(targetUser.role)) {
      throw new Error('Implementation Agencies can only activate or deactivate Nodal Officers and Reporting Officers.');
    }
    const actorAgId = actorUser.agencyId || actorUser.organizationId;
    const targetAgId = targetUser.agencyId || targetUser.organizationId;
    if (actorAgId && targetAgId && actorAgId.toString() !== targetAgId.toString()) {
      throw new Error('Cannot modify status of an officer outside your Agency.');
    }
  } else {
    throw new Error('You do not have permission to alter user status.');
  }

  const oldStatus = targetUser.status;
  const newStatus = typeof status === 'boolean' 
    ? (status ? 'ACTIVE' : 'DEACTIVATED') 
    : (['ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED'].includes(status) ? status : (status ? 'ACTIVE' : 'DEACTIVATED'));

  targetUser.status = newStatus;
  targetUser.isActive = newStatus === 'ACTIVE';
  await targetUser.save();

  await logAuditEvent({
    userId: actorUser._id || actorUser.id,
    action: `USER_STATUS_UPDATED_${newStatus}`,
    targetUserId: targetUser._id,
    resourceType: 'User',
    resourceId: targetUser._id.toString(),
    ipAddress,
    userAgent,
    metadata: { oldStatus, newStatus }
  });

  return {
    id: targetUser._id,
    _id: targetUser._id,
    fullName: targetUser.fullName || targetUser.name,
    name: targetUser.name || targetUser.fullName,
    status: targetUser.status,
    isActive: targetUser.isActive
  };
};
