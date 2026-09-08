import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Project } from '../src/models/Project.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { hashPassword } from '../src/utils/password.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting NIVARA Database Seeding...');
    await connectDB();

    // Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Project.deleteMany({}),
      RefreshToken.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Create IPMD Admin
    console.log('👤 Seeding IPMD Admin...');
    const ipmdPasswordHash = await hashPassword('Admin@12345');
    const ipmdAdmin = await User.create({
      fullName: 'Dr. Rajesh Sharma',
      officialEmail: 'ipmd.admin@nivara.local',
      mobileNumber: '+919876543210',
      designation: 'Director General - IPMD',
      employeeId: 'IPMD-DG-001',
      department: 'Infrastructure Project Monitoring Division',
      role: 'IPMD_ADMIN',
      organizationId: null,
      passwordHash: ipmdPasswordHash,
      status: 'ACTIVE',
      emailVerified: true
    });

    // 2. Create Ministry
    console.log('🏛️  Seeding Line Ministry...');
    const ministry = await Organization.create({
      name: 'Ministry of Road Transport & Highways',
      code: 'MORTH',
      type: 'MINISTRY',
      parentOrganizationId: null,
      officialEmail: 'contact@morth.gov.in',
      phone: '+911123714938',
      address: 'Transport Bhawan, 1, Parliament Street, New Delhi - 110001',
      status: 'ACTIVE',
      createdBy: ipmdAdmin._id
    });

    // 3. Create Ministry Admin
    console.log('👤 Seeding Ministry Admin...');
    const ministryPasswordHash = await hashPassword('Ministry@12345');
    const ministryAdmin = await User.create({
      fullName: 'Smt. Sunita Verma',
      officialEmail: 'ministry.admin@morth.gov.in',
      mobileNumber: '+919876543211',
      designation: 'Joint Secretary (Highways)',
      employeeId: 'MORTH-JS-012',
      department: 'Highways Division',
      organizationId: ministry._id,
      role: 'MINISTRY_ADMIN',
      passwordHash: ministryPasswordHash,
      status: 'ACTIVE',
      emailVerified: true,
      createdBy: ipmdAdmin._id
    });

    // 4. Create Implementing Agency
    console.log('🏢 Seeding Implementing Agency...');
    const agency = await Organization.create({
      name: 'National Highways Authority of India',
      code: 'NHAI',
      type: 'IMPLEMENTING_AGENCY',
      parentOrganizationId: ministry._id,
      officialEmail: 'info@nhai.gov.in',
      phone: '+911125074100',
      address: 'G 5 & 6, Sector-10, Dwarka, New Delhi - 110075',
      status: 'ACTIVE',
      createdBy: ministryAdmin._id
    });

    // 5. Create Agency Admin
    console.log('👤 Seeding Agency Admin...');
    const agencyPasswordHash = await hashPassword('Agency@12345');
    const agencyAdmin = await User.create({
      fullName: 'Shri Amit Kumar',
      officialEmail: 'agency.admin@nhai.gov.in',
      mobileNumber: '+919876543212',
      designation: 'Chief General Manager (Technical)',
      employeeId: 'NHAI-CGM-105',
      department: 'Technical Projects Division',
      organizationId: agency._id,
      role: 'AGENCY_ADMIN',
      passwordHash: agencyPasswordHash,
      status: 'ACTIVE',
      emailVerified: true,
      createdBy: ministryAdmin._id
    });

    // 6. Create Reporting Officer & Nodal Officer
    console.log('👤 Seeding Reporting & Nodal Officers...');
    const reportingPasswordHash = await hashPassword('Reporting@12345');
    const reportingOfficer = await User.create({
      fullName: 'Vikas Mehra',
      officialEmail: 'reporting.officer@nhai.gov.in',
      mobileNumber: '+919876543213',
      designation: 'Resident Engineer',
      employeeId: 'NHAI-RE-404',
      department: 'Field Supervision',
      organizationId: agency._id,
      role: 'REPORTING_OFFICER',
      passwordHash: reportingPasswordHash,
      status: 'ACTIVE',
      emailVerified: true,
      createdBy: agencyAdmin._id
    });

    const nodalPasswordHash = await hashPassword('Nodal@12345');
    const nodalOfficer = await User.create({
      fullName: 'Priya Nair',
      officialEmail: 'nodal.officer@nhai.gov.in',
      mobileNumber: '+919876543214',
      designation: 'Project Director',
      employeeId: 'NHAI-PD-208',
      department: 'Project Implementation Unit',
      organizationId: agency._id,
      role: 'NODAL_OFFICER',
      passwordHash: nodalPasswordHash,
      status: 'ACTIVE',
      emailVerified: true,
      createdBy: agencyAdmin._id
    });

    // 7. Create Sample Infrastructure Project
    console.log('🏗️  Seeding Sample Project...');
    const project = await Project.create({
      projectName: 'Delhi-Mumbai Expressway Package 1 (Sohna to KMP)',
      projectCode: 'DME-PKG-01',
      description: '8-lane access controlled greenfield expressway stretch',
      lineMinistryId: ministry._id,
      implementingAgencyId: agency._id,
      reportingOfficerId: reportingOfficer._id,
      nodalOfficerId: nodalOfficer._id,
      budgetEstimatedInCrores: 3450.5,
      status: 'IN_PROGRESS',
      createdBy: agencyAdmin._id
    });

    // Assign project to officers
    reportingOfficer.projectIds = [project._id];
    await reportingOfficer.save();

    nodalOfficer.projectIds = [project._id];
    await nodalOfficer.save();

    console.log('\n================================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log('⚠️  DEVELOPMENT CREDENTIALS (DO NOT USE IN PRODUCTION):');
    console.log('----------------------------------------------------------------');
    console.log('1. IPMD Admin:');
    console.log('   Email   : ipmd.admin@nivara.local');
    console.log('   Password: Admin@12345');
    console.log('   Role    : IPMD_ADMIN');
    console.log('----------------------------------------------------------------');
    console.log('2. Ministry Admin (MoRTH):');
    console.log('   Email   : ministry.admin@morth.gov.in');
    console.log('   Password: Ministry@12345');
    console.log('   Role    : MINISTRY_ADMIN');
    console.log('----------------------------------------------------------------');
    console.log('3. Agency Admin (NHAI):');
    console.log('   Email   : agency.admin@nhai.gov.in');
    console.log('   Password: Agency@12345');
    console.log('   Role    : AGENCY_ADMIN');
    console.log('----------------------------------------------------------------');
    console.log('4. Nodal Officer (NHAI):');
    console.log('   Email   : nodal.officer@nhai.gov.in');
    console.log('   Password: Nodal@12345');
    console.log('   Role    : NODAL_OFFICER');
    console.log('----------------------------------------------------------------');
    console.log('5. Reporting Officer (NHAI):');
    console.log('   Email   : reporting.officer@nhai.gov.in');
    console.log('   Password: Reporting@12345');
    console.log('   Role    : REPORTING_OFFICER');
    console.log('================================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();
