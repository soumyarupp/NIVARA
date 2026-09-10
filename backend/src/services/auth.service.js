import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Organization } from '../models/Organization.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { Ministry } from '../models/Ministry.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRandomToken,
  hashToken,
  parseDurationToMs
} from '../utils/token.js';
import { logAuditEvent } from './audit.service.js';
import { sendPasswordResetEmail } from './email.service.js';
import { env } from '../config/env.js';

export const createSessionTokens = async ({ user, ipAddress, userAgent }) => {
  // 1. Generate Access Token
  const accessPayload = {
    userId: user._id.toString(),
    role: user.role,
    agencyId: user.agencyId ? user.agencyId.toString() : null,
    ministryId: user.ministryId ? user.ministryId.toString() : null,
    organizationId: user.organizationId ? user.organizationId.toString() : null
  };
  const accessToken = generateAccessToken(accessPayload);

  // 2. Generate Refresh Token
  const rawRefreshToken = generateRandomToken(40);
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  const refreshExpiresAt = new Date(Date.now() + refreshExpiresMs);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    refreshExpiresAt
  };
};

/**
 * Login Service
 */
export const loginUser = async ({ officialEmail, password, ipAddress, userAgent }) => {
  const normalizedEmail = officialEmail.trim().toLowerCase();

  // Select passwordHash explicitly since it has select: false
  const user = await User.findOne({ officialEmail: normalizedEmail }).select('+passwordHash');

  if (!user) {
    await logAuditEvent({
      action: 'LOGIN_FAILURE',
      ipAddress,
      userAgent,
      metadata: { attemptedEmail: normalizedEmail, reason: 'User not found' }
    });
    throw new Error('Invalid email or password');
  }

  // Account status check
  if (user.status === 'INVITED') {
    throw new Error('Account invitation is pending activation. Please check your email to set up your password.');
  }

  if (user.status === 'SUSPENDED') {
    await logAuditEvent({
      userId: user._id,
      action: 'LOGIN_FAILURE_SUSPENDED',
      ipAddress,
      userAgent
    });
    throw new Error('Account has been suspended. Please contact your system administrator.');
  }

  if (user.status === 'DEACTIVATED') {
    await logAuditEvent({
      userId: user._id,
      action: 'LOGIN_FAILURE_DEACTIVATED',
      ipAddress,
      userAgent
    });
    throw new Error('Account has been deactivated.');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Invalid account status. Login not permitted.');
  }

  if (!user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  // Verify Argon2 password
  const isMatch = await verifyPassword(user.passwordHash, password);
  if (!isMatch) {
    await logAuditEvent({
      userId: user._id,
      action: 'LOGIN_FAILURE',
      ipAddress,
      userAgent,
      metadata: { reason: 'Incorrect password' }
    });
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Create session tokens
  const tokens = await createSessionTokens({ user, ipAddress, userAgent });

  // Organization info
  let organization = null;
  if (user.organizationId) {
    organization = await Organization.findById(user.organizationId).select('name code type');
  }

  let agency = null;
  if (user.agencyId) {
    agency = await ImplementationAgency.findById(user.agencyId).select('name agencyCode organizationType ministryId');
  }

  let ministry = null;
  if (user.ministryId) {
    ministry = await Ministry.findById(user.ministryId).select('name code');
  }

  await logAuditEvent({
    userId: user._id,
    action: 'LOGIN_SUCCESS',
    ipAddress,
    userAgent,
    metadata: { role: user.role }
  });

  return {
    user: {
      id: user._id,
      _id: user._id,
      name: user.name || user.fullName,
      fullName: user.fullName || user.name,
      email: user.email || user.officialEmail,
      officialEmail: user.officialEmail || user.email,
      mobileNumber: user.mobileNumber || user.phone,
      phone: user.phone || user.mobileNumber,
      designation: user.designation,
      employeeId: user.employeeId,
      department: user.department,
      role: user.role,
      agencyId: user.agencyId,
      agency,
      ministryId: user.ministryId,
      ministry,
      organizationId: user.organizationId,
      organization,
      projectIds: user.projectIds || [],
      status: user.status,
      isActive: user.isActive !== false && user.status !== 'DEACTIVATED',
      lastLoginAt: user.lastLoginAt
    },
    ...tokens
  };
};

/**
 * Verify Invitation Token Service
 */
export const verifyInvitationToken = async (token) => {
  if (!token) {
    throw new Error('Activation token is required');
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    invitationTokenHash: tokenHash
  }).select('+invitationTokenHash +invitationExpiresAt').populate('organizationId', 'name code');

  if (!user) {
    throw new Error('Invalid activation link.');
  }

  if (!user.invitationExpiresAt || user.invitationExpiresAt < new Date()) {
    throw new Error('Activation link has expired. Please request a new invitation.');
  }

  if (user.status !== 'INVITED') {
    throw new Error('Account has already been activated.');
  }

  return {
    valid: true,
    fullName: user.fullName,
    officialEmail: user.officialEmail,
    role: user.role,
    organizationName: user.organizationId?.name || 'Central Authority'
  };
};

/**
 * Activate Account Service
 */
export const activateUserAccount = async ({ token, password, ipAddress, userAgent }) => {
  const tokenHash = hashToken(token);

  // Find user by invitation token
  const user = await User.findOne({
    invitationTokenHash: tokenHash
  }).select('+invitationTokenHash +invitationExpiresAt');

  if (!user) {
    throw new Error('Invalid or expired activation link.');
  }

  if (!user.invitationExpiresAt || user.invitationExpiresAt < new Date()) {
    throw new Error('Activation link has expired. Please request a new invitation from your administrator.');
  }

  if (user.status !== 'INVITED') {
    throw new Error('Account has already been activated or is in an invalid state.');
  }

  // Hash new password using Argon2id
  const passwordHash = await hashPassword(password);

  user.passwordHash = passwordHash;
  user.status = 'ACTIVE';
  user.emailVerified = true;
  user.invitationTokenHash = undefined;
  user.invitationExpiresAt = undefined;
  await user.save();

  await logAuditEvent({
    userId: user._id,
    action: 'ACCOUNT_ACTIVATED',
    targetUserId: user._id,
    ipAddress,
    userAgent,
    metadata: { role: user.role, officialEmail: user.officialEmail }
  });

  return {
    id: user._id,
    fullName: user.fullName,
    officialEmail: user.officialEmail,
    role: user.role,
    status: user.status
  };
};

/**
 * Refresh Tokens Service (with Token Rotation & Reuse Detection)
 */
export const refreshSession = async ({ refreshToken, ipAddress, userAgent }) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const tokenHash = hashToken(refreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw new Error('Invalid refresh token');
  }

  // Reuse Detection: if an already revoked token is submitted, invalidate all tokens for that user
  if (tokenDoc.revoked) {
    await RefreshToken.updateMany({ userId: tokenDoc.userId }, { revoked: true, revokedAt: new Date() });
    await logAuditEvent({
      userId: tokenDoc.userId,
      action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE',
      ipAddress,
      userAgent
    });
    throw new Error('Invalid refresh session. Please login again.');
  }

  if (tokenDoc.expiresAt < new Date()) {
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    throw new Error('Refresh token has expired. Please login again.');
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user || user.status !== 'ACTIVE') {
    tokenDoc.revoked = true;
    await tokenDoc.save();
    throw new Error('User account is not active');
  }

  // Rotate token: revoke current
  const newRawRefreshToken = generateRandomToken(40);
  const newTokenHash = hashToken(newRawRefreshToken);
  const refreshExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  const refreshExpiresAt = new Date(Date.now() + refreshExpiresMs);

  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = newTokenHash;
  await tokenDoc.save();

  // Create replacement refresh token
  await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent
  });

  // Generate new Access Token
  const accessPayload = {
    userId: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null
  };
  const accessToken = generateAccessToken(accessPayload);

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
    refreshExpiresAt
  };
};

/**
 * Logout Service
 */
export const logoutSession = async ({ refreshToken, userId, ipAddress, userAgent }) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.updateOne(
      { tokenHash },
      { revoked: true, revokedAt: new Date() }
    );
  }

  if (userId) {
    await logAuditEvent({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent
    });
  }
};

/**
 * Forgot Password Service (Constant-time generic response)
 */
export const requestPasswordReset = async ({ officialEmail, ipAddress, userAgent }) => {
  const normalizedEmail = officialEmail.trim().toLowerCase();
  const user = await User.findOne({ officialEmail: normalizedEmail });

  if (user && user.status === 'ACTIVE') {
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresInMs = parseDurationToMs(env.PASSWORD_RESET_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs);

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    await sendPasswordResetEmail({
      to: user.officialEmail,
      fullName: user.fullName,
      rawToken
    });

    await logAuditEvent({
      userId: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      targetUserId: user._id,
      ipAddress,
      userAgent
    });
  } else {
    // Log attempt without revealing existence
    await logAuditEvent({
      action: 'PASSWORD_RESET_ATTEMPT_UNKNOWN_USER',
      ipAddress,
      userAgent,
      metadata: { attemptedEmail: normalizedEmail }
    });
  }

  return 'If the account exists, a password reset link has been sent.';
};

/**
 * Reset Password Service
 */
export const resetUserPassword = async ({ token, password, ipAddress, userAgent }) => {
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');

  if (!user) {
    throw new Error('Invalid or expired password reset link.');
  }

  if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    throw new Error('Password reset link has expired. Please request a new one.');
  }

  const passwordHash = await hashPassword(password);
  user.passwordHash = passwordHash;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  // Invalidate all existing refresh sessions for security
  await RefreshToken.updateMany(
    { userId: user._id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );

  await logAuditEvent({
    userId: user._id,
    action: 'PASSWORD_RESET_SUCCESS',
    targetUserId: user._id,
    ipAddress,
    userAgent
  });

  return 'Password has been successfully updated. Please login with your new credentials.';
};
