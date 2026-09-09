import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Ministry } from '../src/models/Ministry.js';
import { ImplementationAgency } from '../src/models/ImplementationAgency.js';
import { Project } from '../src/models/Project.js';
import { MonthlyReport } from '../src/models/MonthlyReport.js';
import { LandDetail } from '../src/models/LandDetail.js';
import { Clearance } from '../src/models/Clearance.js';
import { Tender } from '../src/models/Tender.js';
import { Milestone } from '../src/models/Milestone.js';
import { Partner } from '../src/models/Partner.js';
import { ProjectDocument } from '../src/models/ProjectDocument.js';
import { Alert } from '../src/models/Alert.js';
import { Notification } from '../src/models/Notification.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { hashPassword } from '../src/utils/password.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting NIVARA SIH Comprehensive Database Seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Ministry.deleteMany({}),
      ImplementationAgency.deleteMany({}),
      Project.deleteMany({}),
      MonthlyReport.deleteMany({}),
      LandDetail.deleteMany({}),
      Clearance.deleteMany({}),
      Tender.deleteMany({}),
      Milestone.deleteMany({}),
      Partner.deleteMany({}),
      ProjectDocument.deleteMany({}),
      Alert.deleteMany({}),
      Notification.deleteMany({}),
      RefreshToken.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    const defaultPasswordHash = await hashPassword('Admin@12345');
    const officerPasswordHash = await hashPassword('Officer@12345');

    // 1. Super Admin
    console.log('👤 Seeding Super Admin & IPMD Admins...');
    const superAdmin = await User.create({
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

    // 2. IPMD Admins (2)
    const ipmdAdmin1 = await User.create({
      name: 'Dr. Rajesh Sharma',
      fullName: 'Dr. Rajesh Sharma',
      email: 'ipmd.admin@nivara.gov.in',
      officialEmail: 'ipmd.admin@nivara.gov.in',
      phone: '+919999900002',
      mobileNumber: '+919999900002',
      designation: 'Director General - IPMD',
      employeeId: 'IPMD-DG-001',
      department: 'Infrastructure Project Monitoring Division',
      role: 'IPMD_ADMIN',
      password: defaultPasswordHash,
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    const ipmdAdmin2 = await User.create({
      name: 'Smt. Ananya Desai',
      fullName: 'Smt. Ananya Desai',
      email: 'ipmd.director@nivara.gov.in',
      officialEmail: 'ipmd.director@nivara.gov.in',
      phone: '+919999900003',
      mobileNumber: '+919999900003',
      designation: 'Joint Director - IPMD Risk Analytics',
      employeeId: 'IPMD-JD-002',
      department: 'Infrastructure Project Monitoring Division',
      role: 'IPMD_ADMIN',
      password: defaultPasswordHash,
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    // 3. Ministries (3)
    console.log('🏛️ Seeding Line Ministries...');
    const morth = await Ministry.create({
      name: 'Ministry of Road Transport and Highways',
      code: 'MORTH',
      description: 'Central ministry overseeing national highway and expressway infrastructure development.'
    });

    const mor = await Ministry.create({
      name: 'Ministry of Railways',
      code: 'MOR',
      description: 'Apex ministry governing railway networks, dedicated freight corridors, and high-speed rail.'
    });

    const mop = await Ministry.create({
      name: 'Ministry of Power',
      code: 'MOP',
      description: 'Union ministry responsible for power generation, ultra-mega solar parks, and national grid transmission.'
    });

    // Mirror to Organization model for backward compatibility
    const orgMorth = await Organization.create({
      name: morth.name,
      code: morth.code,
      type: 'MINISTRY',
      officialEmail: 'contact@morth.gov.in',
      phone: '+911123714938',
      address: 'Transport Bhawan, New Delhi'
    });

    // 4. Ministry Officers (5)
    console.log('👤 Seeding Ministry Officers...');
    const minOfficer1 = await User.create({
      name: 'Shri Vikram Malhotra',
      fullName: 'Shri Vikram Malhotra',
      email: 'ministry.admin@morth.gov.in',
      officialEmail: 'ministry.admin@morth.gov.in',
      phone: '+919811100001',
      mobileNumber: '+919811100001',
      designation: 'Joint Secretary (Highways)',
      employeeId: 'MORTH-JS-01',
      department: 'National Highways Division',
      role: 'MINISTRY_OFFICER',
      ministryId: morth._id,
      organizationId: orgMorth._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    const minOfficer2 = await User.create({
      name: 'Dr. Ramesh Chandra',
      fullName: 'Dr. Ramesh Chandra',
      email: 'ramesh.morth@gov.in',
      officialEmail: 'ramesh.morth@gov.in',
      phone: '+919811100002',
      mobileNumber: '+919811100002',
      designation: 'Director (Monitoring)',
      employeeId: 'MORTH-DIR-02',
      department: 'Planning & Monitoring',
      role: 'MINISTRY_OFFICER',
      ministryId: morth._id,
      organizationId: orgMorth._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    const minOfficer3 = await User.create({
      name: 'Smt. Kavita Sengupta',
      fullName: 'Smt. Kavita Sengupta',
      email: 'kavita.mor@gov.in',
      officialEmail: 'kavita.mor@gov.in',
      phone: '+919811100003',
      mobileNumber: '+919811100003',
      designation: 'Principal Executive Director',
      employeeId: 'MOR-PED-01',
      department: 'Railway Board',
      role: 'MINISTRY_OFFICER',
      ministryId: mor._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    const minOfficer4 = await User.create({
      name: 'Shri Arvind Joshi',
      fullName: 'Shri Arvind Joshi',
      email: 'arvind.mor@gov.in',
      officialEmail: 'arvind.mor@gov.in',
      phone: '+919811100004',
      mobileNumber: '+919811100004',
      designation: 'Director (Projects)',
      employeeId: 'MOR-DIR-03',
      department: 'Infrastructure & Freight',
      role: 'MINISTRY_OFFICER',
      ministryId: mor._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    const minOfficer5 = await User.create({
      name: 'Dr. Meenakshi Rao',
      fullName: 'Dr. Meenakshi Rao',
      email: 'meenakshi.mop@gov.in',
      officialEmail: 'meenakshi.mop@gov.in',
      phone: '+919811100005',
      mobileNumber: '+919811100005',
      designation: 'Joint Secretary (Thermal & Renewable)',
      employeeId: 'MOP-JS-01',
      department: 'Power Infrastructure Division',
      role: 'MINISTRY_OFFICER',
      ministryId: mop._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    // 5. Implementation Agencies (5)
    console.log('🏢 Seeding Implementation Agencies...');
    const nhai = await ImplementationAgency.create({
      name: 'National Highways Authority of India',
      agencyCode: 'NHAI',
      organizationType: 'PSU',
      ministryId: morth._id,
      state: 'New Delhi',
      department: 'Civil Infrastructure',
      contactPerson: 'Member (Projects) NHAI',
      email: 'agency.admin@nhai.gov.in',
      phone: '+911125074100'
    });

    const nhidcl = await ImplementationAgency.create({
      name: 'National Highways & Infrastructure Development Corporation Ltd',
      agencyCode: 'NHIDCL',
      organizationType: 'PSU',
      ministryId: morth._id,
      state: 'New Delhi',
      department: 'Hill & Border Corridors',
      contactPerson: 'Director (Technical) NHIDCL',
      email: 'contact@nhidcl.gov.in',
      phone: '+911123461600'
    });

    const rvnl = await ImplementationAgency.create({
      name: 'Rail Vikas Nigam Limited',
      agencyCode: 'RVNL',
      organizationType: 'PSU',
      ministryId: mor._id,
      state: 'New Delhi',
      department: 'Major Rail Corridors',
      contactPerson: 'Director (Operations) RVNL',
      email: 'contact@rvnl.gov.in',
      phone: '+911126738299'
    });

    const ntpc = await ImplementationAgency.create({
      name: 'NTPC Limited',
      agencyCode: 'NTPC',
      organizationType: 'PSU',
      ministryId: mop._id,
      state: 'New Delhi',
      department: 'Renewable & Thermal Energy',
      contactPerson: 'Executive Director (Projects) NTPC',
      email: 'projects@ntpc.co.in',
      phone: '+911124360100'
    });

    const pgcil = await ImplementationAgency.create({
      name: 'Power Grid Corporation of India Limited',
      agencyCode: 'PGCIL',
      organizationType: 'PSU',
      ministryId: mop._id,
      state: 'Haryana',
      department: 'National Transmission Grid',
      contactPerson: 'Chief General Manager PGCIL',
      email: 'transmission@powergrid.in',
      phone: '+911242571700'
    });

    // Agency Users
    const agencyAdmin1 = await User.create({
      name: 'Shri Ajay Devgan (NHAI Admin)',
      fullName: 'Shri Ajay Devgan',
      email: 'agency.admin@nhai.gov.in',
      officialEmail: 'agency.admin@nhai.gov.in',
      phone: '+919822200001',
      mobileNumber: '+919822200001',
      designation: 'Chief General Manager (Coordination)',
      employeeId: 'NHAI-CGM-01',
      department: 'Project Implementation Unit',
      role: 'IMPLEMENTATION_AGENCY',
      agencyId: nhai._id,
      ministryId: morth._id,
      password: officerPasswordHash,
      passwordHash: officerPasswordHash,
      status: 'ACTIVE',
      isActive: true,
      emailVerified: true
    });

    // 6. Nodal Officers (10)
    console.log('👤 Seeding Nodal Officers...');
    const nodalOfficers = [];
    const nodalNames = [
      { name: 'Rajesh Kumar', email: 'nodal.officer@nhai.gov.in', agency: nhai, ministry: morth, desig: 'Project Director NHAI' },
      { name: 'Sanjay Deshmukh', email: 'sanjay.nodal@nhai.gov.in', agency: nhai, ministry: morth, desig: 'Regional Officer NHAI' },
      { name: 'Praveen Singhal', email: 'praveen.nodal@nhidcl.gov.in', agency: nhidcl, ministry: morth, desig: 'General Manager NHIDCL' },
      { name: 'Alok Mukherjee', email: 'alok.nodal@rvnl.gov.in', agency: rvnl, ministry: mor, desig: 'Chief Project Manager RVNL' },
      { name: 'Birendra Prasad', email: 'birendra.nodal@rvnl.gov.in', agency: rvnl, ministry: mor, desig: 'General Manager RVNL' },
      { name: 'R. K. Srivastava', email: 'rk.nodal@ntpc.co.in', agency: ntpc, ministry: mop, desig: 'General Manager NTPC' },
      { name: 'Deepak Bhattacharya', email: 'deepak.nodal@ntpc.co.in', agency: ntpc, ministry: mop, desig: 'Chief Engineer NTPC' },
      { name: 'Sunil Gavaskar Roy', email: 'sunil.nodal@powergrid.in', agency: pgcil, ministry: mop, desig: 'Executive Director PGCIL' },
      { name: 'Naveen Jindal Sharma', email: 'naveen.nodal@nhai.gov.in', agency: nhai, ministry: morth, desig: 'Project Director NHAI' },
      { name: 'Pooja Hegde Reddy', email: 'pooja.nodal@rvnl.gov.in', agency: rvnl, ministry: mor, desig: 'Senior Project Manager RVNL' }
    ];

    for (let i = 0; i < nodalNames.length; i++) {
      const n = nodalNames[i];
      const u = await User.create({
        name: n.name,
        fullName: n.name,
        email: n.email,
        officialEmail: n.email,
        phone: `+9198333${String(i).padStart(5, '0')}`,
        mobileNumber: `+9198333${String(i).padStart(5, '0')}`,
        designation: n.desig,
        employeeId: `NODAL-${100 + i}`,
        department: 'Project Monitoring Directorate',
        role: 'NODAL_OFFICER',
        agencyId: n.agency._id,
        ministryId: n.ministry._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      });
      nodalOfficers.push(u);
    }

    // 7. Reporting Officers (15)
    console.log('👤 Seeding Reporting Officers...');
    const reportingOfficers = [];
    const repNames = [
      'Anita Sharma', 'Rahul Das', 'Amit Singh', 'Priya Roy', 'Manoj Tiwari',
      'Geeta Phogat', 'Harish Rawat', 'Sneha Patil', 'Vikas Khanna', 'Tanmay Sen',
      'Pooja Nair', 'Rohan Mehra', 'Kiran Bedi', 'Anil Deshmukh', 'Farhan Akhtar'
    ];

    for (let i = 0; i < repNames.length; i++) {
      const email = i === 0 ? 'reporting.officer@nhai.gov.in' : `reporting.${i + 1}@nhai.gov.in`;
      const u = await User.create({
        name: repNames[i],
        fullName: repNames[i],
        email,
        officialEmail: email,
        phone: `+9198444${String(i).padStart(5, '0')}`,
        mobileNumber: `+9198444${String(i).padStart(5, '0')}`,
        designation: 'Resident Engineer / Reporting Officer',
        employeeId: `REP-${200 + i}`,
        department: 'Field Supervision & Progress Reporting',
        role: 'REPORTING_OFFICER',
        agencyId: nhai._id,
        ministryId: morth._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      });
      reportingOfficers.push(u);
    }

    // 8. Projects & CUF Sub-Components
    console.log('🏗️ Seeding National Infrastructure Projects...');

    // ----------------------------------------------------
    // PROJECT 1: Flagship SIH Demo Project
    // 4-Laning of NH-27, Bihar
    // Cost: ₹850 Cr, Exp: ₹790 Cr, Physical: 55%, Planned: 70%, Financial: ~92.94%
    // Mismatch: ~37.94%, Forest clearance delay -> High Risk Alert
    // ----------------------------------------------------
    const demoProject = await Project.create({
      projectName: '4-Laning of NH-27, Bihar',
      projectCode: 'NH27-BIH-04L',
      sector: 'ROAD',
      subSector: 'NATIONAL_HIGHWAY',
      projectType: 'INFRASTRUCTURE',
      projectScheme: 'BHARATMALA_PARIYOJANA',
      projectClassification: 'MAJOR',
      brownfieldOrGreenfield: 'BROWNFIELD',
      activeTenders: 2,
      pmGatiShaktiProject: true,
      projectLocation: 'Muzaffarpur to Purnea Corridor, Bihar',
      state: 'Bihar',
      district: 'Muzaffarpur',
      numberOfLocations: 4,
      locationType: 'CORRIDOR',
      projectStage: 'UNDER_CONSTRUCTION',
      modeOfImplementation: 'EPC',
      projectStatus: 'ONGOING',
      approvalDate: new Date('2024-01-10'),
      projectDuration: 48,
      projectStartDate: new Date('2024-04-01'),
      originalCompletionDate: new Date('2028-03-31'),
      revisedCompletionDate: new Date('2028-12-31'),
      estimatedProjectIRR: 14.5,
      estimatedEconomicIRR: 18.2,
      projectDescription: 'Four laning of East-West National Highway corridor connecting key agricultural and trade hubs in Bihar.',
      ministryId: morth._id,
      implementationAgencyId: nhai._id,
      nodalOfficer: nodalOfficers[0]._id,
      reportingOfficers: [reportingOfficers[0]._id, reportingOfficers[1]._id, reportingOfficers[2]._id],
      createdBy: agencyAdmin1._id,
      originalProjectCost: 850,
      revisedProjectCost: 850,
      baseFinancialYear: '2024-25',
      isTotalCostInclusiveLand: true,
      landCost: 120,
      totalCapitalOutlay: 850,
      totalActualExpenditure: 790,
      expenditure: 790,
      centralSupport: 850,
      financialProgress: 92.94,
      physicalProgress: 55,
      plannedPhysicalProgress: 70,
      plannedFinancialProgress: 75,
      riskScore: 78,
      riskLevel: 'HIGH',
      latestReportDate: new Date('2026-08-31')
    });

    // Sub-components for Demo Project
    await LandDetail.create({
      projectId: demoProject._id,
      landRequired: true,
      landArea: 142.5,
      areaUnit: 'HECTARES',
      fullyAcquired: false,
      remainingLandPercentage: 18,
      likelyAcquisitionDate: new Date('2026-11-30'),
      rightOfWayApplicable: true,
      rightOfWayAvailability: 82,
      scheduledStartDate: new Date('2024-04-01'),
      actualStartDate: new Date('2024-04-15'),
      remarks: '18% ROW pending near bypass section due to forest boundary demarcation.'
    });

    await Clearance.create([
      {
        projectId: demoProject._id,
        clearanceType: 'FOREST',
        status: 'PENDING',
        requiredDate: new Date('2024-06-30'),
        pendingReason: 'Stage-II Forest Clearance pending from State Forest Department for 24-km stretch.',
        authorityName: 'MoEF&CC / Bihar State Forest Dept',
        remarks: 'Compensatory afforestation proposal submitted, awaiting final nod.'
      },
      {
        projectId: demoProject._id,
        clearanceType: 'ENVIRONMENTAL',
        status: 'APPROVED',
        approvalDate: new Date('2023-11-15'),
        authorityName: 'SEIAA Bihar'
      },
      {
        projectId: demoProject._id,
        clearanceType: 'RAILWAY',
        status: 'APPROVED',
        approvalDate: new Date('2024-02-20'),
        authorityName: 'East Central Railway (ECR)'
      }
    ]);

    await Tender.create([
      {
        projectId: demoProject._id,
        tenderName: 'Package 1 - Civil Construction Km 0.00 to 45.00',
        tenderType: 'OPEN',
        tenderStatus: 'AWARDED',
        tenderNoticeNumber: 'NHAI/BH/NH27/PKG1/2024',
        estimatedValue: 450,
        awardedValue: 432,
        awardedVendor: 'L&T Infrastructure Engineering Ltd',
        tenderAwardDate: new Date('2024-03-15')
      },
      {
        projectId: demoProject._id,
        tenderName: 'Package 2 - Structures & Bridges Km 45.00 to 90.00',
        tenderType: 'OPEN',
        tenderStatus: 'AWARDED',
        tenderNoticeNumber: 'NHAI/BH/NH27/PKG2/2024',
        estimatedValue: 400,
        awardedValue: 395,
        awardedVendor: 'Dilip Buildcon Ltd',
        tenderAwardDate: new Date('2024-03-20')
      }
    ]);

    await Milestone.create([
      {
        projectId: demoProject._id,
        milestoneName: 'DPR & Feasibility Study',
        milestoneType: 'DPR_FEASIBILITY',
        originalStartDate: new Date('2023-06-01'),
        actualStartDate: new Date('2023-06-01'),
        originalFinishDate: new Date('2023-12-31'),
        actualFinishDate: new Date('2023-12-15'),
        status: 'COMPLETED',
        physicalProgressPercentage: 100
      },
      {
        projectId: demoProject._id,
        milestoneName: 'Main Carriageway Earthwork & Pavement',
        milestoneType: 'CONSTRUCTION',
        originalStartDate: new Date('2024-04-01'),
        actualStartDate: new Date('2024-04-15'),
        originalFinishDate: new Date('2027-10-31'),
        status: 'IN_PROGRESS',
        physicalProgressPercentage: 55,
        remarks: 'Slowed down by delayed forest clearance in Package-2.'
      }
    ]);

    await Partner.create({
      projectId: demoProject._id,
      partnerType: 'CONTRACTOR',
      partnerName: 'Larsen & Toubro Civil Infra',
      contactPerson: 'Mr. R. K. Mittal',
      email: 'rk.mittal@lntecc.com',
      phone: '+919811998877'
    });

    // Historical Monthly Reports for Demo Project
    const demoReports = [
      {
        month: '2026-05',
        exp: 620,
        actFin: 72.94,
        planFin: 65.0,
        actPhy: 48,
        planPhy: 55,
        delayDays: 30,
        reason: 'Monsoon showers and localized utility shifting delays.',
        autoReason: 'UTILITY_SHIFTING',
        conf: 0.85
      },
      {
        month: '2026-06',
        exp: 680,
        actFin: 80.0,
        planFin: 68.0,
        actPhy: 50,
        planPhy: 60,
        delayDays: 45,
        reason: 'Forest boundary dispute pending with DFO office.',
        autoReason: 'FOREST_CLEARANCE',
        conf: 0.92
      },
      {
        month: '2026-07',
        exp: 730,
        actFin: 85.88,
        planFin: 71.0,
        actPhy: 52,
        planPhy: 65,
        delayDays: 60,
        reason: 'Forest clearance pending from state forest department.',
        autoReason: 'FOREST_CLEARANCE',
        conf: 0.95
      },
      {
        month: '2026-08',
        exp: 790,
        actFin: 92.94,
        planFin: 75.0,
        actPhy: 55,
        planPhy: 70,
        delayDays: 75,
        reason: 'Forest clearance pending from state forest department.',
        autoReason: 'FOREST_CLEARANCE',
        conf: 0.98
      }
    ];

    for (const r of demoReports) {
      await MonthlyReport.create({
        projectId: demoProject._id,
        reportingMonth: r.month,
        plannedFinancialProgress: r.planFin,
        actualFinancialProgress: r.actFin,
        plannedPhysicalProgress: r.planPhy,
        actualPhysicalProgress: r.actPhy,
        expenditure: r.exp,
        delayDays: r.delayDays,
        delayReasonText: r.reason,
        autoDetectedDelayReason: r.autoReason,
        delayConfidence: r.conf,
        matchedKeywords: ['forest', 'clearance'],
        mismatchDetected: true,
        mismatchDifference: Math.round((r.actFin - r.actPhy) * 100) / 100,
        mismatchSeverity: 'HIGH',
        calculatedRiskScore: 78,
        calculatedRiskLevel: 'HIGH',
        remarks: r.reason,
        submittedBy: reportingOfficers[0]._id,
        submittedAt: new Date(`${r.month}-28`)
      });
    }

    // Alerts for Demo Project
    const demoAlert = await Alert.create({
      projectId: demoProject._id,
      alertType: 'FUND_PROGRESS_MISMATCH',
      severity: 'HIGH',
      title: 'Fund vs Physical Progress Discrepancy (37.94%)',
      message: 'Significant fund-progress mismatch detected. Financial expenditure (92.94%) outpaces physical progress (55%) by 37.94%. On-site physical verification and audit review recommended.',
      riskScore: 78,
      assignedTo: nodalOfficers[0]._id,
      status: 'ACTIVE'
    });

    await Notification.create({
      userId: nodalOfficers[0]._id,
      projectId: demoProject._id,
      alertId: demoAlert._id,
      title: 'Fund vs Progress Mismatch Alert',
      message: 'Financial expenditure (92.94%) leads physical progress (55%) by 37.94% on NH-27 Bihar.',
      type: 'ALERT',
      severity: 'HIGH'
    });

    // ----------------------------------------------------
    // Additional Projects (9 More Realistic Projects across Sectors)
    // ----------------------------------------------------
    const otherProjectsConfig = [
      {
        name: 'Western Dedicated Freight Corridor (Dadri-JNPT)',
        code: 'DFCCIL-WDFC-01',
        sector: 'RAILWAYS',
        subSector: 'FREIGHT_CORRIDOR',
        state: 'Maharashtra',
        cost: 51100,
        exp: 47200,
        actPhy: 91,
        planPhy: 95,
        riskScore: 28,
        riskLevel: 'LOW',
        agency: rvnl,
        ministry: mor,
        nodal: nodalOfficers[3],
        status: 'ONGOING'
      },
      {
        name: 'Rampur Ultra Mega Solar Park 1000MW',
        code: 'NTPC-UMSP-RAMPUR',
        sector: 'POWER',
        subSector: 'SOLAR_ENERGY',
        state: 'Uttar Pradesh',
        cost: 4200,
        exp: 3600,
        actPhy: 72,
        planPhy: 80,
        riskScore: 42,
        riskLevel: 'MEDIUM',
        agency: ntpc,
        ministry: mop,
        nodal: nodalOfficers[5],
        status: 'ONGOING'
      },
      {
        name: 'Arunachal Frontier Highway Corridor',
        code: 'NHIDCL-ARUN-FRONTIER',
        sector: 'ROAD',
        subSector: 'BORDER_HIGHWAY',
        state: 'Arunachal Pradesh',
        cost: 27000,
        exp: 11200,
        actPhy: 32,
        planPhy: 60,
        riskScore: 84,
        riskLevel: 'CRITICAL',
        agency: nhidcl,
        ministry: morth,
        nodal: nodalOfficers[2],
        status: 'ONGOING'
      },
      {
        name: 'Green Energy Transmission Corridor Phase-II',
        code: 'PGCIL-GEC-PH2',
        sector: 'POWER',
        subSector: 'TRANSMISSION',
        state: 'Gujarat',
        cost: 12000,
        exp: 9800,
        actPhy: 78,
        planPhy: 82,
        riskScore: 22,
        riskLevel: 'LOW',
        agency: pgcil,
        ministry: mop,
        nodal: nodalOfficers[7],
        status: 'ONGOING'
      },
      {
        name: 'Mumbai-Ahmedabad High-Speed Rail Spoke Line',
        code: 'NHSRCL-MAHSR-SPOKE',
        sector: 'RAILWAYS',
        subSector: 'HIGH_SPEED_RAIL',
        state: 'Gujarat',
        cost: 18500,
        exp: 15200,
        actPhy: 68,
        planPhy: 75,
        riskScore: 48,
        riskLevel: 'MEDIUM',
        agency: rvnl,
        ministry: mor,
        nodal: nodalOfficers[4],
        status: 'ONGOING'
      },
      {
        name: 'Paradeep Port Deep Draft Berth & Mechanization',
        code: 'MORTH-PORT-PARADEEP',
        sector: 'SHIPPING_PORTS',
        subSector: 'PORT_BERTH',
        state: 'Odisha',
        cost: 3004,
        exp: 3004,
        actPhy: 100,
        planPhy: 100,
        riskScore: 5,
        riskLevel: 'LOW',
        agency: nhai,
        ministry: morth,
        nodal: nodalOfficers[1],
        status: 'COMPLETED'
      },
      {
        name: 'Kolkata East-West Metro Extension (Howrah to Salt Lake)',
        code: 'KMRC-EWM-EXT',
        sector: 'URBAN_DEVELOPMENT',
        subSector: 'METRO_RAIL',
        state: 'West Bengal',
        cost: 8575,
        exp: 8200,
        actPhy: 88,
        planPhy: 92,
        riskScore: 35,
        riskLevel: 'MEDIUM',
        agency: rvnl,
        ministry: mor,
        nodal: nodalOfficers[9],
        status: 'ONGOING'
      },
      {
        name: 'Dibrugarh Brahmaputra Road-Bridge Superstructure',
        code: 'NHIDCL-DIBRU-BRG',
        sector: 'ROAD',
        subSector: 'MAJOR_BRIDGE',
        state: 'Assam',
        cost: 2150,
        exp: 1890,
        actPhy: 62,
        planPhy: 85,
        riskScore: 82,
        riskLevel: 'CRITICAL',
        agency: nhidcl,
        ministry: morth,
        nodal: nodalOfficers[2],
        status: 'ONGOING'
      },
      {
        name: 'Chenab River Hydro-Electric Power Station 850MW',
        code: 'NHPC-CHENAB-HYDRO',
        sector: 'POWER',
        subSector: 'HYDRO_POWER',
        state: 'Jammu & Kashmir',
        cost: 5280,
        exp: 2400,
        actPhy: 40,
        planPhy: 50,
        riskScore: 58,
        riskLevel: 'MEDIUM',
        agency: ntpc,
        ministry: mop,
        nodal: nodalOfficers[6],
        status: 'ONGOING'
      }
    ];

    for (let i = 0; i < otherProjectsConfig.length; i++) {
      const cfg = otherProjectsConfig[i];
      const finProg = Math.round((cfg.exp / cfg.cost) * 10000) / 100;

      const p = await Project.create({
        projectName: cfg.name,
        projectCode: cfg.code,
        sector: cfg.sector,
        subSector: cfg.subSector,
        projectType: 'INFRASTRUCTURE',
        state: cfg.state,
        originalProjectCost: cfg.cost,
        revisedProjectCost: cfg.cost,
        expenditure: cfg.exp,
        totalActualExpenditure: cfg.exp,
        financialProgress: finProg,
        physicalProgress: cfg.actPhy,
        plannedPhysicalProgress: cfg.planPhy,
        plannedFinancialProgress: Math.min(100, finProg + 5),
        riskScore: cfg.riskScore,
        riskLevel: cfg.riskLevel,
        projectStatus: cfg.status,
        approvalDate: new Date('2023-01-01'),
        projectStartDate: new Date('2023-06-01'),
        originalCompletionDate: new Date('2027-12-31'),
        ministryId: cfg.ministry._id,
        implementationAgencyId: cfg.agency._id,
        nodalOfficer: cfg.nodal._id,
        reportingOfficers: [reportingOfficers[(i * 2) % reportingOfficers.length]._id, reportingOfficers[(i * 2 + 1) % reportingOfficers.length]._id],
        createdBy: agencyAdmin1._id,
        latestReportDate: new Date('2026-08-30')
      });

      // Land & Clearance records
      await LandDetail.create({
        projectId: p._id,
        landRequired: true,
        landArea: 100 + i * 25,
        fullyAcquired: cfg.actPhy > 80,
        remainingLandPercentage: cfg.actPhy > 80 ? 0 : Math.max(5, 30 - i * 3)
      });

      await Clearance.create({
        projectId: p._id,
        clearanceType: i % 2 === 0 ? 'ENVIRONMENTAL' : 'FOREST',
        status: cfg.riskLevel === 'CRITICAL' ? 'PENDING' : 'APPROVED',
        pendingReason: cfg.riskLevel === 'CRITICAL' ? 'Environmental hearing delayed by local stakeholder consultations.' : ''
      });

      // Add sample monthly report
      await MonthlyReport.create({
        projectId: p._id,
        reportingMonth: '2026-08',
        plannedFinancialProgress: Math.min(100, finProg + 5),
        actualFinancialProgress: finProg,
        plannedPhysicalProgress: cfg.planPhy,
        actualPhysicalProgress: cfg.actPhy,
        expenditure: cfg.exp,
        delayDays: cfg.riskScore > 60 ? 90 : 15,
        delayReasonText: cfg.riskScore > 60 ? 'Land acquisition and contractor machinery mobilization bottlenecks.' : 'Progressing according to scheduled timeline.',
        autoDetectedDelayReason: cfg.riskScore > 60 ? 'LAND_ACQUISITION' : 'NONE',
        delayConfidence: 0.9,
        calculatedRiskScore: cfg.riskScore,
        calculatedRiskLevel: cfg.riskLevel,
        submittedBy: reportingOfficers[0]._id
      });

      // Generate Alert if High/Critical
      if (['HIGH', 'CRITICAL'].includes(cfg.riskLevel)) {
        await Alert.create({
          projectId: p._id,
          alertType: cfg.riskLevel === 'CRITICAL' ? 'CRITICAL_RISK' : 'HIGH_RISK',
          severity: cfg.riskLevel,
          title: `${cfg.riskLevel} Project Risk (${cfg.riskScore}/100)`,
          message: `Escalated risk detected on ${cfg.name}. Monitoring review recommended.`,
          riskScore: cfg.riskScore,
          assignedTo: cfg.nodal._id,
          status: 'ACTIVE'
        });
      }
    }

    console.log('✅ Database seeded successfully with:');
    console.log('   - 1 Super Admin, 2 IPMD Admins');
    console.log('   - 3 Ministries (MoRTH, MoR, MoP)');
    console.log('   - 5 Ministry Officers');
    console.log('   - 5 Implementation Agencies (NHAI, RVNL, NTPC, NHIDCL, PGCIL)');
    console.log('   - 10 Nodal Officers, 15 Reporting Officers');
    console.log('   - 10 Detailed National Projects including Flagship Demo: "4-Laning of NH-27, Bihar"');
    console.log('   - Historical monthly reports, clearances, land records, tenders, milestones, and alerts.');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
