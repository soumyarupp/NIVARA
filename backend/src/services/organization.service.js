import { Organization } from '../models/Organization.js';
import { Project } from '../models/Project.js';

/**
 * Get all organization IDs accessible to the authenticated user.
 * - IPMD_ADMIN: All organizations (null means no filter needed)
 * - MINISTRY_ADMIN: Their ministry + all child implementing agencies
 * - AGENCY_ADMIN: Their implementing agency only
 * - NODAL_OFFICER / REPORTING_OFFICER: Their agency
 * @param {object} user 
 * @returns {Promise<string[]|null>} array of Organization ObjectIds or null for global access
 */
export const getAccessibleOrganizationIds = async (user) => {
  if (user.role === 'IPMD_ADMIN') {
    return null; // Global access
  }

  if (user.role === 'MINISTRY_ADMIN') {
    if (!user.organizationId) return [];
    const childAgencies = await Organization.find({
      parentOrganizationId: user.organizationId,
      status: 'ACTIVE'
    }).select('_id');
    return [user.organizationId.toString(), ...childAgencies.map((a) => a._id.toString())];
  }

  if (user.organizationId) {
    return [user.organizationId.toString()];
  }

  return [];
};

/**
 * Verify if user can access/manage a target organization.
 * @param {object} user 
 * @param {string} targetOrgId 
 * @returns {Promise<boolean>}
 */
export const canAccessOrganization = async (user, targetOrgId) => {
  if (!targetOrgId) return false;
  if (user.role === 'IPMD_ADMIN') return true;

  const accessibleIds = await getAccessibleOrganizationIds(user);
  if (!accessibleIds) return true;
  return accessibleIds.includes(targetOrgId.toString());
};

/**
 * Verify if user can access a specific project.
 * - IPMD_ADMIN: Can access all projects
 * - MINISTRY_ADMIN: Can access projects under their line ministry or child agencies
 * - AGENCY_ADMIN: Can access projects assigned to their agency
 * - NODAL_OFFICER / REPORTING_OFFICER: Can access only projects explicitly assigned to them
 * @param {object} user 
 * @param {object} project 
 * @returns {Promise<boolean>}
 */
export const canAccessProject = async (user, project) => {
  if (!project) return false;
  if (user.role === 'IPMD_ADMIN') return true;

  if (user.role === 'MINISTRY_ADMIN') {
    if (project.lineMinistryId && project.lineMinistryId.toString() === user.organizationId?.toString()) {
      return true;
    }
    const accessibleAgencies = await getAccessibleOrganizationIds(user);
    return accessibleAgencies.includes(project.implementingAgencyId?.toString());
  }

  if (user.role === 'AGENCY_ADMIN') {
    return project.implementingAgencyId?.toString() === user.organizationId?.toString();
  }

  if (user.role === 'NODAL_OFFICER') {
    const uid = user._id?.toString() || user.id?.toString();
    const nodalId = project.nodalOfficerId?.toString() || project.nodalOfficer?._id?.toString() || project.nodalOfficer?.toString();
    const userProjects = (user.projectIds || []).map((p) => p.toString());
    return (
      nodalId === uid ||
      userProjects.includes(project._id?.toString())
    );
  }

  if (user.role === 'REPORTING_OFFICER') {
    const uid = user._id?.toString() || user.id?.toString();
    const repId = project.reportingOfficerId?.toString();
    const officersList = (project.reportingOfficers || []).map(o => (o._id || o).toString());
    const userProjects = (user.projectIds || []).map((p) => p.toString());
    return (
      repId === uid ||
      officersList.includes(uid) ||
      userProjects.includes(project._id?.toString())
    );
  }

  return false;
};
