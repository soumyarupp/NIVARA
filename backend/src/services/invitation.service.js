import { generateRandomToken, hashToken, parseDurationToMs } from '../utils/token.js';
import { sendInvitationEmail } from './email.service.js';
import { logAuditEvent } from './audit.service.js';
import { env } from '../config/env.js';
import { Organization } from '../models/Organization.js';

/**
 * Generate and assign an invitation token to a user, then dispatch email.
 * @param {object} user - Mongoose User document
 * @param {string} actorUserId - ID of user creating the invitation
 * @param {string} ipAddress 
 * @param {string} userAgent 
 * @returns {Promise<{ rawToken: string }>}
 */
export const createAndSendInvitation = async ({
  user,
  actorUserId = null,
  ipAddress = null,
  userAgent = null
}) => {
  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresInMs = parseDurationToMs(env.INVITATION_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresInMs);

  user.invitationTokenHash = tokenHash;
  user.invitationExpiresAt = expiresAt;
  user.status = 'INVITED';
  await user.save();

  let orgName = 'Central Government Authority';
  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (org) orgName = org.name;
  }

  // Dispatch email
  await sendInvitationEmail({
    to: user.officialEmail,
    fullName: user.fullName,
    role: user.role,
    organizationName: orgName,
    rawToken
  });

  await logAuditEvent({
    userId: actorUserId,
    action: 'INVITATION_SENT',
    targetUserId: user._id,
    resourceType: 'User',
    resourceId: user._id.toString(),
    ipAddress,
    userAgent,
    metadata: {
      officialEmail: user.officialEmail,
      role: user.role,
      expiresAt
    }
  });

  return { rawToken };
};
