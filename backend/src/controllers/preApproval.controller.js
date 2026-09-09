import { simulatePreApprovalRisk } from '../services/preApproval.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function predictPreApprovalRisk(req, res) {
  try {
    const {
      projectName,
      sector,
      state,
      agency,
      estimatedCost,
      landRequired,
      forestClearanceRequired,
      litigationRisk
    } = req.body;

    if (!sector || estimatedCost === undefined) {
      return sendError(res, 'Sector and estimatedCost are required for pre-approval simulation.', [], 400);
    }

    const result = await simulatePreApprovalRisk({
      projectName,
      sector,
      state,
      agency,
      estimatedCost: Number(estimatedCost),
      landRequired: landRequired !== false,
      forestClearanceRequired: Boolean(forestClearanceRequired),
      litigationRisk: litigationRisk || 'LOW',
      userId: req.user ? req.user._id || req.user.id : null
    });

    return sendSuccess(res, 'Pre-approval risk simulation completed.', result);
  } catch (err) {
    return sendError(res, err.message || 'Failed to simulate pre-approval risk.', [], 500);
  }
}
