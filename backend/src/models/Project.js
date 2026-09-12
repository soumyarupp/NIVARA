import mongoose from 'mongoose';

const monthlyReportItemSchema = new mongoose.Schema(
  {
    reportingMonth: { type: String, required: true }, // e.g., '2026-04'
    year: { type: Number, required: true },           // e.g., 2026
    month: { type: Number, required: true },          // e.g., 4
    monthName: { type: String },                      // e.g., 'April 2026'
    expenditure: { type: Number, default: 0 },        // in Cr
    cumulativeExpenditure: { type: Number, default: 0 },
    actualPhysicalProgress: { type: Number, default: 0 }, // %
    actualFinancialProgress: { type: Number, default: 0 }, // %
    plannedPhysicalProgress: { type: Number, default: 0 },
    plannedFinancialProgress: { type: Number, default: 0 },
    originalCost: { type: Number, default: 0 },
    revisedCost: { type: Number, default: 0 },
    costOverrun: { type: Number, default: 0 },
    costOverrunPercentage: { type: Number, default: 0 },
    delayMonths: { type: Number, default: 0 },
    delayDays: { type: Number, default: 0 },
    delayReasonText: { type: String, default: '' },
    remarks: { type: String, default: '' },
    excelData: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const actionHistoryItemSchema = new mongoose.Schema(
  {
    actionId: { type: String },
    actionType: { type: String, default: 'OFFICER_ACTION' },
    actionCategory: { type: String, default: 'GROUND_AUDIT' },
    title: { type: String, default: '' },
    remarks: { type: String, default: '' },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    takenByName: { type: String, default: 'Designated Officer' },
    takenByRole: { type: String, default: 'NODAL_OFFICER' },
    takenAt: { type: Date, default: Date.now },
    previousStatus: { type: String, default: 'IN_PROGRESS' },
    updatedStatus: { type: String, default: 'MITIGATION_ACTIVE' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true
    },
    projectCode: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    lineMinistryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    implementingAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    ministryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministry',
      default: null,
      index: true
    },
    implementationAgencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImplementationAgency',
      default: null,
      index: true
    },
    reportingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reportingOfficers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    nodalOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    nodalOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    nodalOfficerName: { type: String, default: '' },
    nodalOfficerEmail: { type: String, default: '' },
    nodalOfficerPhone: { type: String, default: '' },
    nodalOfficerDesignation: { type: String, default: '' },
    reportingOfficerName: { type: String, default: '' },
    reportingOfficerEmail: { type: String, default: '' },
    reportingOfficerPhone: { type: String, default: '' },
    reportingOfficerDesignation: { type: String, default: '' },
    status: {
      type: String,
      default: 'IN_PROGRESS'
    },
    projectStatus: {
      type: String,
      default: 'ONGOING'
    },
    sector: {
      type: String,
      default: 'Central Sector Infrastructure'
    },
    subSector: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: 'Pan India'
    },
    district: {
      type: String,
      default: ''
    },
    originalProjectCost: {
      type: Number,
      default: 0
    },
    revisedProjectCost: {
      type: Number,
      default: 0
    },
    sanctionedCost: {
      type: Number,
      default: 0
    },
    expenditure: {
      type: Number,
      default: 0
    },
    totalActualExpenditure: {
      type: Number,
      default: 0
    },
    totalCapitalOutlay: {
      type: Number,
      default: 0
    },
    physicalProgress: {
      type: Number,
      default: 0
    },
    financialProgress: {
      type: Number,
      default: 0
    },
    plannedPhysicalProgress: {
      type: Number,
      default: 0
    },
    plannedFinancialProgress: {
      type: Number,
      default: 0
    },
    delayMonths: {
      type: Number,
      default: 0
    },
    delayDays: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      default: 25
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    // Multi-month reports data in object & array format by Year and Month
    monthlyReports: [monthlyReportItemSchema],
    monthlyData: {
      type: Map,
      of: monthlyReportItemSchema,
      default: {}
    },
    historyByYear: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    reportingMonths: {
      type: [String],
      default: []
    },
    totalReportsCount: {
      type: Number,
      default: 0
    },
    budgetEstimatedInCrores: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actionHistory: {
      type: [actionHistoryItemSchema],
      default: []
    },
    latestAction: {
      type: actionHistoryItemSchema,
      default: null
    }
  },
  {
    strict: false,
    strictPopulate: false,
    timestamps: true
  }
);

projectSchema.index({ implementingAgencyId: 1, lineMinistryId: 1 });
projectSchema.index({ state: 1, sector: 1, riskLevel: 1 });

export const Project = mongoose.model('Project', projectSchema);
