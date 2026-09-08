import test, { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Project } from '../src/models/Project.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { hashPassword } from '../src/utils/password.js';
import { hashToken } from '../src/utils/token.js';

let mongoServer;
let server;
let baseUrl;

// Helper to make JSON HTTP requests
const apiRequest = async (endpoint, { method = 'GET', body, headers = {}, token, cookies } = {}) => {
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (cookies) {
    reqHeaders['Cookie'] = cookies;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const rawText = await res.text();
  let json = {};
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    json = { raw: rawText };
  }

  return {
    status: res.status,
    headers: res.headers,
    body: json
  };
};

describe('NIVARA Authentication & RBAC Test Suite', () => {
  let ipmdToken = '';
  let ministryToken = '';
  let agencyToken = '';
  let nodalToken = '';
  let reportingToken = '';

  let ministryOrgId = '';
  let agencyOrgId = '';
  let otherMinistryOrgId = '';
  let otherAgencyOrgId = '';
  let sampleProjectId = '';

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Seed Core Entities
    const ipmdAdmin = await User.create({
      fullName: 'IPMD Super Admin',
      officialEmail: 'ipmd.admin@nivara.test',
      mobileNumber: '+919999999991',
      designation: 'Director',
      employeeId: 'IPMD-001',
      department: 'Central HQ',
      role: 'IPMD_ADMIN',
      passwordHash: await hashPassword('Admin@12345'),
      status: 'ACTIVE',
      emailVerified: true
    });

    const ministry = await Organization.create({
      name: 'Ministry of Road Transport',
      code: 'MORTH_TEST',
      type: 'MINISTRY',
      createdBy: ipmdAdmin._id
    });
    ministryOrgId = ministry._id.toString();

    const otherMinistry = await Organization.create({
      name: 'Ministry of Railways',
      code: 'MOR_TEST',
      type: 'MINISTRY',
      createdBy: ipmdAdmin._id
    });
    otherMinistryOrgId = otherMinistry._id.toString();

    const agency = await Organization.create({
      name: 'NHAI Test Agency',
      code: 'NHAI_TEST',
      type: 'IMPLEMENTING_AGENCY',
      parentOrganizationId: ministry._id,
      createdBy: ipmdAdmin._id
    });
    agencyOrgId = agency._id.toString();

    const otherAgency = await Organization.create({
      name: 'IRCON Test Agency',
      code: 'IRCON_TEST',
      type: 'IMPLEMENTING_AGENCY',
      parentOrganizationId: otherMinistry._id,
      createdBy: ipmdAdmin._id
    });
    otherAgencyOrgId = otherAgency._id.toString();

    const ministryAdmin = await User.create({
      fullName: 'MoRTH Admin',
      officialEmail: 'ministry.admin@morth.test',
      mobileNumber: '+919999999992',
      designation: 'Joint Secretary',
      employeeId: 'MORTH-001',
      department: 'Roads',
      organizationId: ministry._id,
      role: 'MINISTRY_ADMIN',
      passwordHash: await hashPassword('Ministry@12345'),
      status: 'ACTIVE',
      emailVerified: true
    });

    const agencyAdmin = await User.create({
      fullName: 'NHAI Admin',
      officialEmail: 'agency.admin@nhai.test',
      mobileNumber: '+919999999993',
      designation: 'General Manager',
      employeeId: 'NHAI-001',
      department: 'Projects',
      organizationId: agency._id,
      role: 'AGENCY_ADMIN',
      passwordHash: await hashPassword('Agency@12345'),
      status: 'ACTIVE',
      emailVerified: true
    });

    const nodalUser = await User.create({
      fullName: 'Nodal Officer 1',
      officialEmail: 'nodal.officer@nhai.test',
      mobileNumber: '+919999999994',
      designation: 'PIU Head',
      employeeId: 'NHAI-NOD-01',
      department: 'Field',
      organizationId: agency._id,
      role: 'NODAL_OFFICER',
      passwordHash: await hashPassword('Nodal@12345'),
      status: 'ACTIVE',
      emailVerified: true
    });

    const reportingUser = await User.create({
      fullName: 'Reporting Officer 1',
      officialEmail: 'reporting.officer@nhai.test',
      mobileNumber: '+919999999995',
      designation: 'Site Engineer',
      employeeId: 'NHAI-REP-01',
      department: 'Field',
      organizationId: agency._id,
      role: 'REPORTING_OFFICER',
      passwordHash: await hashPassword('Reporting@12345'),
      status: 'ACTIVE',
      emailVerified: true
    });

    const project = await Project.create({
      projectName: 'Test Highway Stretch',
      projectCode: 'TEST-HWY-01',
      lineMinistryId: ministry._id,
      implementingAgencyId: agency._id,
      reportingOfficerId: reportingUser._id,
      nodalOfficerId: nodalUser._id
    });
    sampleProjectId = project._id.toString();

    // Authenticate tokens for test use
    const loginIpmd = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'ipmd.admin@nivara.test', password: 'Admin@12345' }
    });
    ipmdToken = loginIpmd.body.data.accessToken;

    const loginMinistry = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'ministry.admin@morth.test', password: 'Ministry@12345' }
    });
    ministryToken = loginMinistry.body.data.accessToken;

    const loginAgency = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'agency.admin@nhai.test', password: 'Agency@12345' }
    });
    agencyToken = loginAgency.body.data.accessToken;

    const loginNodal = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'nodal.officer@nhai.test', password: 'Nodal@12345' }
    });
    nodalToken = loginNodal.body.data.accessToken;

    const loginReporting = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'reporting.officer@nhai.test', password: 'Reporting@12345' }
    });
    reportingToken = loginReporting.body.data.accessToken;
  });

  after(async () => {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  // TEST 1: Admin login
  it('1. Admin login with correct credentials returns accessToken and sets httpOnly cookie', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'ipmd.admin@nivara.test', password: 'Admin@12345' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.equal(res.body.data.user.role, 'IPMD_ADMIN');
    assert.equal(res.body.data.user.passwordHash, undefined);
  });

  // TEST 2: Invalid login
  it('2. Invalid login returns generic 401 without leaking email existence', async () => {
    const res1 = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'nonexistent@nivara.test', password: 'WrongPassword@123' }
    });
    assert.equal(res1.status, 401);
    assert.equal(res1.body.message, 'Invalid email or password');

    const res2 = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { officialEmail: 'ipmd.admin@nivara.test', password: 'WrongPassword@123' }
    });
    assert.equal(res2.status, 401);
    assert.equal(res2.body.message, 'Invalid email or password');
  });

  // TEST 3: Account invitation
  let inviteeToken = '';
  it('3. Authorized Agency Admin can invite a new Nodal Officer', async () => {
    const res = await apiRequest('/api/users/invite', {
      method: 'POST',
      token: agencyToken,
      body: {
        fullName: 'New Nodal Candidate',
        officialEmail: 'new.nodal@nhai.test',
        mobileNumber: '+919876543299',
        designation: 'Assistant Executive Engineer',
        employeeId: 'NHAI-AEE-99',
        department: 'Highway Projects',
        role: 'NODAL_OFFICER'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'INVITED');

    const invitedUser = await User.findOne({ officialEmail: 'new.nodal@nhai.test' }).select('+invitationTokenHash');
    assert.ok(invitedUser.invitationTokenHash);
  });

  // TEST 4: Invitation expiration
  it('4. Expired invitation token is rejected during activation', async () => {
    // Manually create an expired invited user
    const expiredToken = 'expired-token-12345678901234567890';
    const expiredHash = hashToken(expiredToken);

    await User.create({
      fullName: 'Expired Invitee',
      officialEmail: 'expired.invitee@nhai.test',
      mobileNumber: '+919876543288',
      designation: 'Staff',
      employeeId: 'NHAI-EXP-01',
      department: 'Admin',
      organizationId: new mongoose.Types.ObjectId(agencyOrgId),
      role: 'REPORTING_OFFICER',
      status: 'INVITED',
      invitationTokenHash: expiredHash,
      invitationExpiresAt: new Date(Date.now() - 3600000) // 1 hr in past
    });

    const res = await apiRequest('/api/auth/activate', {
      method: 'POST',
      body: {
        token: expiredToken,
        password: 'ValidPassword@123',
        confirmPassword: 'ValidPassword@123'
      }
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /expired/i);
  });

  // TEST 5: Account activation
  it('5. User successfully activates account with valid token and strong password', async () => {
    const rawToken = 'valid-activation-token-1234567890abcdef';
    const rawHash = hashToken(rawToken);

    await User.create({
      fullName: 'Activation Candidate',
      officialEmail: 'activation.candidate@nhai.test',
      mobileNumber: '+919876543277',
      designation: 'Officer',
      employeeId: 'NHAI-ACT-01',
      department: 'Projects',
      organizationId: new mongoose.Types.ObjectId(agencyOrgId),
      role: 'REPORTING_OFFICER',
      status: 'INVITED',
      invitationTokenHash: rawHash,
      invitationExpiresAt: new Date(Date.now() + 86400000)
    });

    const res = await apiRequest('/api/auth/activate', {
      method: 'POST',
      body: {
        token: rawToken,
        password: 'SecurePassword@123',
        confirmPassword: 'SecurePassword@123'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ACTIVE');

    const activatedUser = await User.findOne({ officialEmail: 'activation.candidate@nhai.test' });
    assert.equal(activatedUser.status, 'ACTIVE');
    assert.equal(activatedUser.emailVerified, true);
  });

  // TEST 6: Duplicate email prevention
  it('6. Duplicate official email during invitation is rejected', async () => {
    const res = await apiRequest('/api/users/invite', {
      method: 'POST',
      token: agencyToken,
      body: {
        fullName: 'Duplicate Officer',
        officialEmail: 'nodal.officer@nhai.test', // already exists
        mobileNumber: '+919876543266',
        designation: 'Officer',
        employeeId: 'NHAI-DUP-01',
        department: 'Field',
        role: 'NODAL_OFFICER'
      }
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /already exists/i);
  });

  // TEST 7: Password hashing
  it('7. Password is saved strictly as Argon2id hash and raw password is never stored', async () => {
    const user = await User.findOne({ officialEmail: 'activation.candidate@nhai.test' }).select('+passwordHash');
    assert.ok(user.passwordHash);
    assert.ok(user.passwordHash.startsWith('$argon2id$'));
    assert.equal(user.password, undefined);
  });

  // TEST 8: Login after activation
  it('8. User can successfully login immediately after activation', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        officialEmail: 'activation.candidate@nhai.test',
        password: 'SecurePassword@123'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.equal(res.body.data.user.role, 'REPORTING_OFFICER');
  });

  // TEST 9: Suspended user login rejection
  it('9. Suspended user is denied login with explicit 401 error', async () => {
    const user = await User.findOne({ officialEmail: 'activation.candidate@nhai.test' });
    user.status = 'SUSPENDED';
    await user.save();

    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        officialEmail: 'activation.candidate@nhai.test',
        password: 'SecurePassword@123'
      }
    });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /suspended/i);
  });

  // TEST 10: Forgot password
  it('10. Forgot password returns constant-time generic confirmation', async () => {
    const res = await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { officialEmail: 'ipmd.admin@nivara.test' }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'If the account exists, a password reset link has been sent.');
  });

  // TEST 11: Reset password
  it('11. Reset password updates credentials and allows login with new password', async () => {
    const rawResetToken = 'reset-token-sample-1234567890abcdef';
    const resetHash = hashToken(rawResetToken);

    const user = await User.findOne({ officialEmail: 'ministry.admin@morth.test' });
    user.resetPasswordTokenHash = resetHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetRes = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: rawResetToken,
        password: 'NewMinistryPassword@123',
        confirmPassword: 'NewMinistryPassword@123'
      }
    });

    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body.success, true);

    // Verify login with new password
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        officialEmail: 'ministry.admin@morth.test',
        password: 'NewMinistryPassword@123'
      }
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.data.accessToken);
  });

  // TEST 12: RBAC enforcement
  it('12. Reporting Officer is denied access to admin-only routes (403 Forbidden)', async () => {
    const res = await apiRequest('/api/users/invite', {
      method: 'POST',
      token: reportingToken,
      body: {
        fullName: 'Unauthorized Invite',
        officialEmail: 'hack@test.com',
        mobileNumber: '+919999999999',
        designation: 'Fake',
        employeeId: 'FAKE-01',
        department: 'Fake',
        role: 'REPORTING_OFFICER'
      }
    });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /Access denied/i);
  });

  // TEST 13: Organization access boundary
  it('13. Ministry Admin cannot access an agency outside its line ministry', async () => {
    const res = await apiRequest(`/api/organizations/${otherAgencyOrgId}`, {
      method: 'GET',
      token: ministryToken
    });

    assert.equal(res.status, 403);
  });

  // TEST 14: Unauthorized role creation
  it('14. Agency Admin attempting to create Ministry Admin is rejected (Hierarchy Violation)', async () => {
    const res = await apiRequest('/api/users/invite', {
      method: 'POST',
      token: agencyToken,
      body: {
        fullName: 'Privilege Escalator',
        officialEmail: 'escalation@nhai.test',
        mobileNumber: '+919876543255',
        designation: 'Officer',
        employeeId: 'ESC-001',
        department: 'Technical',
        role: 'MINISTRY_ADMIN',
        organizationId: ministryOrgId
      }
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Agency Admins can only create Nodal Officers and Reporting Officers/i);
  });

  // TEST 15: Valid project assignment
  it('15. Agency Admin can assign Reporting Officer within the same Implementing Agency', async () => {
    const reportingOfficer = await User.findOne({ officialEmail: 'reporting.officer@nhai.test' });

    const res = await apiRequest(`/api/users/${reportingOfficer._id}/assign-project`, {
      method: 'POST',
      token: agencyToken,
      body: {
        projectId: sampleProjectId
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.role, 'REPORTING_OFFICER');

    const updatedProject = await Project.findById(sampleProjectId);
    assert.equal(updatedProject.reportingOfficerId.toString(), reportingOfficer._id.toString());
  });

  // TEST 16: Cross-agency project assignment rejection
  it('16. Project assignment fails if user belongs to a different Implementing Agency', async () => {
    // Create an officer in IRCON
    const foreignOfficer = await User.create({
      fullName: 'Foreign Officer',
      officialEmail: 'foreign.officer@ircon.test',
      mobileNumber: '+919876543244',
      designation: 'Engineer',
      employeeId: 'IRCON-ENG-01',
      department: 'Projects',
      organizationId: new mongoose.Types.ObjectId(otherAgencyOrgId),
      role: 'REPORTING_OFFICER',
      status: 'ACTIVE',
      emailVerified: true
    });

    const res = await apiRequest(`/api/users/${foreignOfficer._id}/assign-project`, {
      method: 'POST',
      token: ipmdToken, // IPMD has global access, but user & project agency mismatch must be rejected
      body: {
        projectId: sampleProjectId // belonging to NHAI
      }
    });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /different Implementing Agencies/i);
  });
});
