import mongoose from 'mongoose';
import { Partner } from '../models/Partner.js';
import { Project } from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function addPartner(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
    }
    const partner = await Partner.create({ ...req.body, projectId });
    return sendSuccess(res, 'Partner added successfully.', partner, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add partner.', [], 400);
  }
}

export async function getPartnersByProject(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
      else return sendSuccess(res, 'Partners retrieved.', []);
    }
    const partners = await Partner.find({ projectId });
    return sendSuccess(res, 'Partners retrieved.', partners);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch partners.', [], 500);
  }
}

export async function updatePartner(req, res) {
  try {
    const { id } = req.params;
    const partner = await Partner.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!partner) {
      return sendError(res, 'Partner not found.', [], 404);
    }
    return sendSuccess(res, 'Partner updated successfully.', partner);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update partner.', [], 400);
  }
}

export async function deletePartner(req, res) {
  try {
    const { id } = req.params;
    const partner = await Partner.findByIdAndDelete(id);
    if (!partner) {
      return sendError(res, 'Partner not found.', [], 404);
    }
    return sendSuccess(res, 'Partner deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete partner.', [], 500);
  }
}
