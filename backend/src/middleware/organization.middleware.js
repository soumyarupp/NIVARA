import { canAccessOrganization } from '../services/organization.service.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware to enforce organization jurisdiction based on a route parameter or body property.
 * @param {string} source - 'params' | 'body' | 'query'
 * @param {string} paramName - Name of the organization field, e.g. 'id' or 'organizationId'
 */
export const enforceOrganizationScope = (source = 'params', paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const orgId = req[source]?.[paramName];
      if (!orgId) {
        return next();
      }

      const hasAccess = await canAccessOrganization(req.user, orgId);
      if (!hasAccess) {
        return sendError(
          res,
          'Access forbidden: You do not have jurisdiction over this organization.',
          [],
          403
        );
      }

      next();
    } catch (error) {
      return sendError(res, 'Organization scope verification failed.', [error.message], 500);
    }
  };
};
