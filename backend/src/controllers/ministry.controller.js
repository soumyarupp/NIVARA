import { Ministry } from '../models/Ministry.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getMinistries(req, res) {
  try {
    const ministries = await Ministry.find().sort({ name: 1 });
    return sendSuccess(res, 'Ministries retrieved.', ministries);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch ministries.', [], 500);
  }
}

export async function createMinistry(req, res) {
  try {
    const ministry = await Ministry.create(req.body);
    return sendSuccess(res, 'Ministry created successfully.', ministry, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create ministry.', [], 400);
  }
}

export async function getMinistryById(req, res) {
  try {
    const { id } = req.params;
    const ministry = await Ministry.findById(id);
    if (!ministry) {
      return sendError(res, 'Ministry not found.', [], 404);
    }
    return sendSuccess(res, 'Ministry details retrieved.', ministry);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch ministry.', [], 500);
  }
}

export async function updateMinistry(req, res) {
  try {
    const { id } = req.params;
    const ministry = await Ministry.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!ministry) {
      return sendError(res, 'Ministry not found.', [], 404);
    }
    return sendSuccess(res, 'Ministry updated successfully.', ministry);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update ministry.', [], 400);
  }
}

export async function updateMinistryStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const ministry = await Ministry.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!ministry) {
      return sendError(res, 'Ministry not found.', [], 404);
    }
    return sendSuccess(res, `Ministry status updated to ${ministry.isActive ? 'ACTIVE' : 'INACTIVE'}.`, ministry);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update ministry status.', [], 500);
  }
}
