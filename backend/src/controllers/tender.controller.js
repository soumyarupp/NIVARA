import mongoose from 'mongoose';
import { Tender } from '../models/Tender.js';
import { Project } from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function addTender(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
    }
    const tender = await Tender.create({ ...req.body, projectId });
    return sendSuccess(res, 'Tender added successfully.', tender, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add tender.', [], 400);
  }
}

export async function getTendersByProject(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
      else return sendSuccess(res, 'Tenders retrieved.', []);
    }
    const tenders = await Tender.find({ projectId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Tenders retrieved.', tenders);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch tenders.', [], 500);
  }
}

export async function updateTender(req, res) {
  try {
    const { id } = req.params;
    const tender = await Tender.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!tender) {
      return sendError(res, 'Tender not found.', [], 404);
    }
    return sendSuccess(res, 'Tender updated successfully.', tender);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update tender.', [], 400);
  }
}

export async function deleteTender(req, res) {
  try {
    const { id } = req.params;
    const tender = await Tender.findByIdAndDelete(id);
    if (!tender) {
      return sendError(res, 'Tender not found.', [], 404);
    }
    return sendSuccess(res, 'Tender deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete tender.', [], 500);
  }
}
