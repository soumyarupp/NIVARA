import mongoose from 'mongoose';

const monthlyReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    reportingMonth: {
      type: String, // Format: YYYY-MM
      required: [true, 'Reporting month is required'],
      trim: true,
      index: true
    },
    plannedFinancialProgress: {
      type: Number,
      default: 0,
      min: 0
    },
    actualFinancialProgress: {
      type: Number,
      required: [true, 'Actual financial progress is required'],
      min: 0,
      default: 0
    },
    plannedPhysicalProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    actualPhysicalProgress: {
      type: Number,
      required: [true, 'Actual physical progress is required'],
      min: 0,
      max: 100,
      default: 0
    },
    expenditure: {
      type: Number,
      required: [true, 'Expenditure is required'],
      min: 0,
      default: 0
    },
    delayDays: {
      type: Number,
      default: 0
    },
    delayReasonText: {
      type: String,
      trim: true,
      default: ''
    },
    autoDetectedDelayReason: {
      type: String,
      enum: [
        'LAND_ACQUISITION',
        'FOREST_CLEARANCE',
        'ENVIRONMENTAL_CLEARANCE',
        'FUND_SHORTAGE',
        'CONTRACTOR_ISSUE',
        'LITIGATION',
        'UTILITY_SHIFTING',
        'APPROVAL_DELAY',
        'WEATHER',
        'OTHER',
        'NONE'
      ],
      default: 'NONE'
    },
    delayConfidence: {
      type: Number,
      default: 0
    },
    matchedKeywords: [{ type: String }],
    mismatchDetected: {
      type: Boolean,
      default: false
    },
    mismatchDifference: {
      type: Number,
      default: 0
    },
    mismatchSeverity: {
      type: String,
      enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH'],
      default: 'NONE'
    },
    calculatedRiskScore: {
      type: Number,
      default: 0
    },
    calculatedRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitting officer ID is required']
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String
      }
    ]
  },
  {
    timestamps: true
  }
);

monthlyReportSchema.index({ projectId: 1, reportingMonth: 1 }, { unique: true });
monthlyReportSchema.index({ projectId: 1, submittedAt: -1 });

export const MonthlyReport = mongoose.model('MonthlyReport', monthlyReportSchema);
