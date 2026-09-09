import { Milestone } from '../models/Milestone.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function addMilestone(req, res) {
  try {
    const { projectId } = req.params;
    const milestone = await Milestone.create({ ...req.body, projectId });
    return sendSuccess(res, 'Milestone added successfully.', milestone, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add milestone.', [], 400);
  }
}

export async function getMilestonesByProject(req, res) {
  try {
    const { projectId } = req.params;
    const milestones = await Milestone.find({ projectId }).sort({ originalStartDate: 1 });
    return sendSuccess(res, 'Milestones retrieved.', milestones);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch milestones.', [], 500);
  }
}

export async function updateMilestone(req, res) {
  try {
    const { id } = req.params;
    const milestone = await Milestone.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!milestone) {
      return sendError(res, 'Milestone not found.', [], 404);
    }
    return sendSuccess(res, 'Milestone updated successfully.', milestone);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update milestone.', [], 400);
  }
}

export async function deleteMilestone(req, res) {
  try {
    const { id } = req.params;
    const milestone = await Milestone.findByIdAndDelete(id);
    if (!milestone) {
      return sendError(res, 'Milestone not found.', [], 404);
    }
    return sendSuccess(res, 'Milestone deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete milestone.', [], 500);
  }
}
