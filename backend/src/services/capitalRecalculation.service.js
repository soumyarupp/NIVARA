import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Ministry } from '../models/Ministry.js';
import { ImplementationAgency } from '../models/ImplementationAgency.js';
import { Organization } from '../models/Organization.js';

/**
 * Recalculate total sanctioned capital, projects count, and expenditure for a specific ministry
 * @param {string|mongoose.Types.ObjectId} ministryId 
 */
export async function recalculateMinistryCapital(ministryId) {
  if (!ministryId) return null;
  const mId = new mongoose.Types.ObjectId(String(ministryId));

  const stats = await Project.aggregate([
    {
      $match: {
        $or: [{ ministryId: mId }, { lineMinistryId: mId }]
      }
    },
    {
      $group: {
        _id: null,
        totalSanctionedCapital: {
          $sum: { $ifNull: ['$originalProjectCost', '$sanctionedCost', 0] }
        },
        totalExpenditure: {
          $sum: { $ifNull: ['$expenditure', '$totalActualExpenditure', 0] }
        },
        totalProjectsCount: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || {
    totalSanctionedCapital: 0,
    totalExpenditure: 0,
    totalProjectsCount: 0
  };

  const roundedCapital = Math.round(result.totalSanctionedCapital * 100) / 100;
  const roundedExpenditure = Math.round(result.totalExpenditure * 100) / 100;
  const now = new Date();

  // Update Ministry model
  const minDoc = await Ministry.findByIdAndUpdate(
    mId,
    {
      $set: {
        totalSanctionedCapital: roundedCapital,
        totalExpenditure: roundedExpenditure,
        totalProjectsCount: result.totalProjectsCount,
        lastCapitalRecalculatedAt: now
      }
    },
    { new: true }
  );

  // Update Organization model (type: MINISTRY) if matching _id or ministry code
  if (minDoc?.code) {
    await Organization.updateMany(
      {
        $or: [{ _id: mId }, { code: minDoc.code, type: 'MINISTRY' }]
      },
      {
        $set: {
          totalSanctionedCapital: roundedCapital,
          totalExpenditure: roundedExpenditure,
          totalProjectsCount: result.totalProjectsCount,
          lastCapitalRecalculatedAt: now
        }
      }
    );
  } else {
    await Organization.findByIdAndUpdate(mId, {
      $set: {
        totalSanctionedCapital: roundedCapital,
        totalExpenditure: roundedExpenditure,
        totalProjectsCount: result.totalProjectsCount,
        lastCapitalRecalculatedAt: now
      }
    });
  }

  return {
    ministryId: mId,
    totalSanctionedCapital: roundedCapital,
    totalExpenditure: roundedExpenditure,
    totalProjectsCount: result.totalProjectsCount
  };
}

/**
 * Recalculate total sanctioned capital, projects count, and expenditure for a specific implementation agency
 * @param {string|mongoose.Types.ObjectId} agencyId 
 */
export async function recalculateAgencyCapital(agencyId) {
  if (!agencyId) return null;
  const agId = new mongoose.Types.ObjectId(String(agencyId));

  const stats = await Project.aggregate([
    {
      $match: {
        $or: [
          { implementationAgencyId: agId },
          { implementingAgencyId: agId },
          { agencyId: agId }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalSanctionedCapital: {
          $sum: { $ifNull: ['$originalProjectCost', '$sanctionedCost', 0] }
        },
        totalExpenditure: {
          $sum: { $ifNull: ['$expenditure', '$totalActualExpenditure', 0] }
        },
        totalProjectsCount: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || {
    totalSanctionedCapital: 0,
    totalExpenditure: 0,
    totalProjectsCount: 0
  };

  const roundedCapital = Math.round(result.totalSanctionedCapital * 100) / 100;
  const roundedExpenditure = Math.round(result.totalExpenditure * 100) / 100;
  const now = new Date();

  // Update ImplementationAgency model
  const agDoc = await ImplementationAgency.findByIdAndUpdate(
    agId,
    {
      $set: {
        totalSanctionedCapital: roundedCapital,
        totalExpenditure: roundedExpenditure,
        totalProjectsCount: result.totalProjectsCount,
        lastCapitalRecalculatedAt: now
      }
    },
    { new: true }
  );

  // Update Organization model (type: IMPLEMENTING_AGENCY) if matching _id or agency code
  const code = agDoc?.agencyCode || agDoc?.code;
  if (code) {
    await Organization.updateMany(
      {
        $or: [{ _id: agId }, { code: code, type: 'IMPLEMENTING_AGENCY' }]
      },
      {
        $set: {
          totalSanctionedCapital: roundedCapital,
          totalExpenditure: roundedExpenditure,
          totalProjectsCount: result.totalProjectsCount,
          lastCapitalRecalculatedAt: now
        }
      }
    );
  } else {
    await Organization.findByIdAndUpdate(agId, {
      $set: {
        totalSanctionedCapital: roundedCapital,
        totalExpenditure: roundedExpenditure,
        totalProjectsCount: result.totalProjectsCount,
        lastCapitalRecalculatedAt: now
      }
    });
  }

  return {
    agencyId: agId,
    totalSanctionedCapital: roundedCapital,
    totalExpenditure: roundedExpenditure,
    totalProjectsCount: result.totalProjectsCount
  };
}

/**
 * Trigger recalculation for all entities associated with a project
 * @param {Object} project - Project document or object containing IDs
 */
export async function recalculateProjectEntities(project) {
  if (!project) return;
  const tasks = [];

  const ministryIds = new Set([
    project.ministryId?.toString(),
    project.lineMinistryId?.toString()
  ].filter(Boolean));

  for (const mId of ministryIds) {
    tasks.push(recalculateMinistryCapital(mId));
  }

  const agencyIds = new Set([
    project.implementationAgencyId?.toString(),
    project.implementingAgencyId?.toString(),
    project.agencyId?.toString()
  ].filter(Boolean));

  for (const agId of agencyIds) {
    tasks.push(recalculateAgencyCapital(agId));
  }

  return Promise.allSettled(tasks);
}

/**
 * Comprehensive master synchronization across ALL ministries, agencies, and organizations
 */
export async function syncAllMinistriesAndAgenciesCapital() {
  console.log('🔄 Calculating and synchronizing Sanctioned Capital across all Line Ministries and Implementation Agencies...');

  // 1. Recalculate Ministries
  const allMinistries = await Ministry.find({}).lean();
  for (const min of allMinistries) {
    await recalculateMinistryCapital(min._id);
  }

  // 2. Recalculate Implementation Agencies
  const allAgencies = await ImplementationAgency.find({}).lean();
  for (const ag of allAgencies) {
    await recalculateAgencyCapital(ag._id);
  }

  // 3. Recalculate any remaining standalone Organizations
  const allOrgs = await Organization.find({}).lean();
  for (const org of allOrgs) {
    if (org.type === 'MINISTRY') {
      await recalculateMinistryCapital(org._id);
    } else {
      await recalculateAgencyCapital(org._id);
    }
  }

  console.log(`✅ Sanctioned Capital synchronized for ${allMinistries.length} Ministries and ${allAgencies.length} Agencies.`);
  return {
    ministriesCount: allMinistries.length,
    agenciesCount: allAgencies.length,
    organizationsCount: allOrgs.length
  };
}
