import mongoose from 'mongoose';

export const PARTNER_TYPES = [
  'CO_DEVELOPER',
  'FINANCIAL_PARTNER',
  'CONSULTANT',
  'CONTRACTOR',
  'SPV_PARTNER',
  'GOVERNMENT_BODY',
  'OTHER'
];

const partnerSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    partnerType: {
      type: String,
      enum: PARTNER_TYPES,
      default: 'CONTRACTOR'
    },
    partnerName: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    stakePercentage: {
      type: Number,
      default: 0
    },
    roleDescription: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Partner = mongoose.model('Partner', partnerSchema);
