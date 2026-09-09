import mongoose from 'mongoose';

export const ALERT_TYPES = [
  'REPORTING_DELAY',
  'FUND_PROGRESS_MISMATCH',
  'TIME_OVERRUN',
  'COST_OVERRUN',
  'CLEARANCE_PENDING',
  'LAND_ACQUISITION_DELAY',
  'HIGH_RISK',
  'CRITICAL_RISK'
];

export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const ALERT_STATUSES = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];

const alertSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    alertType: {
      type: String,
      enum: ALERT_TYPES,
      required: [true, 'Alert type is required'],
      index: true
    },
    severity: {
      type: String,
      enum: ALERT_SEVERITIES,
      default: 'MEDIUM',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true
    },
    riskScore: {
      type: Number,
      default: 0
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ALERT_STATUSES,
      default: 'ACTIVE',
      index: true
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionRemarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

alertSchema.index({ projectId: 1, alertType: 1, status: 1 });

export const Alert = mongoose.model('Alert', alertSchema);
