import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Ministry } from '../src/models/Ministry.js';
import { ImplementationAgency } from '../src/models/ImplementationAgency.js';
import { Project } from '../src/models/Project.js';
import { Alert } from '../src/models/Alert.js';
import { Notification } from '../src/models/Notification.js';
import { MonthlyReport } from '../src/models/MonthlyReport.js';
import { hashPassword } from '../src/utils/password.js';

async function setupTriad() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();

    console.log('🔑 Preparing password hashes...');
    const adminPasswordHash = await hashPassword('Admin@12345');
    const officerPasswordHash = await hashPassword('Officer@12345');

    // 1. Line Ministry (MORTH)
    let ministry = await Ministry.findOne({ code: 'MORTH' });
    if (!ministry) {
      ministry = await Ministry.create({
        name: 'Ministry of Road Transport and Highways',
        code: 'MORTH',
        description: 'Central ministry overseeing national highway and expressway infrastructure.'
      });
      console.log('✅ Created Ministry: MORTH');
    }

    // 2. Implementation Agency (NHAI)
    let agency = await ImplementationAgency.findOne({ agencyCode: 'NHAI' });
    if (!agency) {
      agency = await ImplementationAgency.create({
        name: 'National Highways Authority of India',
        agencyCode: 'NHAI',
        organizationType: 'PSU',
        ministryId: ministry._id,
        state: 'New Delhi',
        department: 'Highway Projects Directorate',
        contactPerson: 'Member (Projects)',
        email: 'agency.admin@nhai.gov.in',
        phone: '+911125074100'
      });
      console.log('✅ Created Agency: NHAI');
    }

    // 3. Upsert Super Admin
    const superAdmin = await User.findOneAndUpdate(
      { email: 'super.admin@nivara.gov.in' },
      {
        name: 'Central Super Admin',
        fullName: 'Central Super Admin',
        email: 'super.admin@nivara.gov.in',
        officialEmail: 'super.admin@nivara.gov.in',
        designation: 'Principal Secretary & Super Admin',
        employeeId: 'NIVARA-SA-01',
        department: 'Cabinet Secretariat / IPMD',
        role: 'SUPER_ADMIN',
        password: adminPasswordHash,
        passwordHash: adminPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Synced Super Admin:', superAdmin.email);

    // 4. Upsert Ministry Officer
    const ministryOfficer = await User.findOneAndUpdate(
      { email: 'ministry.admin@morth.gov.in' },
      {
        name: 'Shri Vikram Malhotra',
        fullName: 'Shri Vikram Malhotra',
        email: 'ministry.admin@morth.gov.in',
        officialEmail: 'ministry.admin@morth.gov.in',
        designation: 'Joint Secretary (Highways)',
        employeeId: 'MORTH-JS-01',
        department: 'National Highways Division',
        role: 'MINISTRY_OFFICER',
        ministryId: ministry._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Synced Ministry Officer:', ministryOfficer.email);

    // 5. Upsert Agency Officer (Account 1)
    const agencyOfficer = await User.findOneAndUpdate(
      { email: 'agency.admin@nhai.gov.in' },
      {
        name: 'Shri Ajay Devgan (NHAI Admin)',
        fullName: 'Shri Ajay Devgan',
        email: 'agency.admin@nhai.gov.in',
        officialEmail: 'agency.admin@nhai.gov.in',
        designation: 'Chief General Manager (Coordination)',
        employeeId: 'NHAI-CGM-01',
        department: 'Project Implementation Unit',
        role: 'IMPLEMENTATION_AGENCY',
        agencyId: agency._id,
        ministryId: ministry._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Synced Agency Officer:', agencyOfficer.email);

    // 6. Upsert Nodal Officer (Account 2)
    const nodalOfficer = await User.findOneAndUpdate(
      { email: 'nodal.officer@nhai.gov.in' },
      {
        name: 'Rajesh Kumar (Nodal Officer)',
        fullName: 'Rajesh Kumar',
        email: 'nodal.officer@nhai.gov.in',
        officialEmail: 'nodal.officer@nhai.gov.in',
        designation: 'Project Director & Nodal Authority',
        employeeId: 'NODAL-101',
        department: 'Project Monitoring Directorate',
        role: 'NODAL_OFFICER',
        agencyId: agency._id,
        ministryId: ministry._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Synced Nodal Officer:', nodalOfficer.email);

    // 7. Upsert Reporting Officer (Account 3)
    const reportingOfficer = await User.findOneAndUpdate(
      { email: 'reporting.officer@nhai.gov.in' },
      {
        name: 'Anita Sharma (Reporting Officer)',
        fullName: 'Anita Sharma',
        email: 'reporting.officer@nhai.gov.in',
        officialEmail: 'reporting.officer@nhai.gov.in',
        designation: 'Resident Engineer & Field Officer',
        employeeId: 'REP-201',
        department: 'Field Supervision & Ground Telemetry',
        role: 'REPORTING_OFFICER',
        agencyId: agency._id,
        ministryId: ministry._id,
        password: officerPasswordHash,
        passwordHash: officerPasswordHash,
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Synced Reporting Officer:', reportingOfficer.email);

    // 8. Find all projects in database and bind them to this Triad!
    const totalProjects = await Project.countDocuments();
    console.log(`\n📦 Binding ${totalProjects} database projects to the Triad Officers...`);

    const updateResult = await Project.updateMany(
      {},
      {
        $set: {
          nodalOfficer: nodalOfficer._id,
          nodalOfficerId: nodalOfficer._id,
          reportingOfficerId: reportingOfficer._id,
          implementationAgencyId: agency._id,
          ministryId: ministry._id
        },
        $addToSet: {
          reportingOfficers: reportingOfficer._id
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} projects with Triad linkages.`);

    // 9. Generate Initial Live Alert for Nodal Officer
    const sampleProject = await Project.findOne({
      $or: [
        { projectCode: 'NH27-BIH-04L' },
        { projectCode: '619043' },
        {}
      ]
    });

    if (sampleProject) {
      console.log(`\n🔔 Generating sample live alert & notifications for Nodal Officer on project "${sampleProject.projectName}"...`);

      // Ensure Alert exists
      let alert = await Alert.findOne({
        projectId: sampleProject._id,
        status: 'ACTIVE'
      });

      if (!alert) {
        alert = await Alert.create({
          projectId: sampleProject._id,
          alertType: 'FUND_PROGRESS_MISMATCH',
          severity: 'HIGH',
          title: 'Expenditure vs Physical Execution Discrepancy (37.9%)',
          message: 'Cumulative billing expenditure reached 92.9% while physical execution is at 55.0%. Forest clearance delay causing package stoppage.',
          riskScore: 78,
          assignedTo: nodalOfficer._id,
          status: 'ACTIVE',
          triggeredAt: new Date()
        });
        console.log('✅ Created Active Alert for Nodal Officer');
      }

      // Notification for Nodal Officer
      await Notification.create({
        userId: nodalOfficer._id,
        projectId: sampleProject._id,
        alertId: alert._id,
        title: `HIGH ALERT: ${sampleProject.projectName}`,
        message: 'Fund vs physical progress mismatch flagged by telemetry system. Ground audit required.',
        type: 'ALERT',
        severity: 'HIGH',
        isRead: false
      });

      // Notification for Agency Officer
      await Notification.create({
        userId: agencyOfficer._id,
        projectId: sampleProject._id,
        alertId: alert._id,
        title: `[HIGH RISK ESCALATION] ${sampleProject.projectName}`,
        message: 'Project outlay has reached critical monitoring threshold under NHAI supervision.',
        type: 'ALERT',
        severity: 'HIGH',
        isRead: false
      });

      console.log('✅ Generated notifications for Nodal Officer and Agency Officer.');
    }

    console.log('\n======================================================');
    console.log('🎉 TRIAD ACCOUNTS SUCCESSFULLY CONFIGURED AND BOUND:');
    console.log('======================================================');
    console.log('1. AGENCY OFFICER:');
    console.log('   Email:    agency.admin@nhai.gov.in');
    console.log('   Password: Officer@12345');
    console.log('   Role:     IMPLEMENTATION_AGENCY');
    console.log('------------------------------------------------------');
    console.log('2. NODAL OFFICER:');
    console.log('   Email:    nodal.officer@nhai.gov.in');
    console.log('   Password: Officer@12345');
    console.log('   Role:     NODAL_OFFICER (sees live alerts & warnings)');
    console.log('------------------------------------------------------');
    console.log('3. REPORTING OFFICER:');
    console.log('   Email:    reporting.officer@nhai.gov.in');
    console.log('   Password: Officer@12345');
    console.log('   Role:     REPORTING_OFFICER (submits monthly telemetry)');
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up triad accounts:', err);
    process.exit(1);
  }
}

setupTriad();
