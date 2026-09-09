import mongoose from 'mongoose';

export const TENDER_TYPES = [
  'GLOBAL',
  'LIMITED',
  'RESTRICTED',
  'EOI',
  'EMPANELMENT',
  'OPEN'
];

export const TENDER_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'UNDER_EVALUATION',
  'AWARDED',
  'CANCELLED',
  'RETENDERED'
];

const tenderSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    tenderName: {
      type: String,
      required: [true, 'Tender name is required'],
      trim: true
    },
    tenderType: {
      type: String,
      enum: TENDER_TYPES,
      default: 'OPEN'
    },
    tenderStatus: {
      type: String,
      enum: TENDER_STATUSES,
      default: 'PUBLISHED'
    },
    tenderId: {
      type: String,
      trim: true,
      default: ''
    },
    tenderNoticeNumber: {
      type: String,
      trim: true,
      default: ''
    },
    tenderPortalLink: {
      type: String,
      trim: true,
      default: ''
    },
    estimatedValue: {
      type: Number,
      default: 0
    },
    awardedValue: {
      type: Number,
      default: 0
    },
    awardedVendor: {
      type: String,
      trim: true,
      default: ''
    },
    bidDueDate: {
      type: Date,
      default: null
    },
    tenderPublishDate: {
      type: Date,
      default: null
    },
    tenderAwardDate: {
      type: Date,
      default: null
    },
    documents: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

tenderSchema.index({ projectId: 1, tenderStatus: 1 });

export const Tender = mongoose.model('Tender', tenderSchema);
