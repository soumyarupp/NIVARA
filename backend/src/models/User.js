import mongoose from 'mongoose';

export const USER_ROLES = [
  'SUPER_ADMIN',
  'IPMD_ADMIN',
  'MINISTRY_OFFICER',
  'MINISTRY_ADMIN', // Compatibility alias for MINISTRY_OFFICER
  'IMPLEMENTATION_AGENCY',
  'AGENCY_ADMIN', // Compatibility alias for IMPLEMENTATION_AGENCY
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
    name: {
      type: String,
      trim: true,
      maxlength: 120
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    officialEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: ''
    },
    designation: {
      type: String,
      trim: true,
      default: ''
    },
    employeeId: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    ministryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministry',
      default: null,
      index: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImplementationAgency',
      default: null,
      index: true
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
    password: {
      type: String,
      select: false,
      default: null
    },
    passwordHash: {
      type: String,
      select: false,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: {
        values: USER_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'ACTIVE',
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: true
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

// Pre-save hook to ensure name/fullName and email/officialEmail syncing
userSchema.pre('save', function (next) {
  if (this.name && !this.fullName) this.fullName = this.name;
  if (this.fullName && !this.name) this.name = this.fullName;
  if (this.email && !this.officialEmail) this.officialEmail = this.email;
  if (this.officialEmail && !this.email) this.email = this.officialEmail;
  if (this.phone && !this.mobileNumber) this.mobileNumber = this.phone;
  if (this.mobileNumber && !this.phone) this.phone = this.mobileNumber;
  next();
});

// Compound indexes
userSchema.index({ ministryId: 1, role: 1 });
userSchema.index({ agencyId: 1, role: 1 });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ status: 1, role: 1 });

export const User = mongoose.model('User', userSchema);
