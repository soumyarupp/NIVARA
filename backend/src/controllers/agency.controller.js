import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getAgencies(req, res) {
  try {
    const { ministryId } = req.query;
    const query = {};
    
    if (ministryId) {
      query.ministryId = ministryId;
    } else if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(req.user?.role)) {
      const userMin = req.user.ministryId || req.user.organizationId;
      if (userMin) query.ministryId = userMin;
    } else if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(req.user?.role)) {
      const userAg = req.user.agencyId || req.user.organizationId;
      if (userAg) query._id = userAg;
    }

    const agencies = await ImplementationAgency.find(query).populate('ministryId', 'name code').sort({ name: 1 });
    return sendSuccess(res, 'Implementation agencies retrieved.', agencies);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch agencies.', [], 500);
  }
}

export async function createAgency(req, res) {
  try {
    const payload = { ...req.body };
    if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(req.user?.role)) {
      const userMin = req.user.ministryId || req.user.organizationId;
      if (userMin) {
        payload.ministryId = userMin;
      }
    }
    const agency = await ImplementationAgency.create(payload);
    return sendSuccess(res, 'Implementation agency created successfully.', agency, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create agency.', [], 400);
  }
}

export async function getAgencyById(req, res) {
  try {
    const { id } = req.params;
    const agency = await ImplementationAgency.findById(id).populate('ministryId', 'name code');
    if (!agency) {
      return sendError(res, 'Implementation agency not found.', [], 404);
    }
    return sendSuccess(res, 'Implementation agency details retrieved.', agency);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch agency.', [], 500);
  }
}

export async function updateAgency(req, res) {
  try {
    const { id } = req.params;
    const agency = await ImplementationAgency.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!agency) {
      return sendError(res, 'Implementation agency not found.', [], 404);
    }
    return sendSuccess(res, 'Implementation agency updated successfully.', agency);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update agency.', [], 400);
  }
}

export async function updateAgencyStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const agency = await ImplementationAgency.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!agency) {
      return sendError(res, 'Implementation agency not found.', [], 404);
    }
    return sendSuccess(res, `Implementation agency status updated to ${agency.isActive ? 'ACTIVE' : 'INACTIVE'}.`, agency);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update agency status.', [], 500);
  }
}
