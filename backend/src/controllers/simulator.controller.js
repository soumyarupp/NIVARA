import { simulateProjectDelay } from '../services/simulator.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function simulateProject(req, res) {
  try {
    const { projectId } = req.params;
    const { additionalDelayMonths = 0, costEscalationRate = 1.5 } = req.body;

    const result = await simulateProjectDelay(projectId, {
      additionalDelayMonths: Number(additionalDelayMonths),
      costEscalationRate: Number(costEscalationRate)
    });

    return sendSuccess(res, 'What-if delay & cost simulation completed.', result);
  } catch (err) {
    return sendError(res, err.message || 'Failed to run what-if simulation.', [], 500);
  }
}
