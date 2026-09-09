/**
 * NIVARA What-If Project Delay & Cost Escalation Simulator
 * Simulates project timeline shifts and compounding cost escalations for interactive frontend sliders.
 */

import { Project } from '../models/Project.js';

export async function simulateProjectDelay(projectId, { additionalDelayMonths = 0, costEscalationRate = 1.5 }) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const months = Math.max(0, Number(additionalDelayMonths) || 0);
  const escalationPctPerYear = Number(costEscalationRate) || 1.5;

  const originalTargetDate = project.revisedCompletionDate || project.originalCompletionDate || new Date();
  const currentEstCost = project.revisedProjectCost || project.originalProjectCost || 0;

  // Calculate new target completion date
  const newCompletionDate = new Date(originalTargetDate);
  newCompletionDate.setMonth(newCompletionDate.getMonth() + months);

  // Compound escalation calculation: Cost * ((1 + r/100)^(months / 12) - 1)
  const years = months / 12;
  const escalationFactor = Math.pow(1 + escalationPctPerYear / 100, years) - 1;
  const estimatedAdditionalCost = Math.round(currentEstCost * escalationFactor * 100) / 100;
  const newEstimatedCost = Math.round((currentEstCost + estimatedAdditionalCost) * 100) / 100;

  return {
    projectId: project._id,
    projectName: project.projectName,
    projectCode: project.projectCode,
    originalCompletionDate: project.originalCompletionDate,
    currentCompletionDate: originalTargetDate,
    newCompletionDate,
    additionalDelayMonths: months,
    costEscalationRatePercent: escalationPctPerYear,
    currentProjectCost: currentEstCost,
    estimatedAdditionalCost,
    newEstimatedCost,
    simulatedCostIncreasePercent:
      currentEstCost > 0 ? Math.round((estimatedAdditionalCost / currentEstCost) * 10000) / 100 : 0
  };
}
