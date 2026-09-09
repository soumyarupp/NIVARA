import mongoose from 'mongoose';

export const MILESTONE_TYPES = [
  'PROJECT_PLANNING',
  'DPR_FEASIBILITY',
  'LAND_ACQUISITION',
  'CLEARANCE_APPROVAL',
  'TENDER_PUBLISH',
  'TENDER_AWARD',
  'CONSTRUCTION',
  'COMMISSIONING',
  'CUSTOM'
];

export const MILESTONE_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
  'SUSPENDED'
];

const milestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    milestoneName: {
      type: String,
      trim: true,
      default: ''
    },
    milestoneType: {
      type: String,
      enum: MILESTONE_TYPES,
      required: [true, 'Milestone type is required'],
      default: 'CONSTRUCTION'
    },
    weightage: {
      type: Number,
      default: 10
    },
    originalStartDate: { type: Date, default: null },
    revisedStartDate: { type: Date, default: null },
    actualStartDate: { type: Date, default: null },
    originalFinishDate: { type: Date, default: null },
    revisedFinishDate: { type: Date, default: null },
    actualFinishDate: { type: Date, default: null },
    originalCost: { type: Number, default: 0 },
    revisedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: MILESTONE_STATUSES,
      default: 'NOT_STARTED'
    },
    physicalProgressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
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

export const Milestone = mongoose.model('Milestone', milestoneSchema);
