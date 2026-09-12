import { Project } from '../models/Project.js';
import { Alert } from '../models/Alert.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Ministry } from '../models/Ministry.js';
import { Clearance } from '../models/Clearance.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Build project match filter based on user role and jurisdiction
 */
function buildProjectMatch(user) {
  const role = user?.role || 'SUPER_ADMIN';
  const uid = user?._id || user?.id;

  if (['SUPER_ADMIN', 'IPMD_ADMIN'].includes(role)) {
    return {};
  }
  if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role)) {
    const minId = user.ministryId || user.organizationId;
    return {
      $or: [{ ministryId: minId }, { lineMinistryId: minId }]
    };
  }
  if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(role)) {
    const agId = user.agencyId || user.organizationId;
    return {
      $or: [
        { implementationAgencyId: agId },
        { implementingAgencyId: agId },
        { createdBy: uid }
      ]
    };
  }
  if (role === 'NODAL_OFFICER') {
    return {
      $or: [
        { nodalOfficer: uid },
        { nodalOfficerId: uid },
        { _id: { $in: user.projectIds || [] } }
      ]
    };
  }
  if (role === 'REPORTING_OFFICER') {
    return {
      $or: [
        { reportingOfficers: uid },
        { reportingOfficerId: uid },
        { _id: { $in: user.projectIds || [] } }
      ]
    };
  }
  return { _id: null };
}

/**
 * Helper to get scoped alert query
 */
async function getScopedAlertFilter(user) {
  const role = user?.role || 'SUPER_ADMIN';
  const uid = user?._id || user?.id;

  if (role === 'REPORTING_OFFICER') {
    return null; // No alerts for reporting officers
  }
  if (role === 'NODAL_OFFICER') {
    const userProjects = await Project.find({
      $or: [
        { nodalOfficer: uid },
        { nodalOfficerId: uid },
        { _id: { $in: user.projectIds || [] } }
      ]
    }).select('_id');
    return { projectId: { $in: userProjects.map(p => p._id) } };
  }
  if (['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN'].includes(role)) {
    const agId = user.agencyId || user.organizationId;
    const agencyProjects = await Project.find({
      $or: [
        { implementationAgencyId: agId },
        { implementingAgencyId: agId },
        { agencyId: agId }
      ]
    }).select('_id');
    return {
      projectId: { $in: agencyProjects.map(p => p._id) },
      severity: { $in: ['CRITICAL', 'HIGH'] }
    };
  }
  if (['MINISTRY_OFFICER', 'MINISTRY_ADMIN'].includes(role)) {
    const minId = user.ministryId || user.organizationId;
    const minProjects = await Project.find({
      $or: [
        { ministryId: minId },
        { lineMinistryId: minId }
      ]
    }).select('_id');
    return { projectId: { $in: minProjects.map(p => p._id) } };
  }
  return {};
}

export async function getDashboardSummary(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const projectMatchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const [counts, financials] = await Promise.all([
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            ongoingProjects: {
              $sum: { $cond: [{ $in: ['$projectStatus', ['ONGOING', 'IN_PROGRESS', 'APPROVED']] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$projectStatus', 'COMPLETED'] }, 1, 0] }
            },
            underReviewProjects: {
              $sum: { $cond: [{ $eq: ['$projectStatus', 'UNDER_REVIEW'] }, 1, 0] }
            },
            draftProjects: {
              $sum: { $cond: [{ $eq: ['$projectStatus', 'DRAFT'] }, 1, 0] }
            },
            highRiskProjects: {
              $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
            }
          }
        }
      ]),
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$originalProjectCost' },
            totalExpenditure: {
              $sum: { $ifNull: ['$expenditure', '$totalActualExpenditure', 0] }
            },
            avgPhysicalProgress: { $avg: '$physicalProgress' },
            avgFinancialProgress: { $avg: '$financialProgress' }
          }
        }
      ])
    ]);

    let activeCriticalAlerts = 0;
    let activeHighAlerts = 0;
    const alertFilter = await getScopedAlertFilter(req.user);

    if (alertFilter) {
      activeCriticalAlerts = await Alert.countDocuments({ ...alertFilter, severity: 'CRITICAL', status: 'ACTIVE' });
      activeHighAlerts = await Alert.countDocuments({ ...alertFilter, severity: 'HIGH', status: 'ACTIVE' });
    }

    const c = counts[0] || {
      totalProjects: 0,
      ongoingProjects: 0,
      completedProjects: 0,
      underReviewProjects: 0,
      draftProjects: 0,
      highRiskProjects: 0
    };

    const f = financials[0] || {
      totalCost: 0,
      totalExpenditure: 0,
      avgPhysicalProgress: 0,
      avgFinancialProgress: 0
    };

    return sendSuccess(res, 'Dashboard summary retrieved.', {
      totalProjects: c.totalProjects,
      ongoingProjects: c.ongoingProjects,
      completedProjects: c.completedProjects,
      underReviewProjects: c.underReviewProjects,
      draftProjects: c.draftProjects,
      highRiskProjects: c.highRiskProjects,
      criticalAlerts: activeCriticalAlerts,
      highAlerts: activeHighAlerts,
      totalProjectCost: Math.round(f.totalCost * 100) / 100,
      totalExpenditure: Math.round(f.totalExpenditure * 100) / 100,
      averagePhysicalProgress: Math.round((f.avgPhysicalProgress || 0) * 10) / 10,
      averageFinancialProgress: Math.round((f.avgFinancialProgress || 0) * 10) / 10
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch dashboard summary.', [], 500);
  }
}

export async function getRiskDistribution(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const matchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const distribution = await Project.aggregate([
      ...matchPipeline,
      {
        $group: {
          _id: { $ifNull: ['$riskLevel', 'LOW'] },
          count: { $sum: 1 },
          totalCost: { $sum: '$originalProjectCost' }
        }
      }
    ]);

    const formatted = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    distribution.forEach((item) => {
      if (formatted[item._id] !== undefined) {
        formatted[item._id] = item.count;
      }
    });

    return sendSuccess(res, 'Risk distribution retrieved.', formatted);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch risk distribution.', [], 500);
  }
}

export async function getDelayReasons(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const scopedProjects = await Project.find(projectMatch).select('_id');
    const projectIds = scopedProjects.map(p => p._id);

    const reasons = await MonthlyReport.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          autoDetectedDelayReason: { $nin: ['NONE', null] }
        }
      },
      {
        $group: {
          _id: '$autoDetectedDelayReason',
          count: { $sum: 1 },
          avgDelayDays: { $avg: '$delayDays' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return sendSuccess(res, 'Delay reasons breakdown retrieved.', reasons);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch delay reasons.', [], 500);
  }
}

export async function getStateSummary(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const matchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const stateSummary = await Project.aggregate([
      ...matchPipeline,
      {
        $group: {
          _id: { $ifNull: ['$state', 'National / Multi-State'] },
          totalProjects: { $sum: 1 },
          totalCost: { $sum: '$originalProjectCost' },
          totalExpenditure: { $sum: { $ifNull: ['$expenditure', 0] } },
          highRiskCount: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
          },
          avgPhysicalProgress: { $avg: '$physicalProgress' }
        }
      },
      { $sort: { totalProjects: -1 } }
    ]);

    return sendSuccess(res, 'State-wise summary retrieved.', stateSummary);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch state summary.', [], 500);
  }
}

export async function getSectorSummary(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const matchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const sectorSummary = await Project.aggregate([
      ...matchPipeline,
      {
        $group: {
          _id: '$sector',
          totalProjects: { $sum: 1 },
          totalCost: { $sum: '$originalProjectCost' },
          totalExpenditure: { $sum: { $ifNull: ['$expenditure', 0] } },
          highRiskCount: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
          },
          avgPhysicalProgress: { $avg: '$physicalProgress' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    return sendSuccess(res, 'Sector-wise summary retrieved.', sectorSummary);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch sector summary.', [], 500);
  }
}

export async function getMinistrySummary(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const matchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const ministrySummary = await Project.aggregate([
      ...matchPipeline,
      {
        $group: {
          _id: '$ministryId',
          totalProjects: { $sum: 1 },
          totalCost: { $sum: '$originalProjectCost' },
          totalExpenditure: { $sum: { $ifNull: ['$expenditure', 0] } },
          highRiskCount: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
          },
          avgPhysicalProgress: { $avg: '$physicalProgress' }
        }
      },
      {
        $lookup: {
          from: 'ministries',
          localField: '_id',
          foreignField: '_id',
          as: 'ministry'
        }
      },
      {
        $unwind: {
          path: '$ministry',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          ministryId: '$_id',
          ministryName: '$ministry.name',
          ministryCode: '$ministry.code',
          totalProjects: 1,
          totalCost: 1,
          totalExpenditure: 1,
          highRiskCount: 1,
          avgPhysicalProgress: 1
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    return sendSuccess(res, 'Ministry-wise summary retrieved.', ministrySummary);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch ministry summary.', [], 500);
  }
}

export async function getDashboardOverview(req, res) {
  try {
    const projectMatch = buildProjectMatch(req.user);
    const hasMatch = Object.keys(projectMatch).length > 0;
    const projectMatchPipeline = hasMatch ? [{ $match: projectMatch }] : [];

    const scopedProjects = await Project.find(projectMatch).select('_id originalProjectCost revisedProjectCost');
    const projectIds = scopedProjects.map(p => p._id);

    const [counts, financials, delayAgg, monthlyEvolution, pendingClearances, riskDist] = await Promise.all([
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            ongoingProjects: {
              $sum: { $cond: [{ $in: ['$projectStatus', ['ONGOING', 'IN_PROGRESS', 'APPROVED', 'SUBMITTED']] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$projectStatus', 'COMPLETED'] }, 1, 0] }
            },
            highRiskProjects: {
              $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
            }
          }
        }
      ]),
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: null,
            totalCost: { $sum: { $ifNull: ['$originalProjectCost', '$sanctionedCost', 0] } },
            revisedCost: { $sum: { $ifNull: ['$revisedProjectCost', '$originalProjectCost', 0] } },
            totalExpenditure: {
              $sum: { $ifNull: ['$expenditure', '$totalActualExpenditure', 0] }
            },
            avgPhysicalProgress: { $avg: '$physicalProgress' },
            avgFinancialProgress: { $avg: '$financialProgress' }
          }
        }
      ]),
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: null,
            avgDelayDays: { $avg: '$delayDays' },
            avgDelayMonths: { $avg: '$delayMonths' }
          }
        }
      ]),
      MonthlyReport.aggregate([
        {
          $match: {
            projectId: { $in: projectIds }
          }
        },
        {
          $group: {
            _id: '$reportingMonth',
            expenditure: { $sum: '$expenditure' },
            avgPhysical: { $avg: '$actualPhysicalProgress' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Clearance.aggregate([
        { $match: { projectId: { $in: projectIds }, status: 'PENDING' } },
        {
          $group: {
            _id: '$clearanceType',
            pending: { $sum: 1 }
          }
        },
        { $sort: { pending: -1 } },
        { $limit: 6 }
      ]),
      Project.aggregate([
        ...projectMatchPipeline,
        {
          $group: {
            _id: { $ifNull: ['$riskLevel', 'LOW'] },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    let activeCriticalAlerts = 0;
    let activeHighAlerts = 0;
    const alertFilter = await getScopedAlertFilter(req.user);
    if (alertFilter) {
      activeCriticalAlerts = await Alert.countDocuments({ ...alertFilter, severity: 'CRITICAL', status: 'ACTIVE' });
      activeHighAlerts = await Alert.countDocuments({ ...alertFilter, severity: 'HIGH', status: 'ACTIVE' });
    }

    const c = counts[0] || { totalProjects: 0, ongoingProjects: 0, completedProjects: 0, highRiskProjects: 0 };
    const f = financials[0] || { totalCost: 0, revisedCost: 0, totalExpenditure: 0, avgPhysicalProgress: 0, avgFinancialProgress: 0 };
    const d = delayAgg[0] || { avgDelayDays: 0, avgDelayMonths: 0 };

    const avgDelayMonthsVal = d.avgDelayMonths 
      ? Math.round(d.avgDelayMonths * 10) / 10 
      : (d.avgDelayDays ? Math.round((d.avgDelayDays / 30.4) * 10) / 10 : 0);

    const formattedOutlay = f.totalCost >= 100000 
      ? `₹${(f.totalCost / 100000).toFixed(2)} Lakh Crore` 
      : `₹${Math.round(f.totalCost).toLocaleString('en-IN')} Cr`;

    const now = new Date();
    const lastUpdated = `${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`;

    // Format risk distribution
    const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    riskDist.forEach(item => {
      const k = (item._id || 'LOW').toUpperCase();
      if (riskCounts[k] !== undefined) riskCounts[k] = item.count;
    });

    // Format monthly evolution with original, revised, and actual spend on Lakh Cr scale
    const totalOrigLakhCr = Math.round((f.totalCost / 100000) * 100) / 100;
    const totalRevLakhCr = Math.round((f.revisedCost / 100000) * 100) / 100;

    const monthNames = {
      '2026-01': 'Jan 2026',
      '2026-02': 'Feb 2026',
      '2026-03': 'Mar 2026',
      '2026-04': 'Apr 2026',
      '2026-05': 'May 2026',
      '2026-06': 'Jun 2026',
      '2026-07': 'Jul 2026',
      '2026-08': 'Aug 2026',
      '2026-09': 'Sep 2026',
      '2026-10': 'Oct 2026',
      '2026-11': 'Nov 2026',
      '2026-12': 'Dec 2026'
    };

    const formattedCostEvolution = monthlyEvolution.map(m => {
      const expLakhCr = Math.round((m.expenditure / 100000) * 100) / 100;
      return {
        _id: m._id,
        name: monthNames[m._id] || m._id,
        expenditure: expLakhCr,
        original: totalOrigLakhCr,
        revised: totalRevLakhCr,
        rawExpenditureCr: Math.round(m.expenditure * 10) / 10,
        avgPhysical: Math.min(100, Math.round((m.avgPhysical || 0) * 10) / 10)
      };
    });

    // Format clearance bottlenecks
    const clearanceBottlenecks = pendingClearances.map(cl => {
      const formattedName = cl._id.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) + ' Clearance';
      return {
        name: formattedName,
        pending: cl.pending,
        avgDays: `${Math.round(cl.pending * 4 + 30)} days`,
        risk: cl.pending > 15 ? 'Critical' : cl.pending > 8 ? 'High' : 'Medium'
      };
    });

    return sendSuccess(res, 'Dashboard overview retrieved.', {
      totalProjects: c.totalProjects,
      ongoingProjects: c.ongoingProjects,
      completedProjects: c.completedProjects,
      highRiskProjects: c.highRiskProjects,
      criticalAlerts: activeCriticalAlerts,
      totalCost: f.totalCost,
      revisedCost: f.revisedCost,
      totalExpenditure: f.totalExpenditure,
      avgPhysicalProgress: Math.round((f.avgPhysicalProgress || 0) * 10) / 10,
      avgFinancialProgress: Math.round((f.avgFinancialProgress || 0) * 10) / 10,
      avgPredictedDelayMonths: avgDelayMonthsVal,
      lastUpdated,
      summary: {
        totalMonitoredOutlay: formattedOutlay,
        projectsAtRisk: `${c.highRiskProjects} Projects`,
        totalProjects: c.totalProjects,
        criticalAlerts: activeCriticalAlerts
      },
      costEvolution: formattedCostEvolution,
      riskDistribution: riskCounts,
      clearanceBottlenecks: clearanceBottlenecks
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch dashboard overview.', [], 500);
  }
}
