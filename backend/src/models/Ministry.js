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
