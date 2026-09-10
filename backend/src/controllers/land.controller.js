import mongoose from 'mongoose';
import { LandDetail } from '../models/LandDetail.js';
import { Project } from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function upsertLandDetail(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
    }
    const data = { ...req.body, projectId };

    const landDetail = await LandDetail.findOneAndUpdate({ projectId }, data, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    });

    return sendSuccess(res, 'Land details updated successfully.', landDetail, 200);
  } catch (err) {
    return sendError(res, err.message || 'Failed to update land details.', [], 400);
  }
}

export async function getLandDetail(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
      else return sendSuccess(res, 'Land details retrieved.', {});
    }
    const landDetail = await LandDetail.findOne({ projectId });
    return sendSuccess(res, 'Land details retrieved.', landDetail || {});
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch land details.', [], 500);
  }
}
