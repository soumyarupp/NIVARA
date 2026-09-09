import { Project } from '../models/Project.js';
import { Alert } from '../models/Alert.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Ministry } from '../models/Ministry.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getDashboardSummary(req, res) {
  try {
    const [counts, financials, alertCounts] = await Promise.all([
      Project.aggregate([
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
      ]),
      Alert.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const activeCriticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL', status: 'ACTIVE' });
    const activeHighAlerts = await Alert.countDocuments({ severity: 'HIGH', status: 'ACTIVE' });

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
    const distribution = await Project.aggregate([
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
    const reasons = await MonthlyReport.aggregate([
      {
        $match: {
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
    const stateSummary = await Project.aggregate([
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
    const sectorSummary = await Project.aggregate([
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
    const ministrySummary = await Project.aggregate([
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
