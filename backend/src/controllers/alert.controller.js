import { Alert } from '../models/Alert.js';
import { Project } from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logAuditEvent } from '../services/audit.service.js';

export async function getAlerts(req, res) {
  try {
    const { severity, alertType, status = 'ACTIVE', projectId } = req.query;
    const query = {};

    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    if (status && status !== 'ALL') query.status = status;

    const callerRole = req.user?.role || 'SUPER_ADMIN';
    const userId = req.user?._id || req.user?.id;

    // Rule 1: Reporting Officers DO NOT receive or view alerts (only submit ground telemetry & past reports)
    if (callerRole === 'REPORTING_OFFICER') {
      return sendSuccess(res, 'Reporting Officers do not receive alerts.', []);
    }

    // Rule 2: Nodal Officers ONLY see alerts for projects explicitly assigned to them
    if (callerRole === 'NODAL_OFFICER') {
      const userProjects = await Project.find({
        $or: [
          { nodalOfficer: userId },
          { nodalOfficerId: userId },
          { _id: { $in: req.user?.projectIds || [] } }
        ]
      }).select('_id');

      const assignedProjectIds = userProjects.map((p) => p._id.toString());
      if (assignedProjectIds.length === 0) {
        return sendSuccess(res, 'No assigned projects found for this Nodal Officer.', []);
      }

      if (projectId) {
        if (!assignedProjectIds.includes(projectId.toString())) {
          return sendSuccess(res, 'You are not assigned as Nodal Officer for this project.', []);
        }
        query.projectId = projectId;
      } else {
        query.projectId = { $in: assignedProjectIds };
      }
    }

    // Rule 3: Implementation Agency receives alerts ONLY IF risk is VERY HIGH or CRITICAL (Escalations)
    else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(callerRole)) {
      const userAgId = req.user?.agencyId || req.user?.organizationId;
      const agencyProjects = await Project.find({
        $or: [
          { implementationAgencyId: userAgId },
          { implementingAgencyId: userAgId },
          { agencyId: userAgId }
        ]
      }).select('_id');

      const agencyProjectIds = agencyProjects.map((p) => p._id.toString());
      if (agencyProjectIds.length === 0) {
        return sendSuccess(res, 'No projects found for your Agency.', []);
      }

      if (projectId) {
        if (!agencyProjectIds.includes(projectId.toString())) {
          return sendSuccess(res, 'Project does not belong to your Agency jurisdiction.', []);
        }
        query.projectId = projectId;
      } else {
        query.projectId = { $in: agencyProjectIds };
      }
      query.severity = { $in: ['CRITICAL', 'HIGH'] };
    }

    // Rule 4: Ministry Officers view alerts for projects under their ministry
    else if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(callerRole)) {
      const userMinId = req.user?.ministryId || req.user?.organizationId;
      const ministryProjects = await Project.find({
        $or: [
          { ministryId: userMinId },
          { lineMinistryId: userMinId }
        ]
      }).select('_id');

      const minProjectIds = ministryProjects.map((p) => p._id.toString());
      if (minProjectIds.length === 0) {
        return sendSuccess(res, 'No projects found under your Ministry.', []);
      }

      if (projectId) {
        if (!minProjectIds.includes(projectId.toString())) {
          return sendSuccess(res, 'Project is outside your Ministry jurisdiction.', []);
        }
        query.projectId = projectId;
      } else {
        query.projectId = { $in: minProjectIds };
      }
    } else if (projectId) {
      query.projectId = projectId;
    }

    const alerts = await Alert.find(query)
      .populate('projectId', 'projectName projectCode sector state riskLevel')
      .populate('assignedTo', 'name fullName officialEmail')
      .populate('acknowledgedBy', 'name fullName')
      .populate('resolvedBy', 'name fullName')
      .sort({ triggeredAt: -1 });

    return sendSuccess(res, 'Alerts retrieved successfully.', alerts);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch alerts.', [], 500);
  }
}

export async function acknowledgeAlert(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id || req.user.id : null;
    const callerRole = req.user?.role || 'SUPER_ADMIN';

    if (callerRole === 'REPORTING_OFFICER') {
      return sendError(res, 'Reporting Officers are not permitted to manage alerts.', [], 403);
    }

    const existingAlert = await Alert.findById(id).populate('projectId');
    if (!existingAlert) {
      return sendError(res, 'Alert not found.', [], 404);
    }

    // Nodal Officer can only acknowledge alerts for their assigned projects
    if (callerRole === 'NODAL_OFFICER') {
      const project = existingAlert.projectId;
      const uidStr = userId.toString();
      const isAssigned = project && (
        project.nodalOfficer?.toString() === uidStr ||
        project.nodalOfficerId?.toString() === uidStr ||
        (req.user?.projectIds || []).map(p => p.toString()).includes(project._id.toString())
      );
      if (!isAssigned && existingAlert.assignedTo?.toString() !== uidStr) {
        return sendError(res, 'You are only authorized to acknowledge alerts for projects assigned to you.', [], 403);
      }
    }

    existingAlert.status = 'ACKNOWLEDGED';
    existingAlert.acknowledgedAt = new Date();
    existingAlert.acknowledgedBy = userId;
    await existingAlert.save();

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'ALERT_ACKNOWLEDGED',
        resourceType: 'ALERT',
        resourceId: existingAlert._id,
        details: { alertType: existingAlert.alertType, title: existingAlert.title },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, 'Alert acknowledged successfully.', existingAlert);
  } catch (err) {
    return sendError(res, err.message || 'Failed to acknowledge alert.', [], 500);
  }
}

export async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const { resolutionRemarks = '' } = req.body;
    const userId = req.user ? req.user._id || req.user.id : null;
    const callerRole = req.user?.role || 'SUPER_ADMIN';

    if (callerRole === 'REPORTING_OFFICER') {
      return sendError(res, 'Reporting Officers are not permitted to manage alerts.', [], 403);
    }

    const existingAlert = await Alert.findById(id).populate('projectId');
    if (!existingAlert) {
      return sendError(res, 'Alert not found.', [], 404);
    }

    // Nodal Officer can only resolve alerts for their assigned projects
    if (callerRole === 'NODAL_OFFICER') {
      const project = existingAlert.projectId;
      const uidStr = userId.toString();
      const isAssigned = project && (
        project.nodalOfficer?.toString() === uidStr ||
        project.nodalOfficerId?.toString() === uidStr ||
        (req.user?.projectIds || []).map(p => p.toString()).includes(project._id.toString())
      );
      if (!isAssigned && existingAlert.assignedTo?.toString() !== uidStr) {
        return sendError(res, 'You are only authorized to resolve alerts for projects assigned to you.', [], 403);
      }
    }

    existingAlert.status = 'RESOLVED';
    existingAlert.resolvedAt = new Date();
    existingAlert.resolvedBy = userId;
    existingAlert.resolutionRemarks = resolutionRemarks;
    await existingAlert.save();

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'ALERT_RESOLVED',
        resourceType: 'ALERT',
        resourceId: existingAlert._id,
        details: { alertType: existingAlert.alertType, resolutionRemarks },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, 'Alert resolved successfully.', existingAlert);
  } catch (err) {
    return sendError(res, err.message || 'Failed to resolve alert.', [], 500);
  }
}
