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
    if (projectId) query.projectId = projectId;

    // Role-based filtering if user is Nodal Officer
    if (req.user && req.user.role === 'NODAL_OFFICER') {
      const userProjects = await Project.find({
        $or: [{ nodalOfficer: req.user._id || req.user.id }, { nodalOfficerId: req.user._id || req.user.id }]
      }).select('_id');
      query.projectId = { $in: userProjects.map((p) => p._id) };
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

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      },
      { new: true }
    );

    if (!alert) {
      return sendError(res, 'Alert not found.', [], 404);
    }

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'ALERT_ACKNOWLEDGED',
        resourceType: 'ALERT',
        resourceId: alert._id,
        details: { alertType: alert.alertType, title: alert.title },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, 'Alert acknowledged successfully.', alert);
  } catch (err) {
    return sendError(res, err.message || 'Failed to acknowledge alert.', [], 500);
  }
}

export async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    const { resolutionRemarks = '' } = req.body;
    const userId = req.user ? req.user._id || req.user.id : null;

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionRemarks
      },
      { new: true }
    );

    if (!alert) {
      return sendError(res, 'Alert not found.', [], 404);
    }

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'ALERT_RESOLVED',
        resourceType: 'ALERT',
        resourceId: alert._id,
        details: { alertType: alert.alertType, resolutionRemarks },
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, 'Alert resolved successfully.', alert);
  } catch (err) {
    return sendError(res, err.message || 'Failed to resolve alert.', [], 500);
  }
}
