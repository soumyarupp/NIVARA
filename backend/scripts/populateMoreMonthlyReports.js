import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { MonthlyReport } from '../src/models/MonthlyReport.js';

const MONTH_CYCLES = [
  { month: '2026-01', factor: 0.55, day: '2026-01-28' },
  { month: '2026-02', factor: 0.63, day: '2026-02-28' },
  { month: '2026-03', factor: 0.72, day: '2026-03-30' },
  { month: '2026-04', factor: 0.80, day: '2026-04-29' },
  { month: '2026-05', factor: 0.87, day: '2026-05-30' },
  { month: '2026-06', factor: 0.94, day: '2026-06-29' },
  { month: '2026-07', factor: 1.00, day: '2026-07-31' },
  { month: '2026-08', factor: 1.06, day: '2026-08-31' }
];

const SAMPLE_REMARKS_BY_REASON = {
  LAND_ACQUISITION: [
    'Right of way possession in progress for package 2 corridor. Compensation distribution under Section 3G ongoing.',
    'Additional land acquisition for bypass alignment submitted to District Revenue authority.',
    'Private land parcels demarcation completed; physical possession handover scheduled next cycle.'
  ],
  FOREST_CLEARANCE: [
    'Stage-II forest diversion clearance awaited from State Forest Department for 14.5 Ha stretch.',
    'Tree felling completed in non-forest zone; compensatory afforestation deposit certified.',
    'Wildlife management plan submitted to National Board for Wildlife for review.'
  ],
  UTILITY_SHIFTING: [
    'HT power transmission line shifting in progress by state electricity distribution company.',
    'Underground water pipeline relocation package awarded to state water board.',
    'Gas pipeline crossing clearance received from GAIL; trenching work underway.'
  ],
  CONTRACTOR_ISSUE: [
    'Contractor mobilized additional excavators and piling rigs to recover schedule slippage.',
    'Sub-contractor deployed 2nd shift for bridge superstructure launching girder operations.',
    'Batching plant operational capacity augmented to 120 cu.m/hr to accelerate paving.'
  ],
  WEATHER: [
    'Monsoon rain impacted earthwork and subgrade embankment compaction in low-lying sections.',
    'High river water discharge slowed pier foundation work; anti-scour protection active.',
    'Normal dry weather conditions resumed; round-the-clock asphalt laying initiated.'
  ],
  NONE: [
    'Physical milestone execution proceeding in line with approved CPM/PERT schedule.',
    'Civil superstructure works progressing smoothly with zero contractual impediments.',
    'Monthly progress targets achieved. Statutory inspection and quality audit cleared.'
  ]
};

async function populateReports() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();

    const repOfficer = await User.findOne({
      $or: [
        { email: 'reporting.officer@nhai.gov.in' },
        { role: 'REPORTING_OFFICER' }
      ]
    });

    if (!repOfficer) {
      console.error('❌ No reporting officer found!');
      process.exit(1);
    }

    const projects = await Project.find({});
    console.log(`📦 Found ${projects.length} projects in database.`);

    const bulkOps = [];
    const projectUpdates = [];
    let countNewReports = 0;

    for (let pIdx = 0; pIdx < projects.length; pIdx++) {
      const proj = projects[pIdx];
      const cost = Number(proj.originalProjectCost || proj.sanctionedCost || proj.budgetEstimatedInCrores || 500);
      const curPhys = Number(proj.physicalProgress ?? 45);
      const curFin = Number(proj.financialProgress ?? 50);
      const curExp = Number(proj.expenditure || proj.totalActualExpenditure || (cost * (curFin / 100)));
      const baseDelay = Number(proj.delayDays || 0);

      const delayReasonCat = (proj.riskLevel === 'CRITICAL' || proj.riskLevel === 'HIGH')
        ? (pIdx % 3 === 0 ? 'LAND_ACQUISITION' : pIdx % 3 === 1 ? 'FOREST_CLEARANCE' : 'UTILITY_SHIFTING')
        : (baseDelay > 30 ? 'CONTRACTOR_ISSUE' : 'NONE');

      const remarksList = SAMPLE_REMARKS_BY_REASON[delayReasonCat] || SAMPLE_REMARKS_BY_REASON.NONE;
      const projectMonthlyItems = [];

      for (let mIdx = 0; mIdx < MONTH_CYCLES.length; mIdx++) {
        const cycle = MONTH_CYCLES[mIdx];
        const monthFactor = cycle.factor;

        const physProgress = Math.min(100, Math.max(0, Math.round(curPhys * monthFactor * 10) / 10));
        const finProgress = Math.min(100, Math.max(0, Math.round(curFin * monthFactor * 10) / 10));
        const plannedPhys = Math.min(100, Math.max(0, Math.round((physProgress + 5 + (mIdx * 1.2)) * 10) / 10));
        const plannedFin = Math.min(100, Math.max(0, Math.round((finProgress + 4) * 10) / 10));
        const monthExp = Math.round(curExp * monthFactor * 100) / 100;
        const delay = Math.round(baseDelay * (0.6 + (mIdx * 0.07)));

        const remarksText = remarksList[mIdx % remarksList.length];

        const [rYear, rMonthNum] = cycle.month.split('-').map(Number);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = `${monthNames[rMonthNum - 1]} ${rYear}`;

        const reportData = {
          projectId: proj._id,
          reportingMonth: cycle.month,
          plannedPhysicalProgress: plannedPhys,
          actualPhysicalProgress: physProgress,
          plannedFinancialProgress: plannedFin,
          actualFinancialProgress: finProgress,
          expenditure: monthExp,
          delayDays: delay,
          delayReasonText: remarksText,
          autoDetectedDelayReason: delayReasonCat,
          delayConfidence: delayReasonCat === 'NONE' ? 0.95 : 0.88,
          matchedKeywords: delayReasonCat === 'NONE' ? ['progress', 'cpm'] : ['clearance', 'statutory', 'land'],
          mismatchDetected: Math.abs(finProgress - physProgress) > 10,
          mismatchDifference: Math.round(Math.abs(finProgress - physProgress) * 10) / 10,
          mismatchSeverity: Math.abs(finProgress - physProgress) > 20 ? 'HIGH' : Math.abs(finProgress - physProgress) > 10 ? 'MEDIUM' : 'LOW',
          calculatedRiskScore: proj.riskScore || (delayReasonCat === 'NONE' ? 18 : 65),
          calculatedRiskLevel: proj.riskLevel || (delayReasonCat === 'NONE' ? 'LOW' : 'HIGH'),
          remarks: `Official Flash Return cycle ${cycle.month}. ${remarksText}`,
          submittedBy: repOfficer._id,
          submittedAt: new Date(cycle.day),
          attachments: []
        };

        bulkOps.push({
          updateOne: {
            filter: { projectId: proj._id, reportingMonth: cycle.month },
            update: { $set: reportData },
            upsert: true
          }
        });

        projectMonthlyItems.push({
          reportingMonth: cycle.month,
          year: rYear,
          month: rMonthNum,
          monthName,
          expenditure: monthExp,
          cumulativeExpenditure: monthExp,
          actualPhysicalProgress: physProgress,
          actualFinancialProgress: finProgress,
          plannedPhysicalProgress: plannedPhys,
          plannedFinancialProgress: plannedFin,
          delayMonths: Math.round(delay / 30),
          delayDays: delay,
          delayReasonText: remarksText,
          remarks: reportData.remarks
        });

        countNewReports++;
      }

      // Update project document embedded monthly data and latest stats from August 2026
      const augItem = projectMonthlyItems[projectMonthlyItems.length - 1];
      projectUpdates.push({
        updateOne: {
          filter: { _id: proj._id },
          update: {
            $set: {
              monthlyReports: projectMonthlyItems,
              reportingMonths: MONTH_CYCLES.map(c => c.month),
              totalReportsCount: projectMonthlyItems.length,
              latestReportDate: new Date('2026-08-31'),
              expenditure: augItem.expenditure,
              totalActualExpenditure: augItem.expenditure,
              physicalProgress: augItem.actualPhysicalProgress,
              financialProgress: augItem.actualFinancialProgress
            }
          }
        }
      });
    }

    console.log(`⚡ Executing ${bulkOps.length} upsert operations for 8-month telemetry history (including August 2026)...`);
    
    // Batch MonthlyReport in chunks of 5000
    const chunkSize = 5000;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
      const chunk = bulkOps.slice(i, i + chunkSize);
      await MonthlyReport.bulkWrite(chunk);
      console.log(`   Processed ${Math.min(i + chunkSize, bulkOps.length)} / ${bulkOps.length} monthly reports...`);
    }

    console.log(`⚡ Updating ${projectUpdates.length} Project documents with synchronized August 2026 data...`);
    for (let i = 0; i < projectUpdates.length; i += chunkSize) {
      const chunk = projectUpdates.slice(i, i + chunkSize);
      await Project.bulkWrite(chunk);
      console.log(`   Updated ${Math.min(i + chunkSize, projectUpdates.length)} / ${projectUpdates.length} projects...`);
    }

    const totalReportsNow = await MonthlyReport.countDocuments();
    const augReportsCount = await MonthlyReport.countDocuments({ reportingMonth: '2026-08' });
    console.log(`\n✅ Finished populating August 2026 reporting data!`);
    console.log(`📊 Total Monthly Reports in DB: ${totalReportsNow}`);
    console.log(`📅 August 2026 Reports in DB: ${augReportsCount}`);
    console.log(`👤 Linked to Reporting Officer: ${repOfficer.fullName || repOfficer.name} (${repOfficer.email})`);

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error populating reports:', err);
    process.exit(1);
  }
}

populateReports();

