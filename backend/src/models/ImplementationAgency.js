import mongoose from 'mongoose';

const implementationAgencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Implementation Agency name is required'],
      unique: true,
      trim: true
    },
    agencyCode: {
      type: String,
      required: [true, 'Agency code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    organizationType: {
      type: String,
      enum: ['PSU', 'STATE_DEPT', 'CENTRAL_AGENCY', 'STATUTORY_BODY', 'AUTONOMOUS_BODY', 'SPV', 'JOINT_VENTURE', 'OTHER'],
      default: 'PSU'
    },
    ministryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministry',
      required: [true, 'Line Ministry is required'],
      index: true
    },
    state: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    division: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    totalSanctionedCapital: {
      type: Number,
      default: 0,
      index: true
    },
    totalProjectsCount: {
      type: Number,
      default: 0
    },
    totalExpenditure: {
      type: Number,
      default: 0
    },
    lastCapitalRecalculatedAt: {
      type: Date,
      default: Date.now
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const ImplementationAgency = mongoose.model('ImplementationAgency', implementationAgencySchema);
