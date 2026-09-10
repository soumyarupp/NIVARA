import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication Middleware:
 * Validates JWT access token, checks user existence and active status, and attaches user to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract Bearer token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', [], 401);
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token has expired. Please refresh your token.', [], 401);
      }
      return sendError(res, 'Invalid authentication token.', [], 401);
    }

    // 3. Verify user in database
    const user = await User.findById(decoded.userId)
      .populate('organizationId', 'name code type')
      .populate('agencyId', 'name agencyCode organizationType ministryId')
      .populate('ministryId', 'name code');

    if (!user) {
      return sendError(res, 'User session invalid. Account not found.', [], 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, `Account is currently ${user.status.toLowerCase()}. Access denied.`, [], 403);
    }

    // 4. Attach user context to request
    req.user = {
      _id: user._id,
      userId: user._id.toString(),
      role: user.role,
      agencyId: user.agencyId ? (user.agencyId._id || user.agencyId) : null,
      agency: user.agencyId,
      ministryId: user.ministryId ? (user.ministryId._id || user.ministryId) : null,
      ministry: user.ministryId,
      organizationId: user.organizationId ? (user.organizationId._id || user.organizationId) : null,
      organization: user.organizationId,
      fullName: user.fullName,
      officialEmail: user.officialEmail,
      projectIds: user.projectIds || []
    };

    next();
  } catch (error) {
    return sendError(res, 'Authentication failed', [error.message], 401);
  }
};
