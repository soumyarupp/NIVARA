import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://soumyarupsamanta50_db_user:TM2HURrCNocmSbtl@cluster0.1q2twzo.mongodb.net/nivara_data';

async function exportDatabaseData() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully to MongoDB!');

  const db = mongoose.connection.db;

  console.log('Fetching projects and agencies...');
  const agencies = await db.collection('implementationagencies').find({}).toArray();
  const agencyMap = new Map();
  agencies.forEach(a => {
    agencyMap.set(String(a._id), a.agencyCode || a.name || 'NHAI');
  });

  const ministries = await db.collection('ministries').find({}).toArray();
  const ministryMap = new Map();
  ministries.forEach(m => {
    ministryMap.set(String(m._id), m.ministryName || m.code || 'MoRTH');
  });

  const landDocs = await db.collection('landdetails').find({}).toArray();
  const landMap = new Map();
  landDocs.forEach(l => {
    const pId = String(l.projectId);
    const target = Number(l.totalLandRequiredInHectares || l.totalRequired || 1);
    const acquired = Number(l.totalLandAcquiredInHectares || l.acquired || 0);
    const pct = target > 0 ? Math.min(100, (acquired / target) * 100) : 100;
    landMap.set(pId, pct);
  });

  const projects = await db.collection('projects').find({}).toArray();
  console.log(`Found ${projects.length} projects in database.`);

  const projectMap = new Map();
  projects.forEach(p => {
    projectMap.set(String(p._id), p);
    if (p.projectCode) {
      projectMap.set(String(p.projectCode), p);
    }
  });

  console.log('Fetching all monthly reports...');
  const monthlyReports = await db.collection('monthlyreports').find({}).sort({ reportingMonth: 1 }).toArray();
  console.log(`Found ${monthlyReports.length} monthly reports.`);

  const csvRows = [];
  const nlpRows = [];

  const headers = [
    'project_id',
    'project_name',
    'state',
    'sector',
    'agency',
    'project_status',
    'start_date',
    'original_completion_date',
    'revised_completion_date',
    'actual_completion_date',
    'report_date',
    'original_cost',
    'revised_cost',
    'cumulative_expenditure',
    'monthly_expenditure',
    'actual_final_expenditure',
    'physical_progress',
    'financial_progress',
    'planned_physical_progress',
    'planned_financial_progress',
    'delay_months',
    'delay_days',
    'land_acquisition_pct',
    'delay_reason'
  ];

  csvRows.push(headers.join(','));

  const nlpHeaders = ['text', 'category'];
  nlpRows.push(nlpHeaders.join(','));

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    return `"${str}"`;
  };

  for (const r of monthlyReports) {
    const pId = String(r.projectId);
    const p = projectMap.get(pId) || {};

    const agencyIdStr = String(p.implementationAgencyId || '');
    const agencyName = agencyMap.get(agencyIdStr) || p.agency || 'NHAI';

    const origCost = Number(p.originalProjectCost || p.sanctionedCost || p.totalCapitalOutlay || 0);
    const revCost = Number(p.revisedProjectCost || p.revisedCost || origCost || 0);
    const cumExp = Number(r.cumulativeExpenditure || r.expenditure || 0);
    const monthlyExp = Number(r.expenditure || 0);

    const isCompleted = p.status === 'COMPLETED' || p.projectStatus === 'COMPLETED' || Number(p.physicalProgress || 0) >= 100;
    const actualCompDate = isCompleted ? (p.actualCompletionDate || p.revisedCompletionDate || p.originalCompletionDate || '') : '';
    const finalExp = isCompleted ? Number(p.totalActualExpenditure || p.expenditure || cumExp || revCost) : '';

    const physProg = Number(r.actualPhysicalProgress ?? r.physicalProgress ?? 0);
    const finProg = Number(r.actualFinancialProgress ?? r.financialProgress ?? 0);
    const plannedPhys = Number(r.plannedPhysicalProgress ?? 0);
    const plannedFin = Number(r.plannedFinancialProgress ?? 0);

    const delayD = Number(r.delayDays || 0);
    const delayM = Number(r.delayMonths ?? (delayD ? Math.round(delayD / 30.4) : 0));

    const landPct = landMap.get(pId) ?? 100;
    const delayText = r.delayReasonText || r.remarks || p.delayReason || '';

    // Report date formatting (e.g. 2026-04 -> 2026-04-15)
    let reportDateStr = r.reportingMonth ? `${r.reportingMonth}-15` : '';
    if (r.submittedAt) {
      reportDateStr = new Date(r.submittedAt).toISOString().slice(0, 10);
    }

    const row = [
      escapeCsv(p.projectCode || p._id || pId),
      escapeCsv(p.projectName || 'Project'),
      escapeCsv(p.state || 'National'),
      escapeCsv(p.sector || 'Infrastructure'),
      escapeCsv(agencyName),
      escapeCsv(p.status || p.projectStatus || 'Ongoing'),
      escapeCsv(p.projectStartDate ? new Date(p.projectStartDate).toISOString().slice(0, 10) : ''),
      escapeCsv(p.originalCompletionDate ? new Date(p.originalCompletionDate).toISOString().slice(0, 10) : ''),
      escapeCsv(p.revisedCompletionDate ? new Date(p.revisedCompletionDate).toISOString().slice(0, 10) : ''),
      escapeCsv(actualCompDate ? new Date(actualCompDate).toISOString().slice(0, 10) : ''),
      escapeCsv(reportDateStr),
      origCost,
      revCost,
      cumExp,
      monthlyExp,
      finalExp,
      physProg,
      finProg,
      plannedPhys,
      plannedFin,
      delayM,
      delayD,
      landPct,
      escapeCsv(delayText)
    ];

    csvRows.push(row.join(','));

    if (delayText && delayText.trim().length > 10) {
      const cat = r.autoDetectedDelayReason || 'CONTRACTOR_DELAY';
      nlpRows.push([escapeCsv(delayText), escapeCsv(cat)].join(','));
    }
  }

  // Also include project-level snapshots if no reports exist for some projects
  const coveredProjectIds = new Set(monthlyReports.map(r => String(r.projectId)));
  for (const p of projects) {
    const pId = String(p._id);
    if (!coveredProjectIds.has(pId)) {
      const agencyIdStr = String(p.implementationAgencyId || '');
      const agencyName = agencyMap.get(agencyIdStr) || p.agency || 'NHAI';
      const origCost = Number(p.originalProjectCost || p.sanctionedCost || p.totalCapitalOutlay || 0);
      const revCost = Number(p.revisedProjectCost || p.revisedCost || origCost || 0);
      const cumExp = Number(p.totalActualExpenditure || p.expenditure || 0);
      const isCompleted = p.status === 'COMPLETED' || p.projectStatus === 'COMPLETED' || Number(p.physicalProgress || 0) >= 100;
      const actualCompDate = isCompleted ? (p.actualCompletionDate || p.revisedCompletionDate || p.originalCompletionDate || '') : '';
      const finalExp = isCompleted ? Number(p.totalActualExpenditure || cumExp || revCost) : '';

      const physProg = Number(p.physicalProgress || 0);
      const finProg = Number(p.financialProgress || 0);
      const delayD = Number(p.delayDays || 0);
      const delayM = Number(p.delayMonths ?? (delayD ? Math.round(delayD / 30.4) : 0));
      const landPct = landMap.get(pId) ?? 100;
      const delayText = p.delayReason || '';

      const row = [
        escapeCsv(p.projectCode || p._id || pId),
        escapeCsv(p.projectName || 'Project'),
        escapeCsv(p.state || 'National'),
        escapeCsv(p.sector || 'Infrastructure'),
        escapeCsv(agencyName),
        escapeCsv(p.status || p.projectStatus || 'Ongoing'),
        escapeCsv(p.projectStartDate ? new Date(p.projectStartDate).toISOString().slice(0, 10) : ''),
        escapeCsv(p.originalCompletionDate ? new Date(p.originalCompletionDate).toISOString().slice(0, 10) : ''),
        escapeCsv(p.revisedCompletionDate ? new Date(p.revisedCompletionDate).toISOString().slice(0, 10) : ''),
        escapeCsv(actualCompDate ? new Date(actualCompDate).toISOString().slice(0, 10) : ''),
        escapeCsv(new Date().toISOString().slice(0, 10)),
        origCost,
        revCost,
        cumExp,
        0,
        finalExp,
        physProg,
        finProg,
        Number(p.plannedPhysicalProgress || physProg),
        Number(p.plannedFinancialProgress || finProg),
        delayM,
        delayD,
        landPct,
        escapeCsv(delayText)
      ];
      csvRows.push(row.join(','));
    }
  }

  const outputCsvPath = path.resolve(__dirname, '../../ai_model/data/processed/processed_monthly_data.csv');
  const outputNlpCsvPath = path.resolve(__dirname, '../../ai_model/data/processed/delay_nlp_data.csv');

  fs.mkdirSync(path.dirname(outputCsvPath), { recursive: true });
  fs.writeFileSync(outputCsvPath, csvRows.join('\n'), 'utf8');
  console.log(`Saved ${csvRows.length - 1} snapshot rows to ${outputCsvPath}`);

  fs.writeFileSync(outputNlpCsvPath, nlpRows.join('\n'), 'utf8');
  console.log(`Saved ${nlpRows.length - 1} NLP delay texts to ${outputNlpCsvPath}`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed. Ready for training!');
}

exportDatabaseData().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
