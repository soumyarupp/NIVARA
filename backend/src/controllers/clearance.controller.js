import { Clearance } from '../models/Clearance.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function addClearance(req, res) {
  try {
    const { projectId } = req.params;
    const clearance = await Clearance.create({ ...req.body, projectId });
    return sendSuccess(res, 'Clearance added successfully.', clearance, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add clearance.', [], 400);
  }
}

export async function getClearancesByProject(req, res) {
  try {
    const { projectId } = req.params;
    const clearances = await Clearance.find({ projectId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Clearances retrieved.', clearances);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch clearances.', [], 500);
  }
}

export async function updateClearance(req, res) {
  try {
    const { id } = req.params;
    const clearance = await Clearance.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!clearance) {
      return sendError(res, 'Clearance not found.', [], 404);
    }
    return sendSuccess(res, 'Clearance updated successfully.', clearance);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update clearance.', [], 400);
  }
}

export async function deleteClearance(req, res) {
  try {
    const { id } = req.params;
    const clearance = await Clearance.findByIdAndDelete(id);
    if (!clearance) {
      return sendError(res, 'Clearance not found.', [], 404);
    }
    return sendSuccess(res, 'Clearance deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete clearance.', [], 500);
  }
}
