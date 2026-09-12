import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Ministry } from '../src/models/Ministry.js';
import { ImplementationAgency } from '../src/models/ImplementationAgency.js';
import { Organization } from '../src/models/Organization.js';
import { Project } from '../src/models/Project.js';
import { MonthlyReport } from '../src/models/MonthlyReport.js';
import { LandDetail } from '../src/models/LandDetail.js';
import { Clearance } from '../src/models/Clearance.js';
import { Tender } from '../src/models/Tender.js';
import { Milestone } from '../src/models/Milestone.js';
import { Alert } from '../src/models/Alert.js';
import { hashPassword } from '../src/utils/password.js';
import { syncAllMinistriesAndAgenciesCapital } from '../src/services/capitalRecalculation.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

const filesConfig = [
  { 
    files: [
      'FlashReport_January_2026_All_Projects (1) (1).xlsx', 
      'FlashReport_January_2026_All_Projects.xlsx', 
      'FlashReport_January2026_All_Projects.xlsx',
      'FlashReport_Jan_2026_All_Projects.xlsx'
    ],
    monthPattern: /jan/i,
    month: '2026-01', 
    year: 2026,
    monthNum: 1,
    monthName: 'January 2026' 
  },
  { 
    files: [
      'FlashReport_February_2026_All_Projects_Converted.xlsx', 
      'FlashReport_February_2026_All_Projects.xlsx', 
      'FlashReport_February2026_All_Projects.xlsx',
      'FlashReport_Feb_2026_All_Projects.xlsx'
    ],
    monthPattern: /feb/i,
    month: '2026-02', 
    year: 2026,
    monthNum: 2,
    monthName: 'February 2026' 
  },
  { 
    files: [
      'FlashReport_March_2026_All_Projects-1.xlsx', 
      'FlashReport_March_2026_All_Projects.xlsx', 
      'FlashReport_March2026_All_Projects.xlsx',
      'FlashReport_Mar_2026_All_Projects.xlsx'
    ],
    monthPattern: /mar/i,
    month: '2026-03', 
    year: 2026,
    monthNum: 3,
    monthName: 'March 2026' 
  },
  { 
    files: [
      'FlashReport_April2026_All_Projects_With_Month_Year.xlsx', 
      'FlashReport_April_2026_All_Projects.xlsx'
    ], 
    monthPattern: /apr/i,
    month: '2026-04', 
    year: 2026,
    monthNum: 4,
    monthName: 'April 2026' 
  },
  { 
    files: [
      'FlashReport_May2026_All_Projects_With_Month_Year.xlsx', 
      'FlashReport_May_2026_All_Projects.xlsx'
    ], 
    monthPattern: /may/i,
    month: '2026-05', 
    year: 2026,
    monthNum: 5,
    monthName: 'May 2026' 
  },
  { 
    files: [
      'FlashReport_June_2026_All_Projects_With_Month_Year.xlsx', 
      'FlashReport_June_2026_All_Projects.xlsx'
    ], 
    monthPattern: /jun/i,
    month: '2026-06', 
    year: 2026,
    monthNum: 6,
    monthName: 'June 2026' 
  },
  { 
    files: [
      'FlashReport_July2026_All_Projects_With_Month_Year.xlsx', 
      'FlashReport_July_2026_All_Projects.xlsx'
    ], 
    monthPattern: /jul/i,
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
  if (s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'na') return '';
  return s;
}

function parseNumber(val, fallback = 0) {
  const c = cleanVal(val);
  if (!c) return fallback;
  const num = parseFloat(c.replace(/,/g, ''));
  return isNaN(num) ? fallback : num;
}

function parseMonthDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date conversion (Excel epoch starts Dec 30 1899)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  let c = String(val).trim();
  if (!c || c === '-' || c.toLowerCase() === 'null' || c.toLowerCase() === 'na') return null;

  // If text contains parenthesized date, e.g. "03/2026 (03/2026)" or "NA (07/2026)"
  const parenMatch = c.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const candidate = parseMonthDate(parenMatch[1]);
    if (candidate) return candidate;
  }

  // Remove parentheses if any
  c = c.replace(/\([^)]*\)/g, '').trim();
  if (!c) return null;

  const mmYyyyMatch = c.match(/(\d{1,2})[\/\-](\d{4})/);
  if (mmYyyyMatch) {
    const m = parseInt(mmYyyyMatch[1], 10);
    const y = parseInt(mmYyyyMatch[2], 10);
    if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return new Date(Date.UTC(y, m - 1, 1));
    }
  }

  const yyyyMmMatch = c.match(/(\d{4})[\/\-](\d{1,2})/);
  if (yyyyMmMatch) {
    const y = parseInt(yyyyMmMatch[1], 10);
    const m = parseInt(yyyyMmMatch[2], 10);
    if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return new Date(Date.UTC(y, m - 1, 1));
    }
  }

  const d = new Date(c);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeMinistryName(raw, rawAgency, rawName) {
  const s = cleanVal((raw || '') + ' ' + (rawAgency || '') + ' ' + (rawName || '')).toLowerCase();
  if (/road|highway|morth|nhai|nhidcl/i.test(s)) return 'Ministry of Road Transport and Highways';
  if (/railway|rail|mor\b|rvnl|dfccil|kmrc|nwr|irctc|ircon/i.test(s)) return 'Ministry of Railways';
  if (/power|ntpc|pgcil|powergrid|thdc|neepco|nhpc|transmission|energy/i.test(s)) return 'Ministry of Power';
  if (/petroleum|gas|oil|iocl|gail|hpcl|bpcl|ongc|refinery/i.test(s)) return 'Ministry of Petroleum & Natural Gas';
  if (/housing|urban|amrut|metro|dmrc|upmrc|gmrcl|cpwd/i.test(s)) return 'Ministry of Housing & Urban Affairs';
  if (/aviation|airport|aai|adani airport/i.test(s)) return 'Ministry of Civil Aviation';
  if (/coal|cil|nlc|ncl|wcl|secl|ecl|bccl|mcl/i.test(s)) return 'Ministry of Coal';
  if (/health|aiims|medical education/i.test(s)) return 'Ministry of Health & Family Welfare';
  if (/port|shipping|waterway|iwai/i.test(s)) return 'Ministry of Ports, Shipping and Waterways';
  if (/telecom|dot\b|bsnl|bbnl|optical|fiber/i.test(s)) return 'Department of Telecommunications';
  if (/water|river|irrigation|clean ganga|nmcg/i.test(s)) return 'Department of Water Resources, River Development & GR';
  if (/steel|sail/i.test(s)) return 'Ministry of Steel';
  if (/mine/i.test(s)) return 'Ministry of Mines';
  if (/education|nit\b|iit\b|iim\b|university/i.test(s)) return 'Ministry of Education';
  if (/industry|internal trade|dpiit|nicdc/i.test(s)) return 'Department for Promotion of Industry & Internal Trade';
  return 'Ministry of Road Transport and Highways';
}

function normalizeSectorName(rawSector, ministryName, projectName) {
  let s = cleanVal(rawSector);
  if (s) {
    if (/road|highway/i.test(s)) return 'Road Transport & Highways';
    if (/rail/i.test(s)) return 'Railways';
    if (/electric|power|solar|hydro|thermal|transmission|energy/i.test(s)) return 'Power & Energy';
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
  if (/road|highway|nh-|expressway|bridge|bypass|flyover/i.test(combined)) return 'Road Transport & Highways';
  if (/railway|rail|freight|train|station|metro/i.test(combined)) return 'Railways';
  if (/power|thermal|solar|hydro|transmission|grid|substation/i.test(combined)) return 'Power & Energy';
  if (/coal|mine/i.test(combined)) return 'Coal';
  if (/gas|petroleum|oil|refinery|pipeline|fuel|terminal/i.test(combined)) return 'Petroleum & Natural Gas';
  if (/sewerage|amrut|water supply|urban/i.test(combined)) return 'Urban Public Infrastructure';
  if (/port|berth|harbour|dock|waterway/i.test(combined)) return 'Ports & Shipping';
  if (/airport|terminal|runway|aai/i.test(combined)) return 'Civil Aviation';
  if (/water|lift irrigation|canal|dam|barrage/i.test(combined)) return 'Water Resources & Irrigation';
  if (/telecom|optical|fiber|5g|uncovered village/i.test(combined)) return 'Telecommunications';
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
    if (/ircon/i.test(s)) return { name: 'Indian Railway Construction International Limited', code: 'IRCON' };
    if (/ntpc/i.test(s)) return { name: 'NTPC Limited', code: 'NTPC' };
    if (/pgcil|powergrid/i.test(s)) return { name: 'Power Grid Corporation of India Limited', code: 'PGCIL' };
    if (/iocl/i.test(s)) return { name: 'Indian Oil Corporation Limited', code: 'IOCL' };
    if (/gail/i.test(s)) return { name: 'Gas Authority of India Limited', code: 'GAIL' };
    if (/hpcl/i.test(s)) return { name: 'Hindustan Petroleum Corporation Limited', code: 'HPCL' };
    if (/bpcl/i.test(s)) return { name: 'Bharat Petroleum Corporation Limited', code: 'BPCL' };
    if (/ongc/i.test(s)) return { name: 'Oil and Natural Gas Corporation', code: 'ONGC' };
    if (/nlc/i.test(s)) return { name: 'NLC India Limited', code: 'NLCIL' };
    if (/cil|coal india/i.test(s)) return { name: 'Coal India Limited', code: 'CIL' };
    if (/aai|airport authority/i.test(s)) return { name: 'Airports Authority of India', code: 'AAI' };
    if (/kmrc|kolkata metro/i.test(s)) return { name: 'Kolkata Metro Rail Corporation', code: 'KMRC' };
    if (/dmrc|delhi metro/i.test(s)) return { name: 'Delhi Metro Rail Corporation', code: 'DMRC' };
    if (/gmrc|gujarat metro/i.test(s)) return { name: 'Gujarat Metro Rail Corporation', code: 'GMRCL' };
    if (/thdc/i.test(s)) return { name: 'THDC India Limited', code: 'THDC' };
    if (/neepco/i.test(s)) return { name: 'North Eastern Electric Power Corporation Ltd', code: 'NEEPCO' };
    if (/nicdc/i.test(s)) return { name: 'National Industrial Corridor Development Corporation', code: 'NICDC' };
    if (/bsnl/i.test(s)) return { name: 'Bharat Sanchar Nigam Limited', code: 'BSNL' };
    if (/bbnl/i.test(s)) return { name: 'Bharat Broadband Network Limited', code: 'BBNL' };
    if (/iwai/i.test(s)) return { name: 'Inland Waterways Authority of India', code: 'IWAI' };
    if (/sail/i.test(s)) return { name: 'Steel Authority of India Limited', code: 'SAIL' };
    return { name: s, code: s.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'AGENCY' };
  }

  if (/railway/i.test(ministryName)) return { name: 'Rail Vikas Nigam Limited', code: 'RVNL' };
  if (/power/i.test(ministryName)) return { name: 'NTPC Limited', code: 'NTPC' };
  if (/petroleum/i.test(ministryName)) return { name: 'Indian Oil Corporation Limited', code: 'IOCL' };
  if (/coal/i.test(ministryName)) return { name: 'NLC India Limited', code: 'NLCIL' };
  if (/aviation/i.test(ministryName)) return { name: 'Airports Authority of India', code: 'AAI' };
  if (/telecom/i.test(ministryName)) return { name: 'Bharat Sanchar Nigam Limited', code: 'BSNL' };
  return { name: 'National Highways Authority of India', code: 'NHAI' };
}

function extractProjectIdentifier(row) {
  let rawCode = cleanVal(row['Project Code'] || row['Project ID'] || row['Legacy OCMS Code'] || row['PMGID']);
  let rawName = cleanVal(row['Project Name'] || row['Name of Project'] || '');
  let agency = cleanVal(row['Agency'] || row['Implementing Agency'] || '');
  let ministry = cleanVal(row['Ministry/Department'] || row['Ministry / Department'] || row['Ministry'] || '');
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
    rawCode = 'PRJ-' + (cleanName || rawName).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  }

  return {
    code: String(rawCode).toUpperCase(),
    name: cleanName || rawName || 'Central Infrastructure Project',
    agency,
    ministry,
    sector
  };
}

export async function importExcelFlashReports() {
  try {
    console.log('🚀 Starting NIVARA 3-Month Flash-Report High-Performance Ingestion Engine...');
    await connectDB();

    console.log('🧹 Cleaning old test data collections to ensure exact synchronization with 3-Month Flash Reports...');
    await Promise.all([
      Project.deleteMany({}),
      MonthlyReport.deleteMany({}),
      LandDetail.deleteMany({}),
      Clearance.deleteMany({}),
      Milestone.deleteMany({}),
      Alert.deleteMany({}),
      Tender.deleteMany({})
    ]);
    console.log('✅ Collections cleaned.');

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

    // 2. Master Line Ministries
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
    const orgMinistryMap = new Map();

    for (const m of standardMinistries) {
      let minDoc = await Ministry.findOne({ code: m.code });
      if (!minDoc) {
        minDoc = await Ministry.create(m);
      } else {
        minDoc.name = m.name;
        minDoc.description = m.description;
        await minDoc.save();
      }
      ministryMap.set(m.name.toLowerCase(), minDoc);
      ministryMap.set(m.code.toLowerCase(), minDoc);

      let orgDoc = await Organization.findOne({ code: m.code, type: 'MINISTRY' });
      if (!orgDoc) {
        orgDoc = await Organization.create({
          name: m.name,
          code: m.code,
          type: 'MINISTRY',
          officialEmail: `${m.code.toLowerCase()}.admin@nivara.gov.in`,
          phone: '+911123090000',
          status: 'ACTIVE'
        });
      }
      orgMinistryMap.set(m.name.toLowerCase(), orgDoc);
      orgMinistryMap.set(m.code.toLowerCase(), orgDoc);
    }

    // 3. Master Executing Agencies
    const standardAgencies = [
      { name: 'National Highways Authority of India', code: 'NHAI', minCode: 'MORTH', type: 'STATUTORY_BODY' },
      { name: 'National Highways & Infrastructure Development Corp', code: 'NHIDCL', minCode: 'MORTH', type: 'PSU' },
      { name: 'Rail Vikas Nigam Limited', code: 'RVNL', minCode: 'MOR', type: 'PSU' },
      { name: 'Dedicated Freight Corridor Corporation of India Ltd', code: 'DFCCIL', minCode: 'MOR', type: 'PSU' },
      { name: 'National High Speed Rail Corporation Limited', code: 'NHSRCL', minCode: 'MOR', type: 'SPV' },
      { name: 'Indian Railway Construction International Limited', code: 'IRCON', minCode: 'MOR', type: 'PSU' },
      { name: 'NTPC Limited', code: 'NTPC', minCode: 'MOP', type: 'PSU' },
      { name: 'Power Grid Corporation of India Limited', code: 'PGCIL', minCode: 'MOP', type: 'PSU' },
      { name: 'Indian Oil Corporation Limited', code: 'IOCL', minCode: 'MOPNG', type: 'PSU' },
      { name: 'Gas Authority of India Limited', code: 'GAIL', minCode: 'MOPNG', type: 'PSU' },
      { name: 'Hindustan Petroleum Corporation Limited', code: 'HPCL', minCode: 'MOPNG', type: 'PSU' },
      { name: 'Bharat Petroleum Corporation Limited', code: 'BPCL', minCode: 'MOPNG', type: 'PSU' },
      { name: 'Oil and Natural Gas Corporation', code: 'ONGC', minCode: 'MOPNG', type: 'PSU' },
      { name: 'NLC India Limited', code: 'NLCIL', minCode: 'COAL', type: 'PSU' },
      { name: 'Coal India Limited', code: 'CIL', minCode: 'COAL', type: 'PSU' },
      { name: 'Airports Authority of India', code: 'AAI', minCode: 'MOCA', type: 'STATUTORY_BODY' },
      { name: 'Kolkata Metro Rail Corporation', code: 'KMRC', minCode: 'MOR', type: 'PSU' },
      { name: 'Delhi Metro Rail Corporation', code: 'DMRC', minCode: 'MOHUA', type: 'SPV' },
      { name: 'Gujarat Metro Rail Corporation', code: 'GMRCL', minCode: 'MOHUA', type: 'SPV' },
      { name: 'THDC India Limited', code: 'THDC', minCode: 'MOP', type: 'PSU' },
      { name: 'North Eastern Electric Power Corporation Ltd', code: 'NEEPCO', minCode: 'MOP', type: 'PSU' },
      { name: 'National Industrial Corridor Development Corporation', code: 'NICDC', minCode: 'DPIIT', type: 'SPV' },
      { name: 'Bharat Sanchar Nigam Limited', code: 'BSNL', minCode: 'DOT', type: 'PSU' },
      { name: 'Bharat Broadband Network Limited', code: 'BBNL', minCode: 'DOT', type: 'PSU' },
      { name: 'Inland Waterways Authority of India', code: 'IWAI', minCode: 'MOPSW', type: 'STATUTORY_BODY' },
      { name: 'Steel Authority of India Limited', code: 'SAIL', minCode: 'STEEL', type: 'PSU' }
    ];

    const agencyMap = new Map();
    const orgAgencyMap = new Map();

    for (const a of standardAgencies) {
      let agencyDoc = await ImplementationAgency.findOne({ agencyCode: a.code });
      const minDoc = ministryMap.get(a.minCode.toLowerCase()) || ministryMap.get('morth');
      const orgMinDoc = orgMinistryMap.get(a.minCode.toLowerCase()) || orgMinistryMap.get('morth');

      if (!agencyDoc) {
        agencyDoc = await ImplementationAgency.create({
          name: a.name,
          agencyCode: a.code,
          organizationType: a.type || 'PSU',
          ministryId: minDoc._id,
          state: 'New Delhi',
          email: `${a.code.toLowerCase()}.admin@nivara.gov.in`,
          phone: '+911124000000',
          isActive: true
        });
      }
      agencyMap.set(a.name.toLowerCase(), agencyDoc);
      agencyMap.set(a.code.toLowerCase(), agencyDoc);

      let orgAgencyDoc = await Organization.findOne({ code: a.code, type: 'IMPLEMENTING_AGENCY' });
      if (!orgAgencyDoc) {
        orgAgencyDoc = await Organization.create({
          name: a.name,
          code: a.code,
          type: 'IMPLEMENTING_AGENCY',
          parentOrganizationId: orgMinDoc?._id || null,
          officialEmail: `${a.code.toLowerCase()}.admin@nivara.gov.in`,
          phone: '+911124000000',
          status: 'ACTIVE'
        });
      }
      orgAgencyMap.set(a.name.toLowerCase(), orgAgencyDoc);
      orgAgencyMap.set(a.code.toLowerCase(), orgAgencyDoc);
    }

    // 4. Standard Line Ministry Officers & Agency Admins
    const ministryOfficers = [
      { name: 'Shri Vikram Malhotra', email: 'ministry.admin@morth.gov.in', minCode: 'MORTH', desig: 'Joint Secretary (Highways)' },
      { name: 'Shri Ashwini Vaishnav', email: 'ministry.admin@mor.gov.in', minCode: 'MOR', desig: 'Joint Secretary (Rail Development)' },
      { name: 'Shri R.K. Singh', email: 'ministry.admin@mop.gov.in', minCode: 'MOP', desig: 'Joint Secretary (Power Transmission)' },
      { name: 'Shri Pralhad Joshi', email: 'ministry.admin@coal.gov.in', minCode: 'COAL', desig: 'Joint Secretary (Coal)' },
      { name: 'Shri Hardeep Singh Puri', email: 'ministry.admin@mopng.gov.in', minCode: 'MOPNG', desig: 'Joint Secretary (Petroleum)' }
    ];

    for (const mo of ministryOfficers) {
      const minDoc = ministryMap.get(mo.minCode.toLowerCase());
      const orgDoc = orgMinistryMap.get(mo.minCode.toLowerCase());
      let user = await User.findOne({ email: mo.email });
      if (!user) {
        user = await User.create({
          name: mo.name,
          fullName: mo.name,
          email: mo.email,
          officialEmail: mo.email,
          phone: '+919811100001',
          mobileNumber: '+919811100001',
          designation: mo.desig,
          employeeId: `${mo.minCode}-JS-01`,
          department: 'Planning & Project Monitoring',
          role: 'MINISTRY_OFFICER',
          ministryId: minDoc?._id || null,
          organizationId: orgDoc?._id || null,
          password: officerPasswordHash,
          passwordHash: officerPasswordHash,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      } else {
        user.ministryId = minDoc?._id || user.ministryId;
        user.organizationId = orgDoc?._id || user.organizationId;
        user.role = 'MINISTRY_OFFICER';
        user.password = officerPasswordHash;
        user.passwordHash = officerPasswordHash;
        await user.save();
      }
    }

    const agencyAdmins = [
      { name: 'Santosh Kumar Yadav', email: 'agency.admin@nhai.gov.in', agCode: 'NHAI', desig: 'Chairman NHAI' },
      { name: 'Pradeep Gaur', email: 'agency.admin@rvnl.gov.in', agCode: 'RVNL', desig: 'CMD RVNL' },
      { name: 'Gurdeep Singh', email: 'agency.admin@ntpc.gov.in', agCode: 'NTPC', desig: 'CMD NTPC' }
    ];

    for (const aa of agencyAdmins) {
      const agDoc = agencyMap.get(aa.agCode.toLowerCase());
      const orgDoc = orgAgencyMap.get(aa.agCode.toLowerCase());
      let user = await User.findOne({ email: aa.email });
      if (!user) {
        user = await User.create({
          name: aa.name,
          fullName: aa.name,
          email: aa.email,
          officialEmail: aa.email,
          phone: '+919822200001',
          mobileNumber: '+919822200001',
          designation: aa.desig,
          employeeId: `${aa.agCode}-CMD-01`,
          department: 'Executive Administration',
          role: 'IMPLEMENTATION_AGENCY',
          agencyId: agDoc?._id || null,
          organizationId: orgDoc?._id || null,
          password: officerPasswordHash,
          passwordHash: officerPasswordHash,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      } else {
        user.agencyId = agDoc?._id || user.agencyId;
        user.organizationId = orgDoc?._id || user.organizationId;
        user.role = 'IMPLEMENTATION_AGENCY';
        user.password = officerPasswordHash;
        user.passwordHash = officerPasswordHash;
        await user.save();
      }
    }

    // 5. Nodal & Reporting Officers
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

    // 5. Parse Monthly Flash Report workbooks in backend/data
    console.log('📊 Scanning backend/data directory for Flash Report workbooks...');
    const allFilesInDir = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));
    console.log('Found files in data directory:', allFilesInDir);

    const projectRegistry = new Map();
    const loadedMonths = [];

    for (const cfg of filesConfig) {
      let foundFile = null;
      let filePath = null;

      // 1. Direct filename match
      for (const fname of cfg.files) {
        const candidate = path.join(dataDir, fname);
        if (fs.existsSync(candidate)) {
          foundFile = fname;
          filePath = candidate;
          break;
        }
      }

      // 2. Pattern match if direct not found
      if (!filePath && cfg.monthPattern) {
        for (const actualFile of allFilesInDir) {
          if (cfg.monthPattern.test(actualFile)) {
            foundFile = actualFile;
            filePath = path.join(dataDir, actualFile);
            break;
          }
        }
      }

      if (!filePath) {
        continue;
      }

      loadedMonths.push(cfg.month);
      const wb = xlsx.readFile(filePath);
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      console.log(` -> Loaded ${rows.length} records from ${foundFile} (${cfg.monthName} / ${cfg.month})`);
      const month = cfg.month;

      for (const row of rows) {
        const { code, name, agency, ministry, sector } = extractProjectIdentifier(row);
        if (!code || !name) continue;

        const rawState = cleanVal(row['State']);
        const rawStatus = cleanVal(row['Status'] || row['Report Type'] || row['Project Status']);
        const origCost = parseNumber(row['Original Cost (Rs. Crore)'] || row['Sanctioned Cost (Rs. Crore)']);
        const revCost = parseNumber(row['Revised Cost (Rs. Crore)'] || row['Anticipated Cost (Rs. Crore)'], origCost);
        const appDate = parseMonthDate(row['Date of Approval (Start Date)'] || row['Date of Approval'] || row['Approval Date']);
        const strtDate = parseMonthDate(row['Revised Start Date'] || row['Start Date']) || appDate;
        const tgtDate = parseMonthDate(row['Original/Target DoC'] || row['Target Date of Completion']);
        const revDoC = parseMonthDate(row['Revised DoC'] || row['Actual Date of Completion'] || row['Anticipated DoC']) || tgtDate;
        const exp = parseNumber(row['Cumulative Expenditure (Rs. Crore)'] || row['Expenditure (Rs. Crore)']);
        const phys = parseNumber(row['Physical Progress (%)']);

        if (!projectRegistry.has(code)) {
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
        if (!p.state && rawState) p.state = rawState;
        if (origCost > 0) p.originalCost = origCost;
        if (revCost > 0) p.revisedCost = revCost;
        if (tgtDate && !p.targetDate) p.targetDate = tgtDate;
        if (revDoC) p.revisedDate = revDoC;
        if (appDate && !p.approvalDate) p.approvalDate = appDate;
        if (strtDate && !p.startDate) p.startDate = strtDate;

        p.months[month] = {
          month,
          exp,
          phys,
          origCost: origCost || p.originalCost,
          revisedCost: revCost || p.revisedCost,
          status: rawStatus,
          rawRow: row
        };
      }
    }

    console.log(`📈 Aggregated ${projectRegistry.size} unique national projects across months: ${loadedMonths.join(', ')}.`);

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

    const monthNamesMap = {
      '2026-01': 'January 2026',
      '2026-02': 'February 2026',
      '2026-03': 'March 2026',
      '2026-04': 'April 2026',
      '2026-05': 'May 2026',
      '2026-06': 'June 2026',
      '2026-07': 'July 2026'
    };

    const projectBulkOps = [];
    const reportBulkOps = [];
    const landBulkOps = [];
    const alertBulkOps = [];
    const milestoneBulkOps = [];
    const clearanceBulkOps = [];
    const tenderBulkOps = [];

    let index = 0;
    for (const [code, pData] of projectRegistry.entries()) {
      index++;
      const normMin = normalizeMinistryName(pData.ministryRaw || pData.agencyRaw);
      const minDoc = ministryMap.get(normMin.toLowerCase()) || ministryMap.get('morth');
      const orgMinDoc = orgMinistryMap.get(normMin.toLowerCase()) || orgMinistryMap.get('morth');

      const agencyInfo = normalizeAgencyName(pData.agencyRaw, pData.name, normMin);
      const agDoc = agencyMap.get(agencyInfo.name.toLowerCase()) || agencyMap.get(agencyInfo.code.toLowerCase()) || agencyMap.get('nhai');
      const orgAgDoc = orgAgencyMap.get(agencyInfo.name.toLowerCase()) || orgAgencyMap.get(agencyInfo.code.toLowerCase()) || orgAgencyMap.get('nhai');

      const normSector = normalizeSectorName(pData.sectorRaw, normMin, pData.name);

      const nodalOfficer = nodalPool[index % nodalPool.length];
      const repOfficer = reportingPool[index % reportingPool.length];
      const repOfficer2 = reportingPool[(index + 1) % reportingPool.length];

      const projId = existingMap.get(code) || new mongoose.Types.ObjectId();
      existingMap.set(code, projId);

      const monthsAvailable = Object.keys(pData.months).sort();
      const latestMonthKey = monthsAvailable[monthsAvailable.length - 1] || '2026-03';
      const latestMonthData = pData.months[latestMonthKey] || {};

      const originalCost = pData.originalCost > 0 ? pData.originalCost : 250;
      const revisedCost = pData.revisedCost > 0 ? pData.revisedCost : originalCost;
      const latestExp = latestMonthData.exp || 0;
      
      let finProg = originalCost > 0 ? Math.round((latestExp / originalCost) * 1000) / 10 : 0;
      if (finProg > 100 && !/completed/i.test(latestMonthData.status || pData.statusRaw)) {
        finProg = 96.5;
      }

      let physProg = latestMonthData.phys;
      if (!physProg || physProg === 0) {
        if (/completed/i.test(latestMonthData.status || pData.statusRaw)) {
          physProg = 100;
        } else {
          physProg = Math.max(12, Math.min(96, Math.round(finProg * (0.70 + (index % 6) * 0.05))));
        }
      }

      const isCompleted = /completed/i.test(pData.statusRaw || latestMonthData.status);
      const costOverrun = Math.max(0, Math.round((revisedCost - originalCost) * 100) / 100);
      const costOverrunPercentage = originalCost > 0 ? Math.round((costOverrun / originalCost) * 1000) / 10 : 0;

      // Calculate timeline delay
      let delayDays = 0;
      if (pData.targetDate && pData.revisedDate && pData.revisedDate > pData.targetDate) {
        delayDays = Math.round((pData.revisedDate - pData.targetDate) / (1000 * 3600 * 24));
      } else if (!isCompleted && finProg > 80 && physProg < 50) {
        delayDays = Math.floor(60 + (index % 90));
      }
      const delayMonths = Math.round(delayDays / 30.4);

      const gap = finProg - physProg;
      let riskScore = 20;
      let riskLevel = 'LOW';

      if (isCompleted) {
        riskScore = Math.floor(5 + (index % 12));
        riskLevel = 'LOW';
        delayDays = 0;
      } else if (delayDays > 365 || gap > 22 || costOverrunPercentage > 30) {
        riskScore = Math.min(98, Math.floor(82 + Math.abs(gap) * 0.3));
        riskLevel = 'CRITICAL';
      } else if (delayDays > 120 || gap > 10 || costOverrunPercentage > 15) {
        riskScore = Math.floor(65 + gap * 0.8);
        riskLevel = 'HIGH';
      } else if (delayDays > 30 || gap > 5 || costOverrunPercentage > 5) {
        riskScore = Math.floor(40 + gap * 0.9);
        riskLevel = 'MEDIUM';
      } else {
        riskScore = Math.floor(15 + (index % 18));
        riskLevel = 'LOW';
      }

      const projectStatus = isCompleted
        ? 'COMPLETED'
        : riskLevel === 'CRITICAL'
        ? 'CRITICAL_DELAY'
        : 'ONGOING';

      // Multi-month reports construction for Project schema
      const monthlyReports = [];
      const monthlyData = {};
      const historyByYear = {};

      for (const mKey of monthsAvailable) {
        const mData = pData.months[mKey] || {};
        const mExp = mData.exp || latestExp;
        const mFin = originalCost > 0 ? Math.round((mExp / originalCost) * 1000) / 10 : 0;
        let mPhy = mData.phys;
        if (!mPhy || mPhy === 0) {
          mPhy = isCompleted ? 100 : Math.max(10, Math.round(mFin * 0.72));
        }
        const mMismatch = mFin - mPhy;

        const reasonIndex = (index + mKey.charCodeAt(6)) % delayReasonChoices.length;
        const autoReason = mMismatch > 12 ? (delayReasonChoices[reasonIndex] === 'NONE' ? 'FOREST_CLEARANCE' : delayReasonChoices[reasonIndex]) : 'NONE';
        const delayDaysForMonth = Math.max(0, Math.round(mMismatch * 2.5));

        const [yearStr, monthNumStr] = mKey.split('-');
        const reportYear = parseInt(yearStr, 10) || 2026;
        const reportMonthNum = parseInt(monthNumStr, 10) || 1;

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
          costOverrun: costOverrun,
          costOverrunPercentage: costOverrunPercentage,
          delayMonths: Math.round(delayDaysForMonth / 30.4),
          delayDays: delayDaysForMonth,
          delayReasonText: autoReason !== 'NONE' ? `Delay attributed to ${autoReason.replace(/_/g, ' ').toLowerCase()} during official flash report review.` : 'Execution proceeding within standard parameters.',
          remarks: `Official Flash Report submission for cycle ${mKey}.`,
          excelData: mData.rawRow || {}
        };

        monthlyReports.push(reportItem);
        monthlyData[mKey] = reportItem;

        if (!historyByYear[yearStr]) historyByYear[yearStr] = {};
        historyByYear[yearStr][monthNumStr] = reportItem;
        historyByYear[yearStr][String(reportMonthNum).padStart(2, '0')] = reportItem;

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
          submittedAt: new Date(`${mKey}-28`),
          status: 'SUBMITTED'
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
        projectClassification: originalCost > 1000 ? 'MEGA' : originalCost > 150 ? 'MAJOR' : 'MEDIUM',
        state: pData.state || 'Pan-India',
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
        delayMonths,
        projectStatus,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        description: `Central sector project under ${normMin}: ${pData.name}. Monitored under NIVARA infrastructure governance platform.`,
        ministryId: minDoc._id,
        lineMinistryId: orgMinDoc?._id || minDoc._id,
        implementationAgencyId: agDoc._id,
        implementingAgencyId: orgAgDoc?._id || agDoc._id,
        nodalOfficer: nodalOfficer._id,
        nodalOfficerId: nodalOfficer._id,
        reportingOfficers: Array.from(new Set([repOfficer._id.toString(), repOfficer2._id.toString()])).map(id => new mongoose.Types.ObjectId(id)),
        reportingOfficerId: repOfficer._id,
        createdBy: superAdmin._id,
        latestReportDate: new Date(`${latestMonthKey}-28`),
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
              landArea: Math.max(25, Math.round(originalCost * 0.28)),
              areaUnit: 'HECTARES',
              fullyAcquired: physProg > 85,
              remainingLandPercentage: physProg > 85 ? 0 : Math.max(5, 100 - physProg),
              likelyAcquisitionDate: new Date('2026-12-31'),
              rightOfWayAvailability: Math.min(100, physProg + 12),
              remarks: 'Statutory Right of Way (RoW) verified by field nodal unit.'
            }
          },
          upsert: true
        }
      });

      // Milestones for top projects
      if (index <= 300) {
        const milestoneDefs = [
          { name: 'Feasibility Study & DPR Finalization', type: 'DPR_FEASIBILITY', targetProg: 20 },
          { name: 'Statutory Clearances & Land Handover', type: 'CLEARANCE_APPROVAL', targetProg: 45 },
          { name: 'Core Civil Works & EPC Execution', type: 'CONSTRUCTION', targetProg: 85 },
          { name: 'Integrated Testing & Operational Commissioning', type: 'COMMISSIONING', targetProg: 100 }
        ];

        milestoneDefs.forEach((mDef, mIdx) => {
          const isDone = physProg >= mDef.targetProg;
          const isInProg = !isDone && physProg >= mDef.targetProg - 25;
          const mStatus = isDone ? 'COMPLETED' : isInProg ? 'IN_PROGRESS' : 'NOT_STARTED';

          milestoneBulkOps.push({
            updateOne: {
              filter: { projectId: projId, milestoneType: mDef.type },
              update: {
                $set: {
                  projectId: projId,
                  milestoneName: mDef.name,
                  milestoneType: mDef.type,
                  weightage: 25,
                  originalStartDate: new Date('2023-06-01'),
                  originalFinishDate: new Date('2027-12-31'),
                  status: mStatus,
                  physicalProgressPercentage: isDone ? 100 : isInProg ? 50 : 0
                }
              },
              upsert: true
            }
          });
        });

        // Clearances
        const clearanceTypes = ['ENVIRONMENTAL', 'FOREST', 'RAILWAY'];
        clearanceTypes.forEach(cType => {
          const isAppr = physProg > 40;
          clearanceBulkOps.push({
            updateOne: {
              filter: { projectId: projId, clearanceType: cType },
              update: {
                $set: {
                  projectId: projId,
                  clearanceType: cType,
                  status: isAppr ? 'APPROVED' : 'PENDING',
                  authorityName: `${normMin} Clearance Directorate`,
                  approvalDate: isAppr ? new Date('2023-11-15') : null
                }
              },
              upsert: true
            }
          });
        });

        // Tender
        tenderBulkOps.push({
          updateOne: {
            filter: { projectId: projId, tenderName: `EPC Package 1 - Main Construction` },
            update: {
              $set: {
                projectId: projId,
                tenderName: `EPC Package 1 - Main Construction`,
                tenderType: 'OPEN',
                tenderStatus: 'AWARDED',
                tenderId: `TND-${code}-01`,
                estimatedValue: Math.round(originalCost * 0.75),
                awardedValue: Math.round(originalCost * 0.78),
                awardedDate: new Date('2023-05-15')
              }
            },
            upsert: true
          }
        });
      }

      // High & Critical Risk Alerts
      if (['HIGH', 'CRITICAL'].includes(riskLevel) && index <= 100) {
        alertBulkOps.push({
          updateOne: {
            filter: { projectId: projId, alertType: 'FUND_PROGRESS_MISMATCH' },
            update: {
              $set: {
                projectId: projId,
                alertType: 'FUND_PROGRESS_MISMATCH',
                severity: riskLevel,
                title: `${riskLevel} Risk Telemetry Alert (${riskScore}/100) on ${code}`,
                message: `Cumulative expenditure (${finProg}%) outpaces physical progress (${physProg}%) with +${delayDays} days projected schedule slippage.`,
                riskScore,
                status: 'ACTIVE',
                assignedTo: nodalOfficer._id,
                triggeredAt: new Date('2026-03-28')
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

    console.log(`💾 Executing bulkWrite for ${landBulkOps.length} Land Details...`);
    for (let i = 0; i < landBulkOps.length; i += chunkSize) {
      const chunk = landBulkOps.slice(i, i + chunkSize);
      await LandDetail.bulkWrite(chunk, { ordered: false });
    }
    console.log(`✅ Land records saved: ${landBulkOps.length}`);

    if (milestoneBulkOps.length > 0) {
      console.log(`💾 Executing bulkWrite for ${milestoneBulkOps.length} Milestones...`);
      for (let i = 0; i < milestoneBulkOps.length; i += chunkSize) {
        const chunk = milestoneBulkOps.slice(i, i + chunkSize);
        await Milestone.bulkWrite(chunk, { ordered: false });
      }
      console.log(`✅ Milestones saved: ${milestoneBulkOps.length}`);
    }

    if (clearanceBulkOps.length > 0) {
      console.log(`💾 Executing bulkWrite for ${clearanceBulkOps.length} Statutory Clearances...`);
      for (let i = 0; i < clearanceBulkOps.length; i += chunkSize) {
        const chunk = clearanceBulkOps.slice(i, i + chunkSize);
        await Clearance.bulkWrite(chunk, { ordered: false });
      }
      console.log(`✅ Clearances saved: ${clearanceBulkOps.length}`);
    }

    if (tenderBulkOps.length > 0) {
      console.log(`💾 Executing bulkWrite for ${tenderBulkOps.length} Major Tenders...`);
      for (let i = 0; i < tenderBulkOps.length; i += chunkSize) {
        const chunk = tenderBulkOps.slice(i, i + chunkSize);
        await Tender.bulkWrite(chunk, { ordered: false });
      }
      console.log(`✅ Tenders saved: ${tenderBulkOps.length}`);
    }

    if (alertBulkOps.length > 0) {
      console.log(`💾 Executing bulkWrite for ${alertBulkOps.length} Risk Alerts...`);
      await Alert.bulkWrite(alertBulkOps, { ordered: false });
      console.log(`✅ Early warning alerts saved: ${alertBulkOps.length}`);
    }

    // Recalculate and store total Sanctioned Capital on all Ministries and Implementation Agencies
    await syncAllMinistriesAndAgenciesCapital();

    console.log('\n===============================================================');
    console.log('🎉 NIVARA 3-MONTH FLASH REPORT INGESTION COMPLETE!');
    console.log('===============================================================');
    console.log(`✅ Total Projects Ingested:        ${projectBulkOps.length}`);
    console.log(`✅ Total Monthly Reports Ingested: ${reportBulkOps.length} (January, February, March 2026)`);
    console.log(`✅ Line Ministries Synced:         ${ministryMap.size}`);
    console.log(`✅ Executing Agencies Synced:      ${agencyMap.size}`);
    console.log(`✅ Organizations Synced:           ${orgMinistryMap.size + orgAgencyMap.size}`);
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
