import { simulatePreApprovalRisk } from '../services/preApproval.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function predictPreApprovalRisk(req, res) {
  try {
    const {
      projectName = req.body.name || 'Proposed Mega Project',
      sector = 'Road Transport & Highways',
      state = 'National',
      agency = 'NHAI',
      estimatedCost = req.body.budget !== undefined ? req.body.budget : 500,
      landRequired = req.body.landAcquiredPercent !== undefined ? req.body.landAcquiredPercent < 90 : true,
      forestClearanceRequired = Boolean(req.body.forestClearanceRequired),
      litigationRisk = req.body.litigationRisk || (req.body.utilityShiftingComplexity === 'High' ? 'HIGH' : 'MEDIUM')
    } = req.body;

    const result = await simulatePreApprovalRisk({
      projectName,
      sector,
      state,
      agency,
      estimatedCost: Number(estimatedCost) || 500,
      landRequired: Boolean(landRequired),
      forestClearanceRequired: Boolean(forestClearanceRequired),
      litigationRisk,
      userId: req.user ? req.user._id || req.user.id : null
    });

    return sendSuccess(res, 'Pre-approval risk simulation completed.', result);
  } catch (err) {
    return sendError(res, err.message || 'Failed to simulate pre-approval risk.', [], 500);
  }
}
