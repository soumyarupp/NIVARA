import mongoose from 'mongoose';

export const USER_ROLES = [
  'IPMD_ADMIN',
  'MINISTRY_ADMIN',
  'AGENCY_ADMIN',
  'NODAL_OFFICER',
  'REPORTING_OFFICER'
];

export const USER_STATUSES = [
  'INVITED',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED'
];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120
    },
    officialEmail: {
      type: String,
      required: [true, 'Official email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid NIVARA role'
      },
      index: true
    },
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
      }
    ],
    passwordHash: {
      type: String,
      select: false,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: USER_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'INVITED',
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    invitationTokenHash: {
      type: String,
      select: false,
      default: null
    },
    invitationExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal queries
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ status: 1, role: 1 });

export const User = mongoose.model('User', userSchema);
