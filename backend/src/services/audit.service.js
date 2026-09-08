import { AuditLog } from '../models/AuditLog.js';

/**
 * Record an audit log event asynchronously.
 * Never throws an unhandled rejection, ensuring API responsiveness.
 */
export const logAuditEvent = async ({
  userId = null,
  action,
  targetUserId = null,
  resourceType = null,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {}
}) => {
  try {
    // Sanitize metadata to never store passwords or raw tokens
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.confirmPassword;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.invitationToken;
    delete sanitizedMetadata.resetPasswordToken;

    await AuditLog.create({
      userId,
      action,
      targetUserId,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};
