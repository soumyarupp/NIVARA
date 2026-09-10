/**
 * NIVARA Automated Daily Risk & Reporting Check Job
 * Scans all active infrastructure projects, detects inactive reporting (>90 days),
 * evaluates multi-factor risk, creates alerts without duplicates, and notifies nodal officers.
 */

import cron from 'node-cron';
import { Project } from '../models/Project.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Clearance } from '../models/Clearance.js';
import { LandDetail } from '../models/LandDetail.js';
import { Alert } from '../models/Alert.js';
import { calculateProjectRisk } from '../services/riskEngine.js';
import { dispatchProjectAlert } from '../services/alertDispatch.service.js';

/**
 * Runs the risk inspection across all active projects.
 */
export async function runAutomatedRiskScan() {
  console.log('🔍 [CRON JOB] Starting automated infrastructure risk & reporting scan...');

  try {
    const activeProjects = await Project.find({
      projectStatus: { $in: ['APPROVED', 'ONGOING', 'IN_PROGRESS', 'UNDER_REVIEW'] }
    }).populate('nodalOfficer');

    const now = new Date();
    let scannedCount = 0;
    let alertsCreated = 0;

    for (const project of activeProjects) {
      scannedCount++;

      // 1. Fetch latest monthly report
      const latestReport = await MonthlyReport.findOne({ projectId: project._id }).sort({ submittedAt: -1 });

      let daysSinceLastReport = 0;
      if (latestReport && latestReport.submittedAt) {
        daysSinceLastReport = Math.floor((now - new Date(latestReport.submittedAt)) / (1000 * 60 * 60 * 24));
      } else if (project.projectStartDate) {
        daysSinceLastReport = Math.floor((now - new Date(project.projectStartDate)) / (1000 * 60 * 60 * 24));
      } else if (project.createdAt) {
        daysSinceLastReport = Math.floor((now - new Date(project.createdAt)) / (1000 * 60 * 60 * 24));
      }

      // 2. Fetch pending clearances & land status
      const pendingClearancesCount = await Clearance.countDocuments({
        projectId: project._id,
        status: 'PENDING'
      });

      const landDetail = await LandDetail.findOne({ projectId: project._id });
      const remainingLandPercentage = landDetail ? landDetail.remainingLandPercentage || 0 : 0;

      // 3. Evaluate 90-Day Reporting Delay Alert
      if (daysSinceLastReport >= 90) {
        const existingDelayAlert = await Alert.findOne({
          projectId: project._id,
          alertType: 'REPORTING_DELAY',
          status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
        });

        if (!existingDelayAlert) {
          await dispatchProjectAlert({
            project,
            alertType: 'REPORTING_DELAY',
            severity: 'HIGH',
            title: '90-Day Inactive Reporting Delay',
            message: `Monthly project update has not been received for ${daysSinceLastReport} days. Regular monitoring review recommended.`,
            riskScore: 75
          });
          alertsCreated++;
        }
      }

      // 4. Calculate explainable risk score
      const financialProgress = latestReport ? latestReport.actualFinancialProgress : project.financialProgress || 0;
      const physicalProgress = latestReport ? latestReport.actualPhysicalProgress : project.physicalProgress || 0;
      const plannedPhysicalProgress = latestReport
        ? latestReport.plannedPhysicalProgress
        : project.plannedPhysicalProgress || 0;

      const riskResult = calculateProjectRisk({
        project,
        financialProgress,
        physicalProgress,
        plannedPhysicalProgress,
        daysSinceLastReport,
        pendingClearancesCount,
        remainingLandPercentage
      });

      // Update cached risk fields on project
      project.riskScore = riskResult.riskScore;
      project.riskLevel = riskResult.riskLevel;
      project.financialProgress = financialProgress;
      project.physicalProgress = physicalProgress;
      await project.save();

      // 5. Create HIGH or CRITICAL risk alert if needed
      if (['HIGH', 'CRITICAL'].includes(riskResult.riskLevel)) {
        const alertType = riskResult.riskLevel === 'CRITICAL' ? 'CRITICAL_RISK' : 'HIGH_RISK';
        const existingRiskAlert = await Alert.findOne({
          projectId: project._id,
          alertType,
          status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
        });

        if (!existingRiskAlert) {
          const majorFactors = riskResult.factors
            .filter((f) => f.rawScore > 40)
            .map((f) => f.description)
            .join(' ');

          await dispatchProjectAlert({
            project,
            alertType,
            severity: riskResult.riskLevel,
            title: `${riskResult.riskLevel} Project Risk Detected (${riskResult.riskScore}/100)`,
            message: majorFactors || `Composite risk score has escalated to ${riskResult.riskScore}/100.`,
            riskScore: riskResult.riskScore
          });
          alertsCreated++;
        }
      }
    }

    console.log(
      `✅ [CRON JOB] Risk scan completed. Scanned: ${scannedCount} projects, Generated: ${alertsCreated} new alerts.`
    );
  } catch (err) {
    console.error('❌ [CRON JOB] Error executing automated risk scan:', err);
  }
}

/**
 * Initializes the node-cron scheduled job.
 */
export function initRiskCronJob() {
  // Run once daily at 00:00 (Midnight)
  cron.schedule('0 0 * * *', () => {
    runAutomatedRiskScan();
  });
  console.log('⏰ NIVARA Automated Risk Evaluation Cron Job scheduled for daily execution at 00:00.');
}
