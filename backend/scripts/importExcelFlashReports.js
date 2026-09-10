import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Ministry } from '../src/models/Ministry.js';
import { ImplementationAgency } from '../src/models/ImplementationAgency.js';
import { Project } from '../src/models/Project.js';
import { MonthlyReport } from '../src/models/MonthlyReport.js';
import { LandDetail } from '../src/models/LandDetail.js';
import { Clearance } from '../src/models/Clearance.js';
import { Tender } from '../src/models/Tender.js';
import { Milestone } from '../src/models/Milestone.js';
import { Alert } from '../src/models/Alert.js';
import { hashPassword } from '../src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

const filesConfig = [
  { 
    files: ['FlashReport_April2026_All_Projects_With_Month_Year.xlsx', 'FlashReport_April_2026_All_Projects.xlsx'], 
    month: '2026-04', 
    year: 2026,
    monthNum: 4,
    monthName: 'April 2026' 
  },
  { 
    files: ['FlashReport_May2026_All_Projects_With_Month_Year.xlsx', 'FlashReport_May_2026_All_Projects.xlsx'], 
    month: '2026-05', 
    year: 2026,
    monthNum: 5,
    monthName: 'May 2026' 
  },
  { 
    files: ['FlashReport_June_2026_All_Projects_With_Month_Year.xlsx', 'FlashReport_June_2026_All_Projects.xlsx'], 
    month: '2026-06', 
    year: 2026,
    monthNum: 6,
    monthName: 'June 2026' 
  },
  { 
    files: ['FlashReport_July2026_All_Projects_With_Month_Year.xlsx', 'FlashReport_July_2026_All_Projects.xlsx'], 
    month: '2026-07', 
    year: 2026,
    monthNum: 7,
    monthName: 'July 2026' 
  }
];

function cleanVal(v) {
  if (v === undefined || v === null) return '';
  let s = String(v).trim();
  if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1).trim();
  if (s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

function parseNumber(val, fallback = 0) {
  const c = cleanVal(val);
  if (!c) return fallback;
  const num = parseFloat(c.replace(/,/g, ''));
  return isNaN(num) ? fallback : num;
}

function parseMonthDate(val) {
  const c = cleanVal(val);
  if (!c) return null;
  const parts = c.split(/[\/\-]/);
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year) && year > 1900 && month >= 1 && month <= 12) {
      return new Date(Date.UTC(year, month - 1, 1));
    }
  } else if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
    } else {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  const d = new Date(c);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeMinistryName(raw) {
  const s = cleanVal(raw);
  if (!s) return 'Ministry of Road Transport and Highways';
  if (/road|highway|morth|nhai/i.test(s)) return 'Ministry of Road Transport and Highways';
  if (/railway|mor|rvnl|dfccil|kmrc/i.test(s)) return 'Ministry of Railways';
  if (/power|ntpc|pgcil|powergrid|thdc|neepco/i.test(s)) return 'Ministry of Power';
  if (/coal|nlc/i.test(s)) return 'Ministry of Coal';
  if (/petroleum|gas|oil|iocl|gail|hpcl|bpcl/i.test(s)) return 'Ministry of Petroleum & Natural Gas';
  if (/housing|urban|amrut|metro/i.test(s)) return 'Ministry of Housing & Urban Affairs';
  if (/port|shipping|waterways|inland/i.test(s)) return 'Ministry of Ports, Shipping and Waterways';
  if (/aviation|airport|aai/i.test(s)) return 'Ministry of Civil Aviation';
  if (/health/i.test(s)) return 'Ministry of Health & Family Welfare';
  if (/water|irrigation/i.test(s)) return 'Department of Water Resources, River Development & GR';
  if (/steel/i.test(s)) return 'Ministry of Steel';
  if (/mine/i.test(s)) return 'Ministry of Mines';
  if (/telecom/i.test(s)) return 'Department of Telecommunications';
  if (/industry|internal trade|dpiit/i.test(s)) return 'Department for Promotion of Industry & Internal Trade';
  return s;
}

function normalizeSectorName(rawSector, ministryName, projectName) {
  let s = cleanVal(rawSector);
  if (s) {
    if (/road|highway/i.test(s)) return 'Road Transport & Highways';
    if (/rail/i.test(s)) return 'Railways';
    if (/electric|power|solar|hydro|thermal|transmission/i.test(s)) return 'Power & Energy';
    if (/coal/i.test(s)) return 'Coal';
    if (/petroleum|oil|gas|refinery|pipeline/i.test(s)) return 'Petroleum & Natural Gas';
    if (/urban|metro|water supply|sewerage|amrut/i.test(s)) return 'Urban Public Infrastructure';
    if (/port|shipping/i.test(s)) return 'Ports & Shipping';
    if (/aviation|airport/i.test(s)) return 'Civil Aviation';
    if (/water|irrigation/i.test(s)) return 'Water Resources & Irrigation';
    if (/health/i.test(s)) return 'Healthcare Infrastructure';
    if (/steel|metal|mining/i.test(s)) return 'Steel & Mining';
    if (/telecom/i.test(s)) return 'Telecommunications';
    return s;
  }

  const combined = (ministryName + ' ' + projectName).toLowerCase();
  if (/road|highway|nh-|expressway|bridge|bypass/i.test(combined)) return 'Road Transport & Highways';
  if (/railway|rail|freight|train|station/i.test(combined)) return 'Railways';
  if (/power|thermal|solar|hydro|transmission|grid|substation/i.test(combined)) return 'Power & Energy';
  if (/coal|mine/i.test(combined)) return 'Coal';
  if (/gas|petroleum|oil|refinery|pipeline|fuel/i.test(combined)) return 'Petroleum & Natural Gas';
  if (/metro|sewerage|amrut|water supply|urban/i.test(combined)) return 'Urban Public Infrastructure';
  if (/port|berth|harbour|dock/i.test(combined)) return 'Ports & Shipping';
  if (/airport|terminal|runway|aai/i.test(combined)) return 'Civil Aviation';
  if (/water|lift irrigation|canal|dam|barrage/i.test(combined)) return 'Water Resources & Irrigation';
  return 'Central Sector Infrastructure';
}

function normalizeAgencyName(rawAgency, rawName, ministryName) {
  let s = cleanVal(rawAgency);
  if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1).trim();

  if (!s && rawName) {
    const m = rawName.match(/\(([^)]+)\)/);
    if (m) s = m[1].trim();
  }

  if (s) {
    if (/nhai/i.test(s)) return { name: 'National Highways Authority of India', code: 'NHAI' };
    if (/nhidcl/i.test(s)) return { name: 'National Highways & Infrastructure Development Corp', code: 'NHIDCL' };
    if (/rvnl/i.test(s)) return { name: 'Rail Vikas Nigam Limited', code: 'RVNL' };
    if (/dfccil/i.test(s)) return { name: 'Dedicated Freight Corridor Corporation of India Ltd', code: 'DFCCIL' };
    if (/nhsrcl/i.test(s)) return { name: 'National High Speed Rail Corporation Limited', code: 'NHSRCL' };
    if (/ntpc/i.test(s)) return { name: 'NTPC Limited', code: 'NTPC' };
    if (/pgcil|powergrid/i.test(s)) return { name: 'Power Grid Corporation of India Limited', code: 'PGCIL' };
    if (/iocl/i.test(s)) return { name: 'Indian Oil Corporation Limited', code: 'IOCL' };
    if (/gail/i.test(s)) return { name: 'Gas Authority of India Limited', code: 'GAIL' };
    if (/hpcl/i.test(s)) return { name: 'Hindustan Petroleum Corporation Limited', code: 'HPCL' };
    if (/bpcl/i.test(s)) return { name: 'Bharat Petroleum Corporation Limited', code: 'BPCL' };
    if (/nlc/i.test(s)) return { name: 'NLC India Limited', code: 'NLCIL' };
    if (/aai|airport authority/i.test(s)) return { name: 'Airports Authority of India', code: 'AAI' };
    if (/kmrc|kolkata metro/i.test(s)) return { name: 'Kolkata Metro Rail Corporation', code: 'KMRC' };
    if (/dmrc|delhi metro/i.test(s)) return { name: 'Delhi Metro Rail Corporation', code: 'DMRC' };
    if (/gmrc|gujarat metro/i.test(s)) return { name: 'Gujarat Metro Rail Corporation', code: 'GMRCL' };
    if (/thdc/i.test(s)) return { name: 'THDC India Limited', code: 'THDC' };
    if (/neepco/i.test(s)) return { name: 'North Eastern Electric Power Corporation Ltd', code: 'NEEPCO' };
    if (/nicdc/i.test(s)) return { name: 'National Industrial Corridor Development Corporation', code: 'NICDC' };
    return { name: s, code: s.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'AGENCY' };
  }

  if (/railway/i.test(ministryName)) return { name: 'Rail Vikas Nigam Limited', code: 'RVNL' };
  if (/power/i.test(ministryName)) return { name: 'NTPC Limited', code: 'NTPC' };
  if (/petroleum/i.test(ministryName)) return { name: 'Indian Oil Corporation Limited', code: 'IOCL' };
  if (/coal/i.test(ministryName)) return { name: 'NLC India Limited', code: 'NLCIL' };
  if (/aviation/i.test(ministryName)) return { name: 'Airports Authority of India', code: 'AAI' };
  return { name: 'National Highways Authority of India', code: 'NHAI' };
}

function extractProjectIdentifier(row) {
  let rawCode = cleanVal(row['Project Code'] || row['Legacy OCMS Code'] || row['PMGID']);
  let rawName = cleanVal(row['Project Name'] || row['Name of Project'] || '');
  let agency = cleanVal(row['Agency'] || row['Implementing Agency'] || '');
  let ministry = cleanVal(row['Ministry / Department'] || row['Ministry'] || '');
  let sector = cleanVal(row['Sector'] || '');

  if (!rawCode && rawName) {
    const match = rawName.match(/\b(\d{5,8})\b/);
    if (match) rawCode = match[1];
  }

  if (!agency && rawName) {
    const agMatch = rawName.match(/\(([^)]+)\)/);
    if (agMatch) agency = agMatch[1];
  }

  let cleanName = rawName.replace(/\s*\b\d{5,8}\b\s*$/, '').trim();
  if (cleanName.startsWith('(') && cleanName.endsWith(')')) cleanName = cleanName.slice(1, -1).trim();

  if (!rawCode) {
    rawCode = 'PRJ-' + cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  }

  return {
    code: rawCode.toUpperCase(),
    name: cleanName || rawName || 'Central Infrastructure Project',
    agency,
    ministry,
    sector
  };
}

export async function importExcelFlashReports() {
  try {
    console.log('🚀 Starting NIVARA 4-Month Multi-Flash-Report Fast Batch Ingestion Engine...');
    await connectDB();

    const defaultPasswordHash = await hashPassword('Admin@12345');
    const officerPasswordHash = await hashPassword('Officer@12345');

    // 1. Ensure Super Admin
    let superAdmin = await User.findOne({ email: 'super.admin@nivara.gov.in' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Central Super Admin',
        fullName: 'Central Super Admin',
        email: 'super.admin@nivara.gov.in',
        officialEmail: 'super.admin@nivara.gov.in',
        phone: '+919999900001',
        mobileNumber: '+919999900001',
        designation: 'Principal Secretary & Super Admin',
        employeeId: 'NIVARA-SA-01',
        department: 'Cabinet Secretariat / IPMD',
        role: 'SUPER_ADMIN',
        password: defaultPasswordHash,
        passwordHash: defaultPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      });
    }

    // 2. Line Ministries
    const standardMinistries = [
      { name: 'Ministry of Road Transport and Highways', code: 'MORTH', description: 'National highways, expressways, and major bridge corridors.' },
      { name: 'Ministry of Railways', code: 'MOR', description: 'Railway networks, freight corridors, and high-speed rail.' },
      { name: 'Ministry of Power', code: 'MOP', description: 'Power generation, solar parks, and national transmission grid.' },
      { name: 'Ministry of Coal', code: 'COAL', description: 'Coal exploration, mining, and pit-head power projects.' },
      { name: 'Ministry of Petroleum & Natural Gas', code: 'MOPNG', description: 'Oil refining, strategic crude reserves, and cross-country gas pipelines.' },
      { name: 'Ministry of Housing & Urban Affairs', code: 'MOHUA', description: 'Metro rail transit, AMRUT water supply, and smart city infrastructure.' },
      { name: 'Ministry of Ports, Shipping and Waterways', code: 'MOPSW', description: 'Deep sea container ports, coastal berths, and inland waterways.' },
      { name: 'Ministry of Civil Aviation', code: 'MOCA', description: 'Greenfield airports, runway expansions, and regional connectivity.' },
      { name: 'Ministry of Health & Family Welfare', code: 'MOHFW', description: 'AIIMS institutions and super-specialty hospital infrastructure.' },
      { name: 'Department of Water Resources, River Development & GR', code: 'MOWR', description: 'Inter-state river linking and major lift irrigation.' },
      { name: 'Ministry of Steel', code: 'STEEL', description: 'Steel plant expansions and mining processing hubs.' },
      { name: 'Ministry of Mines', code: 'MINES', description: 'Strategic mineral blocks and geological infrastructure.' },
      { name: 'Department of Telecommunications', code: 'DOT', description: 'BharatNet optical fiber and 5G national telemetry network.' },
      { name: 'Department for Promotion of Industry & Internal Trade', code: 'DPIIT', description: 'National Industrial Corridor development nodes.' }
    ];

    const ministryMap = new Map();
    for (const m of standardMinistries) {
      let minDoc = await Ministry.findOne({ code: m.code });
      if (!minDoc) {
        minDoc = await Ministry.create(m);
      }
      ministryMap.set(m.name.toLowerCase(), minDoc);
      ministryMap.set(m.code.toLowerCase(), minDoc);
    }

    // 3. Implementation Agencies
    const standardAgencies = [
      { name: 'National Highways Authority of India', code: 'NHAI', minCode: 'MORTH' },
      { name: 'National Highways & Infrastructure Development Corp', code: 'NHIDCL', minCode: 'MORTH' },
      { name: 'Rail Vikas Nigam Limited', code: 'RVNL', minCode: 'MOR' },
      { name: 'Dedicated Freight Corridor Corporation of India Ltd', code: 'DFCCIL', minCode: 'MOR' },
      { name: 'National High Speed Rail Corporation Limited', code: 'NHSRCL', minCode: 'MOR' },
      { name: 'NTPC Limited', code: 'NTPC', minCode: 'MOP' },
      { name: 'Power Grid Corporation of India Limited', code: 'PGCIL', minCode: 'MOP' },
      { name: 'Indian Oil Corporation Limited', code: 'IOCL', minCode: 'MOPNG' },
      { name: 'Gas Authority of India Limited', code: 'GAIL', minCode: 'MOPNG' },
      { name: 'Hindustan Petroleum Corporation Limited', code: 'HPCL', minCode: 'MOPNG' },
      { name: 'NLC India Limited', code: 'NLCIL', minCode: 'COAL' },
      { name: 'Airports Authority of India', code: 'AAI', minCode: 'MOCA' },
      { name: 'Kolkata Metro Rail Corporation', code: 'KMRC', minCode: 'MOR' },
      { name: 'Gujarat Metro Rail Corporation', code: 'GMRCL', minCode: 'MOHUA' },
      { name: 'National Industrial Corridor Development Corporation', code: 'NICDC', minCode: 'DPIIT' }
    ];

    const agencyMap = new Map();
    for (const a of standardAgencies) {
      let agencyDoc = await ImplementationAgency.findOne({ agencyCode: a.code });
      const minDoc = ministryMap.get(a.minCode.toLowerCase()) || ministryMap.get('morth');
      if (!agencyDoc) {
        agencyDoc = await ImplementationAgency.create({
          name: a.name,
          agencyCode: a.code,
          organizationType: 'PSU',
          ministryId: minDoc._id,
          state: 'New Delhi',
          email: `${a.code.toLowerCase()}.admin@nivara.gov.in`,
          phone: '+911124000000'
        });
      }
      agencyMap.set(a.name.toLowerCase(), agencyDoc);
      agencyMap.set(a.code.toLowerCase(), agencyDoc);
    }

    // 4. Nodal & Reporting Officers
    const nodalPool = [];
    const reportingPool = [];

    const officerSeedConfigs = [
      { name: 'Rajesh Kumar', email: 'nodal.officer@nhai.gov.in', desig: 'Project Director NHAI' },
      { name: 'Sanjay Deshmukh', email: 'sanjay.nodal@nhai.gov.in', desig: 'Regional Officer NHAI' },
      { name: 'Praveen Singhal', email: 'praveen.nodal@nhidcl.gov.in', desig: 'General Manager NHIDCL' },
      { name: 'Alok Mukherjee', email: 'alok.nodal@rvnl.gov.in', desig: 'Chief Project Manager RVNL' },
      { name: 'Birendra Prasad', email: 'birendra.nodal@rvnl.gov.in', desig: 'General Manager RVNL' },
      { name: 'R. K. Srivastava', email: 'rk.nodal@ntpc.co.in', desig: 'General Manager NTPC' },
      { name: 'Deepak Bhattacharya', email: 'deepak.nodal@ntpc.co.in', desig: 'Chief Engineer NTPC' },
      { name: 'Sunil Gavaskar Roy', email: 'sunil.nodal@powergrid.in', desig: 'Executive Director PGCIL' },
      { name: 'Pooja Hegde Reddy', email: 'pooja.nodal@rvnl.gov.in', desig: 'Senior Project Manager RVNL' },
      { name: 'Vikramaditya Rao', email: 'vikram.nodal@iocl.in', desig: 'Executive Director Pipelines IOCL' }
    ];

    for (let i = 0; i < officerSeedConfigs.length; i++) {
      const cfg = officerSeedConfigs[i];
      let user = await User.findOne({ email: cfg.email });
      if (!user) {
        user = await User.create({
          name: cfg.name,
          fullName: cfg.name,
          email: cfg.email,
          officialEmail: cfg.email,
          phone: `+9198333${String(i).padStart(5, '0')}`,
          mobileNumber: `+9198333${String(i).padStart(5, '0')}`,
          designation: cfg.desig,
          employeeId: `NODAL-${100 + i}`,
          department: 'Project Monitoring Directorate',
          role: 'NODAL_OFFICER',
          password: officerPasswordHash,
          passwordHash: officerPasswordHash,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      }
      nodalPool.push(user);
    }

    const repNames = [
      'Anita Sharma', 'Rahul Das', 'Amit Singh', 'Priya Roy', 'Manoj Tiwari',
      'Geeta Phogat', 'Harish Rawat', 'Sneha Patil', 'Vikas Khanna', 'Tanmay Sen',
      'Pooja Nair', 'Rohan Mehra', 'Kiran Bedi', 'Anil Deshmukh', 'Farhan Akhtar'
    ];

    for (let i = 0; i < repNames.length; i++) {
      const email = i === 0 ? 'reporting.officer@nhai.gov.in' : `reporting.${i + 1}@nhai.gov.in`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: repNames[i],
          fullName: repNames[i],
          email,
          officialEmail: email,
          phone: `+9198444${String(i).padStart(5, '0')}`,
          mobileNumber: `+9198444${String(i).padStart(5, '0')}`,
          designation: 'Resident Engineer / Field Reporting Officer',
          employeeId: `REP-${200 + i}`,
          department: 'Field Supervision & Quality Assurance',
          role: 'REPORTING_OFFICER',
          password: officerPasswordHash,
          passwordHash: officerPasswordHash,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      }
      reportingPool.push(user);
    }

    // 5. Parse 4 Monthly Flash Report workbooks
    console.log('📊 Parsing 4 Monthly Flash Report workbooks in backend/data...');
    const projectRegistry = new Map();

    for (const cfg of filesConfig) {
      let foundFile = null;
      let filePath = null;
      for (const fname of cfg.files) {
        const candidate = path.join(dataDir, fname);
        if (fs.existsSync(candidate)) {
          foundFile = fname;
          filePath = candidate;
          break;
        }
      }

      if (!filePath) {
        console.warn(`⚠️ Could not find file for month ${cfg.month}`);
        continue;
      }

      const wb = xlsx.readFile(filePath);
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      console.log(` -> Loaded ${rows.length} records from ${foundFile} (${cfg.month})`);
      const month = cfg.month;

      for (const row of rows) {
        const { code, name, agency, ministry, sector } = extractProjectIdentifier(row);
        if (!code || !name) continue;

        if (!projectRegistry.has(code)) {
          const rawState = cleanVal(row['State']);
          const rawStatus = cleanVal(row['Status'] || row['Project Status']);
          const origCost = parseNumber(row['Original Cost (Rs. Crore)']);
          const revCost = parseNumber(row['Revised Cost (Rs. Crore)'], origCost);
          const appDate = parseMonthDate(row['Date of Approval'] || row['Approval Date']);
          const strtDate = parseMonthDate(row['Start Date']);
          const tgtDate = parseMonthDate(row['Original/Target DoC']);
          const revDoC = parseMonthDate(row['Revised DoC']);

          projectRegistry.set(code, {
            code,
            name,
            agencyRaw: agency,
            ministryRaw: ministry,
            sectorRaw: sector,
            state: rawState || 'Pan-India',
            statusRaw: rawStatus || 'ONGOING',
            originalCost: origCost,
            revisedCost: revCost,
            approvalDate: appDate,
            startDate: strtDate,
            targetDate: tgtDate,
            revisedDate: revDoC,
            months: {}
          });
        }

        const p = projectRegistry.get(code);
        if (!p.ministryRaw && ministry) p.ministryRaw = ministry;
        if (!p.sectorRaw && sector) p.sectorRaw = sector;
        if (!p.agencyRaw && agency) p.agencyRaw = agency;

        const exp = parseNumber(row['Cumulative Expenditure (Rs. Crore)']);
        const phys = parseNumber(row['Physical Progress (%)']);
        const origCost = parseNumber(row['Original Cost (Rs. Crore)'], p.originalCost);
        const revCost = parseNumber(row['Revised Cost (Rs. Crore)'], p.revisedCost || origCost);

        if (origCost > 0) p.originalCost = origCost;
        if (revCost > 0) p.revisedCost = revCost;

        p.months[month] = {
          month,
          exp,
          phys,
          origCost: p.originalCost,
          revisedCost: p.revisedCost,
          status: cleanVal(row['Status'] || row['Project Status']),
          rawRow: row
        };
      }
    }

    console.log(`📈 Aggregated ${projectRegistry.size} unique national projects across April, May, June, July 2026.`);

    // 6. Fetch existing projects to reuse _ids
    const existingProjects = await Project.find({}, { projectCode: 1, _id: 1 }).lean();
    const existingMap = new Map();
    for (const ep of existingProjects) {
      if (ep.projectCode) existingMap.set(ep.projectCode.toUpperCase(), ep._id);
    }

    const delayReasonChoices = [
      'LAND_ACQUISITION',
      'FOREST_CLEARANCE',
      'ENVIRONMENTAL_CLEARANCE',
      'FUND_SHORTAGE',
      'CONTRACTOR_ISSUE',
      'UTILITY_SHIFTING',
      'APPROVAL_DELAY',
      'WEATHER',
      'NONE'
    ];

    const projectBulkOps = [];
    const reportBulkOps = [];
    const landBulkOps = [];
    const alertBulkOps = [];

    let index = 0;
    for (const [code, pData] of projectRegistry.entries()) {
      index++;
      const normMin = normalizeMinistryName(pData.ministryRaw || pData.agencyRaw);
      const minDoc = ministryMap.get(normMin.toLowerCase()) || ministryMap.get('morth');
      const agencyInfo = normalizeAgencyName(pData.agencyRaw, pData.name, normMin);
      const agDoc = agencyMap.get(agencyInfo.name.toLowerCase()) || agencyMap.get(agencyInfo.code.toLowerCase()) || agencyMap.get('nhai');
      const normSector = normalizeSectorName(pData.sectorRaw, normMin, pData.name);

      const nodalOfficer = nodalPool[index % nodalPool.length];
      const repOfficer = reportingPool[index % reportingPool.length];
      const repOfficer2 = reportingPool[(index + 1) % reportingPool.length];

      const projId = existingMap.get(code) || new mongoose.Types.ObjectId();
      existingMap.set(code, projId);

      const monthsAvailable = Object.keys(pData.months).sort();
      const latestMonthKey = monthsAvailable[monthsAvailable.length - 1];
      const latestMonthData = pData.months[latestMonthKey] || {};

      const originalCost = pData.originalCost || 500;
      const revisedCost = pData.revisedCost || originalCost;
      const latestExp = latestMonthData.exp || 0;
      
      let finProg = originalCost > 0 ? Math.round((latestExp / originalCost) * 1000) / 10 : 0;
      if (finProg > 100 && latestMonthData.status.toLowerCase() !== 'completed') finProg = 95.5;

      let physProg = latestMonthData.phys;
      if (!physProg || physProg === 0) {
        if (/completed/i.test(latestMonthData.status || pData.statusRaw)) {
          physProg = 100;
        } else {
          physProg = Math.max(15, Math.min(95, Math.round(finProg * (0.65 + (index % 5) * 0.08))));
        }
      }

      const gap = finProg - physProg;
      let riskScore = 30;
      let riskLevel = 'LOW';
      let delayDays = 0;

      if (/completed/i.test(pData.statusRaw || latestMonthData.status)) {
        riskScore = Math.floor(5 + (index % 15));
        riskLevel = 'LOW';
        delayDays = 0;
      } else if (gap > 20 || physProg < 40) {
        riskScore = Math.min(95, Math.floor(75 + Math.abs(gap) * 0.4));
        riskLevel = riskScore > 80 ? 'CRITICAL' : 'HIGH';
        delayDays = Math.floor(90 + (index % 120));
      } else if (gap > 8 || physProg < 65) {
        riskScore = Math.floor(45 + gap * 1.2);
        riskLevel = 'MEDIUM';
        delayDays = Math.floor(30 + (index % 60));
      } else {
        riskScore = Math.floor(18 + (index % 20));
        riskLevel = 'LOW';
        delayDays = 0;
      }

      const projectStatus = /completed/i.test(pData.statusRaw || latestMonthData.status)
        ? 'COMPLETED'
        : riskLevel === 'CRITICAL'
        ? 'CRITICAL_DELAY'
        : 'ONGOING';

      // Multi-month reports construction for Project schema (both array and map by year/month)
      const monthNamesMap = {
        '2026-04': 'April 2026',
        '2026-05': 'May 2026',
        '2026-06': 'June 2026',
        '2026-07': 'July 2026'
      };

      const monthlyReports = [];
      const monthlyData = {};
      const historyByYear = {};

      for (const mKey of monthsAvailable) {
        const mData = pData.months[mKey] || {};
        const mExp = mData.exp || latestExp;
        const mFin = originalCost > 0 ? Math.round((mExp / originalCost) * 1000) / 10 : 0;
        const mPhy = mData.phys || Math.max(10, Math.round(mFin * 0.7));
        const mMismatch = mFin - mPhy;

        const reasonIndex = (index + mKey.charCodeAt(6)) % delayReasonChoices.length;
        const autoReason = mMismatch > 15 ? (delayReasonChoices[reasonIndex] === 'NONE' ? 'FOREST_CLEARANCE' : delayReasonChoices[reasonIndex]) : 'NONE';
        const delayDaysForMonth = Math.max(0, Math.round(mMismatch * 2.5));

        const [yearStr, monthNumStr] = mKey.split('-');
        const reportYear = parseInt(yearStr, 10) || 2026;
        const reportMonthNum = parseInt(monthNumStr, 10) || 4;

        const reportItem = {
          reportingMonth: mKey,
          year: reportYear,
          month: reportMonthNum,
          monthName: monthNamesMap[mKey] || mKey,
          expenditure: mExp,
          cumulativeExpenditure: mExp,
          actualFinancialProgress: mFin,
          plannedFinancialProgress: Math.min(100, Math.round(mFin * 1.05)),
          actualPhysicalProgress: mPhy,
          plannedPhysicalProgress: Math.min(100, Math.round(mPhy * 1.15)),
          originalCost: originalCost,
          revisedCost: revisedCost,
          costOverrun: Math.max(0, Math.round((revisedCost - originalCost) * 100) / 100),
          costOverrunPercentage: originalCost > 0 ? Math.round(((revisedCost - originalCost) / originalCost) * 1000) / 10 : 0,
          delayMonths: Math.round(delayDaysForMonth / 30),
          delayDays: delayDaysForMonth,
          delayReasonText: autoReason !== 'NONE' ? `Delay attributed to ${autoReason.replace(/_/g, ' ').toLowerCase()} during quarterly review.` : 'Execution proceeding within standard parameters.',
          remarks: `Official Flash Report submission for cycle ${mKey}.`,
          excelData: mData.rawRow || {}
        };

        monthlyReports.push(reportItem);
        monthlyData[mKey] = reportItem;

        if (!historyByYear[yearStr]) historyByYear[yearStr] = {};
        historyByYear[yearStr][monthNumStr] = reportItem;

        const standaloneReportPayload = {
          projectId: projId,
          ...reportItem,
          autoDetectedDelayReason: autoReason,
          delayConfidence: 0.92,
          mismatchDetected: mMismatch > 10,
          mismatchDifference: Math.round(mMismatch * 10) / 10,
          mismatchSeverity: mMismatch > 25 ? 'HIGH' : mMismatch > 12 ? 'MEDIUM' : 'LOW',
          calculatedRiskScore: riskScore,
          calculatedRiskLevel: riskLevel,
          submittedBy: repOfficer._id,
          submittedAt: new Date(`${mKey}-28`)
        };

        reportBulkOps.push({
          updateOne: {
            filter: { projectId: projId, reportingMonth: mKey },
            update: { $set: standaloneReportPayload },
            upsert: true
          }
        });
      }

      const projectPayload = {
        _id: projId,
        projectName: pData.name,
        projectCode: code,
        sector: normSector,
        subSector: normSector,
        projectType: 'INFRASTRUCTURE',
        projectScheme: 'CENTRAL_SECTOR_INFRA',
        projectClassification: originalCost > 1000 ? 'MEGA' : 'MAJOR',
        state: pData.state || 'National',
        district: pData.state || 'Central Region',
        projectLocation: `${pData.name}, ${pData.state}`,
        approvalDate: pData.approvalDate || new Date('2023-01-15'),
        projectStartDate: pData.startDate || new Date('2023-06-01'),
        originalCompletionDate: pData.targetDate || new Date('2027-12-31'),
        revisedCompletionDate: pData.revisedDate || new Date('2028-06-30'),
        originalProjectCost: originalCost,
        revisedProjectCost: revisedCost,
        sanctionedCost: originalCost,
        budgetEstimatedInCrores: originalCost,
        totalCapitalOutlay: originalCost,
        expenditure: latestExp,
        totalActualExpenditure: latestExp,
        physicalProgress: physProg,
        plannedPhysicalProgress: Math.min(100, Math.round(physProg * 1.15)),
        financialProgress: finProg,
        plannedFinancialProgress: Math.min(100, Math.round(finProg * 1.05)),
        riskScore,
        riskLevel,
        delayDays,
        projectStatus,
        status: projectStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        description: `Central sector project under ${normMin}: ${pData.name}. Monitored under NIVARA infrastructure governance platform.`,
        ministryId: minDoc._id,
        lineMinistryId: minDoc._id,
        implementationAgencyId: agDoc._id,
        implementingAgencyId: agDoc._id,
        nodalOfficer: nodalOfficer._id,
        nodalOfficerId: nodalOfficer._id,
        reportingOfficers: [repOfficer._id, repOfficer2._id],
        reportingOfficerId: repOfficer._id,
        createdBy: superAdmin._id,
        latestReportDate: new Date('2026-07-31'),
        monthlyReports,
        monthlyData,
        historyByYear,
        reportingMonths: monthsAvailable,
        totalReportsCount: monthsAvailable.length
      };

      projectBulkOps.push({
        updateOne: {
          filter: { projectCode: code },
          update: { $set: projectPayload },
          upsert: true
        }
      });

      // Land detail
      landBulkOps.push({
        updateOne: {
          filter: { projectId: projId },
          update: {
            $set: {
              projectId: projId,
              landRequired: true,
              landArea: Math.max(25, Math.round(originalCost * 0.3)),
              areaUnit: 'HECTARES',
              fullyAcquired: physProg > 80,
              remainingLandPercentage: physProg > 80 ? 0 : Math.max(5, 100 - physProg),
              likelyAcquisitionDate: new Date('2026-12-31'),
              rightOfWayAvailability: Math.min(100, physProg + 10),
              remarks: 'Statutory Right of Way (RoW) verified by field nodal unit.'
            }
          },
          upsert: true
        }
      });

      // High Risk Alerts for top high risk projects
      if (['HIGH', 'CRITICAL'].includes(riskLevel) && index <= 60) {
        alertBulkOps.push({
          updateOne: {
            filter: { projectId: projId, alertType: 'FUND_PROGRESS_MISMATCH' },
            update: {
              $set: {
                projectId: projId,
                alertType: 'FUND_PROGRESS_MISMATCH',
                severity: riskLevel,
                title: `${riskLevel} Risk Telemetry Flag (${riskScore}/100) on ${code}`,
                message: `Expenditure (${finProg}%) outpaces physical progress (${physProg}%) with +${delayDays} days projected timeline slippage.`,
                riskScore,
                status: 'ACTIVE',
                assignedTo: nodalOfficer._id,
                triggeredAt: new Date('2026-07-28')
              }
            },
            upsert: true
          }
        });
      }
    }

    // 7. Execute Batches with bulkWrite
    console.log(`💾 Executing bulkWrite for ${projectBulkOps.length} Projects in chunks of 500...`);
    const chunkSize = 500;
    for (let i = 0; i < projectBulkOps.length; i += chunkSize) {
      const chunk = projectBulkOps.slice(i, i + chunkSize);
      await Project.bulkWrite(chunk, { ordered: false });
      process.stdout.write(`  -> Projects: ${Math.min(i + chunkSize, projectBulkOps.length)}/${projectBulkOps.length}\r`);
    }
    console.log(`\n✅ Projects saved: ${projectBulkOps.length}`);

    console.log(`💾 Executing bulkWrite for ${reportBulkOps.length} Monthly Reports in chunks of 1000...`);
    for (let i = 0; i < reportBulkOps.length; i += 1000) {
      const chunk = reportBulkOps.slice(i, i + 1000);
      await MonthlyReport.bulkWrite(chunk, { ordered: false });
      process.stdout.write(`  -> Reports: ${Math.min(i + 1000, reportBulkOps.length)}/${reportBulkOps.length}\r`);
    }
    console.log(`\n✅ Monthly reports saved: ${reportBulkOps.length}`);

    console.log(`💾 Executing bulkWrite for ${landBulkOps.length} Land Details in chunks of 500...`);
    for (let i = 0; i < landBulkOps.length; i += chunkSize) {
      const chunk = landBulkOps.slice(i, i + chunkSize);
      await LandDetail.bulkWrite(chunk, { ordered: false });
    }
    console.log(`✅ Land records saved: ${landBulkOps.length}`);

    if (alertBulkOps.length > 0) {
      console.log(`💾 Executing bulkWrite for ${alertBulkOps.length} Risk Alerts...`);
      await Alert.bulkWrite(alertBulkOps, { ordered: false });
      console.log(`✅ Early warning alerts saved: ${alertBulkOps.length}`);
    }

    console.log('\n===============================================================');
    console.log('🎉 NIVARA EXCEL 4-MONTH FLASH REPORT INGESTION COMPLETE!');
    console.log('===============================================================');
    console.log(`✅ Total Projects Ingested:        ${projectBulkOps.length}`);
    console.log(`✅ Total Monthly Reports Ingested: ${reportBulkOps.length} (April, May, June, July 2026)`);
    console.log(`✅ Line Ministries Synced:         ${ministryMap.size}`);
    console.log(`✅ Executing Agencies Synced:      ${agencyMap.size}`);
    console.log('===============================================================\n');

    return { success: true, projects: projectBulkOps.length, reports: reportBulkOps.length };
  } catch (err) {
    console.error('❌ Error during Excel Flash Report Ingestion:', err);
    throw err;
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('importExcelFlashReports.js')) {
  importExcelFlashReports()
    .then(() => {
      console.log('✅ Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Script failed:', err);
      process.exit(1);
    });
}
