import mongoose from 'mongoose';

const preApprovalSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      trim: true,
      default: 'Proposed Project'
    },
    sector: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    agency: {
      type: String,
      default: ''
    },
    estimatedCost: {
      type: Number,
      required: true
    },
    landRequired: {
      type: Boolean,
      default: true
    },
    forestClearanceRequired: {
      type: Boolean,
      default: false
    },
    litigationRisk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    },
    simulatedRiskScore: {
      type: Number,
      default: 0
    },
    simulatedRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    predictedDelayMonths: {
      type: Number,
      default: 0
    },
    majorRiskFactor: {
      type: String,
      default: ''
    },
    recommendations: [
      {
        type: String
      }
    ],
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

export const PreApproval = mongoose.model('PreApproval', preApprovalSchema);
