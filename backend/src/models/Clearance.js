import mongoose from 'mongoose';

export const CLEARANCE_TYPES = [
  'COASTAL_REGULATORY_ZONE',
  'ENVIRONMENTAL',
  'FOREST',
  'DEFENCE',
  'RAILWAY',
  'WILDLIFE',
  'POLLUTION_CONTROL',
  'HERITAGE',
  'OTHER'
];

export const CLEARANCE_STATUSES = ['PENDING', 'APPROVED', 'NOT_REQUIRED', 'REJECTED'];

const clearanceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    clearanceType: {
      type: String,
      enum: CLEARANCE_TYPES,
      required: [true, 'Clearance type is required']
    },
    status: {
      type: String,
      enum: CLEARANCE_STATUSES,
      default: 'PENDING',
      index: true
    },
    requiredDate: {
      type: Date,
      default: null
    },
    approvalDate: {
      type: Date,
      default: null
    },
    pendingReason: {
      type: String,
      trim: true,
      default: ''
    },
    authorityName: {
      type: String,
      trim: true,
      default: ''
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

clearanceSchema.index({ projectId: 1, clearanceType: 1 });

export const Clearance = mongoose.model('Clearance', clearanceSchema);
