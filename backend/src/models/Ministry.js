import mongoose from 'mongoose';

const ministrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ministry name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Ministry code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Ministry = mongoose.model('Ministry', ministrySchema);
