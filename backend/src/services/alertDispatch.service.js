import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendAlertNotificationEmail } from './email.service.js';

/**
 * Dispatches an alert and routes notifications strictly according to NIVARA governance:
 * 1. Targeted & assigned to the project's assigned NODAL OFFICER.
 * 2. If severity is HIGH or CRITICAL (Very High Risk) -> Escalated to IMPLEMENTATION AGENCY officers.
 * 3. REPORTING OFFICERS NEVER receive alert notifications.
 */
export async function dispatchProjectAlert({
  project,
  alertType,
  severity = 'MEDIUM',
  title,
  message,
  riskScore = 50
}) {
  // 1. Resolve project Nodal Officer
  let nodalOfficer = project.nodalOfficer || project.nodalOfficerId;
  if (!nodalOfficer || !nodalOfficer._id) {
    nodalOfficer = await User.findOne({
      $or: [
        { _id: project.nodalOfficerId || project.nodalOfficer },
        { projectIds: project._id, role: 'NODAL_OFFICER' }
      ]
    });
  }

  // 2. Create Alert in DB
  const alert = await Alert.create({
    projectId: project._id,
    alertType,
    severity,
    title,
    message,
    riskScore,
    assignedTo: nodalOfficer?._id || nodalOfficer || null,
    triggeredAt: new Date()
  });

  // 3. Notify Nodal Officer
  if (nodalOfficer) {
    const nodalUserId = nodalOfficer._id || nodalOfficer;
    await Notification.create({
      userId: nodalUserId,
      projectId: project._id,
      alertId: alert._id,
      title: `${severity} Alert: ${project.projectName || 'Project'}`,
      message,
      type: 'ALERT',
      severity
    });

    if (nodalOfficer.officialEmail || nodalOfficer.email) {
      sendAlertNotificationEmail({
        to: nodalOfficer.officialEmail || nodalOfficer.email,
        recipientName: nodalOfficer.fullName || nodalOfficer.name || 'Nodal Officer',
        projectTitle: project.projectName || 'Infrastructure Asset',
        alertTitle: title,
        alertMessage: message,
        severity,
        riskScore
      }).catch(err => console.error('Failed to send nodal email alert:', err.message));
    }
  }

  // 4. Escalation to Implementation Agency (ONLY if risk is VERY HIGH or CRITICAL)
  if (['CRITICAL', 'HIGH'].includes(severity)) {
    const agencyId = project.implementationAgencyId?._id || project.implementationAgencyId || project.implementingAgencyId || project.agencyId;
    if (agencyId) {
      const agencyOfficers = await User.find({
        $or: [
          { agencyId: agencyId },
          { organizationId: agencyId }
        ],
        role: { $in: ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'] }
      });

      for (const agencyOfficer of agencyOfficers) {
        await Notification.create({
          userId: agencyOfficer._id,
          projectId: project._id,
          alertId: alert._id,
          title: `[HIGH RISK ESCALATION] ${project.projectName || 'Project'}`,
          message: `Escalated to Agency Command: ${message}`,
          type: 'ALERT',
          severity
        });

        if (agencyOfficer.officialEmail || agencyOfficer.email) {
          sendAlertNotificationEmail({
            to: agencyOfficer.officialEmail || agencyOfficer.email,
            recipientName: agencyOfficer.fullName || agencyOfficer.name || 'Implementation Agency Officer',
            projectTitle: project.projectName || 'Infrastructure Asset',
            alertTitle: `[HIGH RISK ESCALATION] ${title}`,
            alertMessage: `Alert escalated to Implementation Agency oversight: ${message}`,
            severity,
            riskScore
          }).catch(err => console.error('Failed to send agency email alert:', err.message));
        }
      }
    }
  }

  return alert;
}
