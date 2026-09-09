import { Partner } from '../models/Partner.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function addPartner(req, res) {
  try {
    const { projectId } = req.params;
    const partner = await Partner.create({ ...req.body, projectId });
    return sendSuccess(res, 'Partner added successfully.', partner, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to add partner.', [], 400);
  }
}

export async function getPartnersByProject(req, res) {
  try {
    const { projectId } = req.params;
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
