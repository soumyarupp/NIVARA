import mongoose from 'mongoose';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Project } from '../models/Project.js';
import { Clearance } from '../models/Clearance.js';
import { LandDetail } from '../models/LandDetail.js';
import { Alert } from '../models/Alert.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { calculateFinancialProgress, calculateProgressGap } from '../utils/calculations.js';
import { classifyDelayReason } from '../services/delayClassifier.js';
import { detectProgressMismatch } from '../services/mismatchDetector.js';
import { calculateProjectRisk } from '../services/riskEngine.js';
import { getProjectAiAnalysis } from '../services/ai.service.js';
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

    // Guard: Completed projects cannot receive further reports
    if (
      project.status === 'COMPLETED' || 
      project.projectStatus === 'COMPLETED' || 
      (project.physicalProgress && Number(project.physicalProgress?.overallPercentage ?? project.physicalProgress) >= 100)
    ) {
      return sendError(res, 'This project is already marked as COMPLETED (100% Progress). No further monthly reports can be submitted.', [], 400);
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

    // 5. Evaluate Multi-Factor Risk Score (Rule-Based)
    const riskResult = calculateProjectRisk({
      project,
      financialProgress: actualFinancialProgress,
      physicalProgress: actualPhysicalProgress,
      plannedPhysicalProgress: plannedPhysicalProgress || actualPhysicalProgress,
      daysSinceLastReport: 0,
      pendingClearancesCount,
      remainingLandPercentage
    });

    // 6. Run Instant AI Risk Model Prediction (CatBoost ML + Isolation Forest + NLP)
    const delayDaysNum = Number(delayDays) || 0;
    const delayMonthsNum = Math.max(0, Math.round(delayDaysNum / 30));

    let aiAnalysis = null;
    try {
      aiAnalysis = await getProjectAiAnalysis({
        ...project.toObject(),
        expenditure,
        physicalProgress: actualPhysicalProgress,
        delayDays: delayDaysNum,
        delayMonths: delayMonthsNum,
        actualFinancialProgress,
        actualPhysicalProgress
      });
    } catch (aiErr) {
      console.warn('[AI Evaluation Error in submitMonthlyReport]:', aiErr.message);
    }

    // Determine final risk score & level combining multi-factor rule engine and AI model
    const isCompleted = actualPhysicalProgress >= 100;

    let finalRiskScore = isCompleted ? 0 : riskResult.riskScore;
    if (!isCompleted && aiAnalysis && aiAnalysis.risk?.['3_month']?.probability !== undefined) {
      const aiScore = Math.round(aiAnalysis.risk['3_month'].probability * 100);
      finalRiskScore = Math.round(riskResult.riskScore * 0.4 + aiScore * 0.6);
    }

    let finalRiskLevel = 'LOW';
    if (isCompleted) {
      finalRiskLevel = 'LOW';
    } else if (finalRiskScore >= 75) {
      finalRiskLevel = 'CRITICAL';
    } else if (finalRiskScore >= 50) {
      finalRiskLevel = 'HIGH';
    } else if (finalRiskScore >= 25) {
      finalRiskLevel = 'MEDIUM';
    } else {
      finalRiskLevel = 'LOW';
    }

    // 7. Save or Upsert Monthly Report with AI analysis & risk assessment
    const reportData = {
      projectId,
      reportingMonth,
      plannedFinancialProgress: plannedFinProg,
      actualFinancialProgress,
      plannedPhysicalProgress: plannedPhysicalProgress || 0,
      actualPhysicalProgress,
      expenditure,
      delayDays: isCompleted ? 0 : delayDaysNum,
      delayReasonText: isCompleted ? 'Project execution fully completed and commissioned.' : delayReasonText,
      autoDetectedDelayReason: isCompleted ? 'NONE' : nlpClassification.category,
      delayConfidence: nlpClassification.confidence,
      matchedKeywords: nlpClassification.matchedKeywords,
      mismatchDetected: isCompleted ? false : mismatch.mismatch,
      mismatchDifference: isCompleted ? 0 : mismatch.difference,
      mismatchSeverity: isCompleted ? 'LOW' : mismatch.severity,
      calculatedRiskScore: finalRiskScore,
      calculatedRiskLevel: finalRiskLevel,
      aiAnalysis: aiAnalysis || null,
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

    // 8. Update Master Project Cached Metrics and Store AI Prediction in DB
    project.financialProgress = actualFinancialProgress;
    project.physicalProgress = actualPhysicalProgress;
    project.plannedPhysicalProgress = plannedPhysicalProgress || project.plannedPhysicalProgress;
    project.plannedFinancialProgress = plannedFinProg;
    project.expenditure = expenditure;
    project.totalActualExpenditure = expenditure;
    project.delayDays = isCompleted ? 0 : delayDaysNum;
    project.delayMonths = isCompleted ? 0 : delayMonthsNum;
    project.riskScore = finalRiskScore;
    project.riskLevel = finalRiskLevel;
    if (isCompleted) {
      project.status = 'COMPLETED';
      project.projectStatus = 'COMPLETED';
    }
    if (aiAnalysis) {
      project.aiPrediction = aiAnalysis;
      project.aiLastEvaluatedAt = new Date();
    }
    project.latestReportDate = new Date();

    // Update monthlyReports array & reportingMonths
    const [rptYear, rptMonth] = (reportingMonth || '').split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = rptMonth && rptMonth >= 1 && rptMonth <= 12 ? `${monthNames[rptMonth - 1]} ${rptYear}` : reportingMonth;

    const monthlyItem = {
      reportingMonth,
      year: rptYear || new Date().getFullYear(),
      month: rptMonth || (new Date().getMonth() + 1),
      monthName,
      expenditure,
      cumulativeExpenditure: expenditure,
      actualPhysicalProgress,
      actualFinancialProgress,
      plannedPhysicalProgress: plannedPhysicalProgress || 0,
      plannedFinancialProgress: plannedFinProg,
      delayMonths: delayMonthsNum,
      delayDays: delayDaysNum,
      delayReasonText,
      remarks
    };

    if (!Array.isArray(project.monthlyReports)) {
      project.monthlyReports = [];
    }
    const existingRptIdx = project.monthlyReports.findIndex(r => r.reportingMonth === reportingMonth);
    if (existingRptIdx >= 0) {
      project.monthlyReports[existingRptIdx] = monthlyItem;
    } else {
      project.monthlyReports.push(monthlyItem);
    }
    project.totalReportsCount = project.monthlyReports.length;
    if (!project.reportingMonths) project.reportingMonths = [];
    if (!project.reportingMonths.includes(reportingMonth)) {
      project.reportingMonths.push(reportingMonth);
    }

    await project.save();

    // 9. Generate Alerts & Dispatch Notifications if needed (Routed to Nodal, Escalated to Agency if High/Critical)
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
          riskScore: finalRiskScore
        });
        alertsGenerated.push(mismatchAlert);
      }
    }

    // High / Critical Risk Alert
    if (['HIGH', 'CRITICAL'].includes(finalRiskLevel)) {
      const alertType = finalRiskLevel === 'CRITICAL' ? 'CRITICAL_RISK' : 'HIGH_RISK';
      const existingRiskAlert = await Alert.findOne({
        projectId: project._id,
        alertType,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });

      if (!existingRiskAlert) {
        const riskAlert = await dispatchProjectAlert({
          project,
          alertType,
          severity: finalRiskLevel,
          title: `${finalRiskLevel} Project Risk (${finalRiskScore}/100)`,
          message: `Project risk escalated to ${finalRiskScore}/100 based on AI analysis, physical delay, and financial utilization parameters.`,
          riskScore: finalRiskScore
        });
        alertsGenerated.push(riskAlert);
      }
    }

    // 10. Direct live telemetry notification for assigned Nodal Officer(s)
    const nodalUserIds = new Set();
    if (project.nodalOfficer?._id) nodalUserIds.add(project.nodalOfficer._id.toString());
    else if (project.nodalOfficer) nodalUserIds.add(project.nodalOfficer.toString());
    if (project.nodalOfficerId) nodalUserIds.add(project.nodalOfficerId.toString());

    // Also find any Nodal Officer linked to this project or agency
    try {
      const assignedNodals = await User.find({
        role: 'NODAL_OFFICER',
        $or: [
          { projectIds: project._id },
          { agencyId: project.implementationAgencyId },
          { agencyId: project.implementingAgencyId }
        ]
      }).select('_id');
      assignedNodals.forEach(u => nodalUserIds.add(u._id.toString()));

      // Fallback: if no nodal officer mapped, notify all active Nodal Officers
      if (nodalUserIds.size === 0) {
        const allNodals = await User.find({ role: 'NODAL_OFFICER' }).select('_id');
        allNodals.forEach(u => nodalUserIds.add(u._id.toString()));
      }
    } catch (e) {
      console.warn('Error querying nodal officers:', e.message);
    }

    const ai3mRisk = aiAnalysis?.risk?.['3_month']?.probability !== undefined
      ? `${Math.round(aiAnalysis.risk['3_month'].probability * 100)}%`
      : 'Active';

    for (const nUserId of nodalUserIds) {
      await Notification.create({
        userId: nUserId,
        projectId: project._id,
        title: `Monthly Progress Report: ${project.projectName || 'Project'}`,
        message: `${req.user.name || req.user.fullName || 'Reporting Officer'} submitted ${reportingMonth} return: Physical: ${actualPhysicalProgress}%, Cumulative Spend: ₹${expenditure} Cr. Instant AI Risk Assessment: ${finalRiskLevel} (${finalRiskScore}/100, 3M Probability: ${ai3mRisk}).`,
        type: 'PROGRESS_UPDATE',
        severity: finalRiskLevel || 'LOW'
      }).catch(err => console.warn('Nodal notification creation notice:', err.message));
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
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel
      },
      ipAddress: req.ip
    });

    return sendSuccess(
      res,
      'Monthly progress report submitted and processed successfully.',
      {
        report: monthlyReport,
        riskAssessment: {
          riskScore: finalRiskScore,
          riskLevel: finalRiskLevel,
          ruleScore: riskResult.riskScore
        },
        aiAnalysis,
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
