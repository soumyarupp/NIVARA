import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Ministry } from '../src/models/Ministry.js';
import { ImplementationAgency } from '../src/models/ImplementationAgency.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { hashPassword } from '../src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

// Master dictionary of Line Ministries
const MASTER_MINISTRIES = [
  { name: 'Ministry of Road Transport and Highways', code: 'MORTH', description: 'National highways, expressways, and road connectivity corridors' },
  { name: 'Ministry of Railways', code: 'MOR', description: 'Dedicated freight corridors, high-speed rail, track doubling and electrification' },
  { name: 'Ministry of Power', code: 'MOP', description: 'Generation, ultra-mega solar parks, and inter-state transmission grids' },
  { name: 'Ministry of Petroleum & Natural Gas', code: 'MOPNG', description: 'Refineries, strategic crude reserves, and national gas grids' },
  { name: 'Ministry of Housing & Urban Affairs', code: 'MOHUA', description: 'Metro rail transit, AMRUT urban rejuvenation, and smart cities' },
  { name: 'Ministry of Ports, Shipping and Waterways', code: 'MOPSW', description: 'Deep sea ports, container terminals, and National Inland Waterways' },
  { name: 'Ministry of Civil Aviation', code: 'MOCA', description: 'Greenfield international airports and regional connectivity routes' },
  { name: 'Ministry of Coal', code: 'COAL', description: 'Coalfields development, automated washeries, and evacuation corridors' },
  { name: 'Department of Water Resources, River Development & GR', code: 'MOWR', description: 'Inter-state river links, multi-purpose barrages, and NMCG clean ganga' },
  { name: 'Ministry of Health & Family Welfare', code: 'MOHFW', description: 'All India Institutes of Medical Sciences (AIIMS) and medical colleges' },
  { name: 'Department of Telecommunications', code: 'DOT', description: 'National optical fiber network and 5G saturation corridors' },
  { name: 'Ministry of Steel', code: 'STEEL', description: 'Steel Authority of India modernization and raw material logistics' },
  { name: 'Ministry of Mines', code: 'MINES', description: 'Strategic mineral extraction and exploration infrastructure' },
  { name: 'Department for Promotion of Industry & Internal Trade', code: 'DPIIT', description: 'National industrial corridors and PM GatiShakti multi-modal nodes' },
  { name: 'Ministry of Education', code: 'MOE', description: 'Central Universities, IITs, IIMs, and national research institutions' },
  { name: 'Ministry of Environment, Forest & Climate Change', code: 'MOEFCC', description: 'Ecological monitoring and environmental clearance oversight' }
];

// Master dictionary of Executing Agencies & their Line Ministry codes
const MASTER_AGENCIES = [
  // MORTH
  { name: 'National Highways Authority of India', code: 'NHAI', minCode: 'MORTH', type: 'STATUTORY_BODY' },
  { name: 'National Highways & Infrastructure Development Corp', code: 'NHIDCL', minCode: 'MORTH', type: 'PSU' },
  { name: 'Central Public Works Department', code: 'CPWD', minCode: 'MORTH', type: 'CENTRAL_AGENCY' },
  
  // MOR
  { name: 'Rail Vikas Nigam Limited', code: 'RVNL', minCode: 'MOR', type: 'PSU' },
  { name: 'Dedicated Freight Corridor Corporation of India Ltd', code: 'DFCCIL', minCode: 'MOR', type: 'PSU' },
  { name: 'National High Speed Rail Corporation Limited', code: 'NHSRCL', minCode: 'MOR', type: 'SPV' },
  { name: 'Indian Railway Construction International Limited', code: 'IRCON', minCode: 'MOR', type: 'PSU' },
  { name: 'Central Organisation for Railway Electrification', code: 'CORE', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'Northern Railway Zone', code: 'NR', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'Eastern Railway Zone', code: 'ER', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'Western Railway Zone', code: 'WR', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'Southern Railway Zone', code: 'SR', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'South Central Railway Zone', code: 'SCR', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'East Coast Railway Zone', code: 'ECOR', minCode: 'MOR', type: 'CENTRAL_AGENCY' },
  { name: 'Kolkata Metro Rail Corporation', code: 'KMRC', minCode: 'MOR', type: 'PSU' },

  // MOP
  { name: 'NTPC Limited', code: 'NTPC', minCode: 'MOP', type: 'PSU' },
  { name: 'Power Grid Corporation of India Limited', code: 'PGCIL', minCode: 'MOP', type: 'PSU' },
  { name: 'THDC India Limited', code: 'THDC', minCode: 'MOP', type: 'PSU' },
  { name: 'North Eastern Electric Power Corporation Ltd', code: 'NEEPCO', minCode: 'MOP', type: 'PSU' },
  { name: 'NHPC Limited', code: 'NHPC', minCode: 'MOP', type: 'PSU' },

  // MOPNG
  { name: 'Indian Oil Corporation Limited', code: 'IOCL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Gas Authority of India Limited', code: 'GAIL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Hindustan Petroleum Corporation Limited', code: 'HPCL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Bharat Petroleum Corporation Limited', code: 'BPCL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Oil and Natural Gas Corporation', code: 'ONGC', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Oil India Limited', code: 'OIL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Numaligarh Refinery Limited', code: 'NRL', minCode: 'MOPNG', type: 'PSU' },
  { name: 'Indradhanush Gas Grid Limited', code: 'IGGL', minCode: 'MOPNG', type: 'JOINT_VENTURE' },

  // MOHUA
  { name: 'Delhi Metro Rail Corporation', code: 'DMRC', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Gujarat Metro Rail Corporation Limited', code: 'GMRCL', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Mumbai Metro Rail Corporation Limited', code: 'MMRC', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Madhya Pradesh Metro Rail Co Limited', code: 'MPMRCL', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Patna Metro Rail Corporation Ltd', code: 'PMRCL', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Noida Metro Rail Corporation Ltd', code: 'NMRCL', minCode: 'MOHUA', type: 'SPV' },
  { name: 'Jaipur Metro Rail Corporation', code: 'JMRC', minCode: 'MOHUA', type: 'SPV' },

  // MOPSW
  { name: 'Inland Waterways Authority of India', code: 'IWAI', minCode: 'MOPSW', type: 'STATUTORY_BODY' },
  { name: 'Syama Prasad Mookerjee Port Kolkata', code: 'SMPK', minCode: 'MOPSW', type: 'STATUTORY_BODY' },
  { name: 'Paradip Port Authority', code: 'PPA', minCode: 'MOPSW', type: 'STATUTORY_BODY' },
  { name: 'Jawaharlal Nehru Port Authority', code: 'JNPA', minCode: 'MOPSW', type: 'STATUTORY_BODY' },

  // MOCA
  { name: 'Airports Authority of India', code: 'AAI', minCode: 'MOCA', type: 'STATUTORY_BODY' },

  // COAL
  { name: 'Coal India Limited', code: 'CIL', minCode: 'COAL', type: 'PSU' },
  { name: 'NLC India Limited', code: 'NLCIL', minCode: 'COAL', type: 'PSU' },
  { name: 'Mahanadi Coalfields Limited', code: 'MCL', minCode: 'COAL', type: 'PSU' },
  { name: 'Western Coalfields Limited', code: 'WCL', minCode: 'COAL', type: 'PSU' },
  { name: 'Northern Coalfields Limited', code: 'NCL', minCode: 'COAL', type: 'PSU' },
  { name: 'Bharat Coking Coal Limited', code: 'BCCL', minCode: 'COAL', type: 'PSU' },
  { name: 'Eastern Coalfields Limited', code: 'ECL', minCode: 'COAL', type: 'PSU' },

  // MOWR
  { name: 'National Mission for Clean Ganga', code: 'NMCG', minCode: 'MOWR', type: 'STATUTORY_BODY' },
  { name: 'National Water Development Agency', code: 'NWDA', minCode: 'MOWR', type: 'STATUTORY_BODY' },

  // STEEL
  { name: 'Steel Authority of India Limited', code: 'SAIL', minCode: 'STEEL', type: 'PSU' },

  // DOT
  { name: 'Bharat Sanchar Nigam Limited', code: 'BSNL', minCode: 'DOT', type: 'PSU' },
  { name: 'Bharat Broadband Network Limited', code: 'BBNL', minCode: 'DOT', type: 'PSU' },

  // DPIIT
  { name: 'National Industrial Corridor Development Corporation', code: 'NICDC', minCode: 'DPIIT', type: 'SPV' }
];

async function seedMinistriesAndAgencies() {
  try {
    console.log('🏛️ Connecting to MongoDB to synchronize Ministries, Agencies, and Ministers...');
    await connectDB();

    const defaultPassword = await hashPassword('Admin@12345');

    // 1. Sync Ministries
    console.log('📋 Creating / Upserting Line Ministries...');
    const ministryMap = new Map(); // code -> doc

    for (const min of MASTER_MINISTRIES) {
      let doc = await Ministry.findOne({ code: min.code });
      if (!doc) {
        doc = await Ministry.create({
          name: min.name,
          code: min.code,
          description: min.description,
          isActive: true
        });
      } else {
        doc.name = min.name;
        doc.description = min.description;
        await doc.save();
      }
      ministryMap.set(min.code, doc);
      ministryMap.set(min.name.toLowerCase(), doc);
    }
    console.log(`✅ Synced ${MASTER_MINISTRIES.length} Line Ministries.`);

    // 2. Sync Executing Agencies
    console.log('🏢 Creating / Upserting Implementation Agencies...');
    const agencyMap = new Map(); // code -> doc

    for (const ag of MASTER_AGENCIES) {
      const parentMin = ministryMap.get(ag.minCode);
      if (!parentMin) continue;

      let doc = await ImplementationAgency.findOne({ agencyCode: ag.code });
      if (!doc) {
        doc = await ImplementationAgency.create({
          name: ag.name,
          agencyCode: ag.code,
          organizationType: ag.type,
          ministryId: parentMin._id,
          department: `${ag.name} Projects Division`,
          contactPerson: `Executive Director (${ag.code})`,
          email: `contact.${ag.code.toLowerCase()}@nic.in`,
          phone: '+91 11 2309 0000',
          isActive: true
        });
      } else {
        doc.name = ag.name;
        doc.ministryId = parentMin._id;
        doc.organizationType = ag.type;
        await doc.save();
      }
      agencyMap.set(ag.code, doc);
      agencyMap.set(ag.name.toLowerCase(), doc);
    }
    console.log(`✅ Synced ${MASTER_AGENCIES.length} Implementation Agencies.`);

    // 3. Create / Sync Minister & Ministry Officer Accounts for every Ministry
    console.log('👤 Creating Ministerial Accounts for all Ministries...');
    for (const min of MASTER_MINISTRIES) {
      const minDoc = ministryMap.get(min.code);
      if (!minDoc) continue;

      const email = `minister.${min.code.toLowerCase()}@nivara.gov.in`;
      const adminEmail = `admin.${min.code.toLowerCase()}@nivara.gov.in`;

      // 3A. Minister Account
      let ministerUser = await User.findOne({ email });
      if (!ministerUser) {
        await User.create({
          fullName: `Hon'ble Minister (${min.code})`,
          name: `Hon'ble Minister (${min.code})`,
          email,
          officialEmail: email,
          phone: '+91 11 2301 1111',
          mobileNumber: '+91 11 2301 1111',
          designation: 'Union Cabinet Minister / Principal Secretary',
          department: `${min.name} - Apex Office`,
          employeeId: `MIN-${min.code}`,
          role: 'MINISTRY_OFFICER',
          ministryId: minDoc._id,
          password: defaultPassword,
          passwordHash: defaultPassword,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      }

      // 3B. Ministry Joint Secretary / Admin Account
      let minAdminUser = await User.findOne({ email: adminEmail });
      if (!minAdminUser) {
        await User.create({
          fullName: `Joint Secretary (${min.code})`,
          name: `Joint Secretary (${min.code})`,
          email: adminEmail,
          officialEmail: adminEmail,
          phone: '+91 11 2301 2222',
          mobileNumber: '+91 11 2301 2222',
          designation: 'Joint Secretary & Monitoring Head',
          department: `${min.name} - Project Monitoring Division`,
          employeeId: `JS-${min.code}`,
          role: 'MINISTRY_ADMIN',
          ministryId: minDoc._id,
          password: defaultPassword,
          passwordHash: defaultPassword,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      }
    }

    // 4. Create / Sync Agency Officer Accounts for each Agency
    console.log('👤 Creating Agency Officer Accounts for all Executing Agencies...');
    for (const ag of MASTER_AGENCIES) {
      const agDoc = agencyMap.get(ag.code);
      const minDoc = ministryMap.get(ag.minCode);
      if (!agDoc || !minDoc) continue;

      const email = `officer.${ag.code.toLowerCase()}@nivara.gov.in`;
      let agencyUser = await User.findOne({ email });
      if (!agencyUser) {
        await User.create({
          fullName: `Director General (${ag.code})`,
          name: `Director General (${ag.code})`,
          email,
          officialEmail: email,
          phone: '+91 11 2400 3333',
          mobileNumber: '+91 11 2400 3333',
          designation: `Head of Infrastructure / Managing Director (${ag.code})`,
          department: `${ag.name} - Projects Executive Board`,
          employeeId: `AGY-${ag.code}`,
          role: 'IMPLEMENTATION_AGENCY',
          agencyId: agDoc._id,
          ministryId: minDoc._id,
          password: defaultPassword,
          passwordHash: defaultPassword,
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true
        });
      }
    }

    console.log('🔗 Cross-referencing and updating projects with correct ministryId and implementationAgencyId...');
    // Quick scan to connect any unlinked project to proper agency and ministry
    const allProjects = await Project.find({}, 'projectName projectCode sector ministryId implementationAgencyId').lean();
    let updatedCount = 0;
    
    for (const p of allProjects) {
      const name = p.projectName || '';
      let matchedAgCode = null;
      let matchedMinCode = null;

      for (const ag of MASTER_AGENCIES) {
        const regex = new RegExp(`\\b${ag.code}\\b|${ag.name}`, 'i');
        if (regex.test(name)) {
          matchedAgCode = ag.code;
          matchedMinCode = ag.minCode;
          break;
        }
      }

      if (!matchedMinCode) {
        if (/road|highway|nh-/i.test(name)) { matchedMinCode = 'MORTH'; matchedAgCode = 'NHAI'; }
        else if (/rail|freight|train/i.test(name)) { matchedMinCode = 'MOR'; matchedAgCode = 'RVNL'; }
        else if (/power|grid|thermal|solar/i.test(name)) { matchedMinCode = 'MOP'; matchedAgCode = 'PGCIL'; }
        else if (/petroleum|gas|oil/i.test(name)) { matchedMinCode = 'MOPNG'; matchedAgCode = 'IOCL'; }
        else if (/metro|urban/i.test(name)) { matchedMinCode = 'MOHUA'; matchedAgCode = 'DMRC'; }
        else if (/port|berth|waterway/i.test(name)) { matchedMinCode = 'MOPSW'; matchedAgCode = 'IWAI'; }
        else if (/airport|aviation/i.test(name)) { matchedMinCode = 'MOCA'; matchedAgCode = 'AAI'; }
        else if (/coal/i.test(name)) { matchedMinCode = 'COAL'; matchedAgCode = 'CIL'; }
      }

      if (matchedMinCode) {
        const minDoc = ministryMap.get(matchedMinCode);
        const agDoc = matchedAgCode ? agencyMap.get(matchedAgCode) : null;

        const updateFields = {};
        if (minDoc && (!p.ministryId || p.ministryId.toString() !== minDoc._id.toString())) {
          updateFields.ministryId = minDoc._id;
          updateFields.lineMinistryId = minDoc._id;
        }
        if (agDoc && (!p.implementationAgencyId || p.implementationAgencyId.toString() !== agDoc._id.toString())) {
          updateFields.implementationAgencyId = agDoc._id;
          updateFields.implementingAgencyId = agDoc._id;
        }

        if (Object.keys(updateFields).length > 0) {
          await Project.updateOne({ _id: p._id }, { $set: updateFields });
          updatedCount++;
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} projects with precise Ministry & Agency linkages.`);

    console.log('\n===============================================================');
    console.log('🎉 MINISTRIES, AGENCIES & MINISTERIAL ACCOUNTS SYNCHRONIZED!');
    console.log('===============================================================');
    console.log(`✅ Total Line Ministries:        ${await Ministry.countDocuments()}`);
    console.log(`✅ Total Executing Agencies:     ${await ImplementationAgency.countDocuments()}`);
    console.log(`✅ Total Ministerial Accounts:   ${await User.countDocuments({ role: { $in: ['MINISTRY_OFFICER', 'MINISTRY_ADMIN'] } })}`);
    console.log(`✅ Total Agency Officer Accounts: ${await User.countDocuments({ role: { $in: ['IMPLEMENTATION_AGENCY', 'AGENCY_ADMIN', 'NODAL_OFFICER'] } })}`);
    console.log('===============================================================');

  } catch (err) {
    console.error('❌ Error synchronizing Ministries and Agencies:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedMinistriesAndAgencies();
