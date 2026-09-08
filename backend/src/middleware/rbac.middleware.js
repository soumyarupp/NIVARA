import { sendError } from '../utils/response.js';

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Strictly verifies whether req.user.role exists in the permitted roles.
 * @param  {...string} allowedRoles 
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization check.', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`,
        [],
        403
      );
    }

    next();
  };
};
