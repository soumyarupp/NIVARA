import mongoose from 'mongoose';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Project } from '../models/Project.js';
import { Clearance } from '../models/Clearance.js';
import { LandDetail } from '../models/LandDetail.js';
import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import { calculateFinancialProgress, calculateProgressGap } from '../utils/calculations.js';
import { classifyDelayReason } from '../services/delayClassifier.js';
import { detectProgressMismatch } from '../services/mismatchDetector.js';
import { calculateProjectRisk } from '../services/riskEngine.js';
import { sendAlertNotificationEmail } from '../services/email.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { dispatchProjectAlert } from '../services/alertDispatch.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Submit Monthly Progress Report
 */
export async function submitMonthlyReport(req, res) {
  try {
    const {
      projectId,
      reportingMonth, // 'YYYY-MM'
      expenditure, // INR Crores
      plannedPhysicalProgress,
      actualPhysicalProgress,
      delayDays = 0,
      delayReasonText = '',
      remarks = '',
      attachments = []
    } = req.body;

    const userId = req.user._id || req.user.id;

    if (!projectId || !reportingMonth || expenditure === undefined || actualPhysicalProgress === undefined) {
      return sendError(res, 'Missing required report fields (projectId, reportingMonth, expenditure, actualPhysicalProgress).', [], 400);
    }

    const project = await Project.findById(projectId).populate('nodalOfficer');
    if (!project) {
      return sendError(res, 'Project not found.', [], 404);
    }

    // Role permission check: REPORTING_OFFICER must be assigned to project (or admin/agency)
    if (req.user.role === 'REPORTING_OFFICER') {
      const isAssigned = (project.reportingOfficers || []).some(
        (id) => id.toString() === userId.toString()
      ) || (project.reportingOfficerId && project.reportingOfficerId.toString() === userId.toString());

      if (!isAssigned) {
        return sendError(res, 'You are not assigned as a Reporting Officer for this project.', [], 403);
      }
    }

    // 1. Calculate Financial Progress
    const actualFinancialProgress = calculateFinancialProgress(expenditure, project.originalProjectCost);
    const plannedFinProg = req.body.plannedFinancialProgress !== undefined
      ? Number(req.body.plannedFinancialProgress)
      : actualFinancialProgress;

    // 2. Classify Delay Reason via NLP
    const nlpClassification = await classifyDelayReason(delayReasonText || remarks);

    // 3. Detect Fund vs Physical Progress Mismatch
    const mismatch = detectProgressMismatch(actualFinancialProgress, actualPhysicalProgress);

    // 4. Fetch Land & Clearance contexts for Risk Evaluation
    const pendingClearancesCount = await Clearance.countDocuments({
      projectId: project._id,
      status: 'PENDING'
    });
    const landDetail = await LandDetail.findOne({ projectId: project._id });
    const remainingLandPercentage = landDetail ? landDetail.remainingLandPercentage || 0 : 0;

    // 5. Evaluate Multi-Factor Risk Score
    const riskResult = calculateProjectRisk({
      project,
      financialProgress: actualFinancialProgress,
      physicalProgress: actualPhysicalProgress,
      plannedPhysicalProgress: plannedPhysicalProgress || actualPhysicalProgress,
      daysSinceLastReport: 0,
      pendingClearancesCount,
      remainingLandPercentage
    });

    // 6. Save or Upsert Monthly Report
    const reportData = {
      projectId,
      reportingMonth,
      plannedFinancialProgress: plannedFinProg,
      actualFinancialProgress,
      plannedPhysicalProgress: plannedPhysicalProgress || 0,
      actualPhysicalProgress,
      expenditure,
      delayDays: Number(delayDays) || 0,
      delayReasonText,
      autoDetectedDelayReason: nlpClassification.category,
      delayConfidence: nlpClassification.confidence,
      matchedKeywords: nlpClassification.matchedKeywords,
      mismatchDetected: mismatch.mismatch,
      mismatchDifference: mismatch.difference,
      mismatchSeverity: mismatch.severity,
      calculatedRiskScore: riskResult.riskScore,
      calculatedRiskLevel: riskResult.riskLevel,
      remarks,
      submittedBy: userId,
      submittedAt: new Date(),
      attachments
    };

    const monthlyReport = await MonthlyReport.findOneAndUpdate(
      { projectId, reportingMonth },
      reportData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 7. Update Master Project Cached Metrics
    project.financialProgress = actualFinancialProgress;
    project.physicalProgress = actualPhysicalProgress;
    project.plannedPhysicalProgress = plannedPhysicalProgress || project.plannedPhysicalProgress;
    project.plannedFinancialProgress = plannedFinProg;
    project.expenditure = expenditure;
    project.totalActualExpenditure = expenditure;
    project.riskScore = riskResult.riskScore;
    project.riskLevel = riskResult.riskLevel;
    project.latestReportDate = new Date();
    await project.save();

    // 8. Generate Alerts & Dispatch Notifications if needed (Routed to Nodal, Escalated to Agency if High/Critical)
    const alertsGenerated = [];

    // Mismatch Alert
    if (mismatch.mismatch && ['HIGH', 'MEDIUM'].includes(mismatch.severity)) {
      const existingAlert = await Alert.findOne({
        projectId: project._id,
        alertType: 'FUND_PROGRESS_MISMATCH',
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (!existingAlert) {
        const mismatchAlert = await dispatchProjectAlert({
          project,
          alertType: 'FUND_PROGRESS_MISMATCH',
          severity: mismatch.severity,
          title: `Fund vs Physical Progress Discrepancy (${mismatch.difference}%)`,
          message: mismatch.message,
          riskScore: riskResult.riskScore
        });
        alertsGenerated.push(mismatchAlert);
      }
    }

    // High / Critical Risk Alert
    if (['HIGH', 'CRITICAL'].includes(riskResult.riskLevel)) {
      const alertType = riskResult.riskLevel === 'CRITICAL' ? 'CRITICAL_RISK' : 'HIGH_RISK';
      const existingRiskAlert = await Alert.findOne({
        projectId: project._id,
        alertType,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (!existingRiskAlert) {
        const riskAlert = await dispatchProjectAlert({
          project,
          alertType,
          severity: riskResult.riskLevel,
          title: `${riskResult.riskLevel} Project Risk (${riskResult.riskScore}/100)`,
          message: `Project risk escalated to ${riskResult.riskScore}/100 based on physical delay and financial utilization parameters.`,
          riskScore: riskResult.riskScore
        });
        alertsGenerated.push(riskAlert);
      }
    }

    await logAuditEvent({
      userId,
      action: 'REPORT_SUBMITTED',
      resourceType: 'MONTHLY_REPORT',
      resourceId: monthlyReport._id,
      details: {
        projectId: project._id,
        reportingMonth,
        actualPhysicalProgress,
        actualFinancialProgress,
        riskScore: riskResult.riskScore
      },
      ipAddress: req.ip
    });

    return sendSuccess(
      res,
      'Monthly progress report submitted and processed successfully.',
      {
        report: monthlyReport,
        riskAssessment: riskResult,
        delayClassification: nlpClassification,
        mismatchAnalysis: mismatch,
        alertsCreated: alertsGenerated
      },
      201
    );
  } catch (err) {
    return sendError(res, err.message || 'Failed to submit monthly report.', [], 500);
  }
}

/**
 * Get All Monthly Reports (Scoped by role or query)
 */
export async function getAllReports(req, res) {
  try {
    const { projectId, reportingMonth, limit = 100 } = req.query;
    const filter = {};

    if (projectId) {
      filter.projectId = projectId;
    }
    if (reportingMonth) {
      filter.reportingMonth = reportingMonth;
    }

    // Role-based filtering if Reporting Officer
    if (req.user?.role === 'REPORTING_OFFICER') {
      const userProjectIds = req.user.projectIds || [];
      filter.$or = [
        { submittedBy: req.user._id || req.user.id },
        ...(userProjectIds.length > 0 ? [{ projectId: { $in: userProjectIds } }] : [])
      ];
    }

    const reports = await MonthlyReport.find(filter)
      .populate('projectId', 'projectName name projectCode sector state originalProjectCost riskLevel riskScore')
      .populate('submittedBy', 'name fullName officialEmail designation')
      .sort({ createdAt: -1, reportingMonth: -1 })
      .limit(Number(limit));

    return sendSuccess(res, 'Monthly reports list retrieved.', reports);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch reports list.', [], 500);
  }
}

/**
 * Get Reports for a Project
 */
export async function getProjectReports(req, res) {
  try {
    let { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const proj = await Project.findOne({ $or: [{ projectCode: projectId }, { projectCode: { $regex: new RegExp(`^${projectId}$`, 'i') } }] }).select('_id');
      if (proj) projectId = proj._id;
      else return sendSuccess(res, 'Monthly reports retrieved.', []);
    }
    const reports = await MonthlyReport.find({ projectId })
      .populate('projectId', 'projectName name projectCode sector state originalProjectCost riskLevel riskScore')
      .populate('submittedBy', 'name fullName officialEmail designation')
      .sort({ reportingMonth: -1 });

    return sendSuccess(res, 'Monthly reports retrieved.', reports);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch reports.', [], 500);
  }
}

/**
 * Get Single Report by ID
 */
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const report = await MonthlyReport.findById(id)
      .populate('projectId')
      .populate('submittedBy', 'name fullName officialEmail designation');

    if (!report) {
      return sendError(res, 'Report not found.', [], 404);
    }
    return sendSuccess(res, 'Report details retrieved.', report);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch report.', [], 500);
  }
}

/**
 * Generate Comprehensive Project Analytics / Executive Report
 */
export async function generateExecutiveReport(req, res) {
  try {
    const { projectId, reportType = 'RISK_ASSESSMENT' } = req.body;
    
    let project = null;
    if (projectId) {
      project = await Project.findOne({
        $or: [{ _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }, { projectCode: projectId }]
      })
      .populate('ministryId', 'name code')
      .populate('implementationAgencyId', 'name agencyCode')
      .populate('nodalOfficer', 'name fullName officialEmail phone');
    }

    if (!project) {
      project = await Project.findOne().sort({ createdAt: -1 });
    }

    const latestReports = project 
      ? await MonthlyReport.find({ projectId: project._id }).sort({ reportingMonth: -1 }).limit(6)
      : [];

    const alerts = project
      ? await Alert.find({ projectId: project._id }).sort({ createdAt: -1 }).limit(10)
      : [];

    const generatedData = {
      reportId: `NIV-REP-${Date.now().toString().slice(-6)}`,
      reportType,
      generatedAt: new Date().toISOString(),
      project: project || { projectName: 'National Infrastructure Portfolio Summary' },
      historicalTrend: latestReports.map(r => ({
        month: r.reportingMonth,
        expenditure: r.expenditure,
        physicalProgress: r.actualPhysicalProgress,
        financialProgress: r.actualFinancialProgress,
        riskScore: r.riskScore
      })),
      recentAlerts: alerts,
      summary: {
        riskLevel: project?.riskLevel || 'MODERATE',
        riskScore: project?.riskScore || 52,
        financialProgress: project?.financialProgress || 0,
        physicalProgress: project?.physicalProgress || 0,
        recommendation: project?.riskLevel === 'HIGH' || project?.riskLevel === 'CRITICAL'
          ? 'Urgent inter-ministerial coordination meeting recommended to resolve critical clearances.'
          : 'Project executing within acceptable variance thresholds.'
      }
    };

    return sendSuccess(res, 'Executive report generated successfully.', generatedData);
  } catch (err) {
    return sendError(res, err.message || 'Failed to generate report.', [], 500);
  }
}
