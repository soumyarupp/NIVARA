import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 200
    },
    code: {
      type: String,
      required: [true, 'Organization code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50
    },
    type: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: {
        values: ['MINISTRY', 'IMPLEMENTING_AGENCY'],
        message: '{VALUE} is not a valid organization type'
      }
    },
    parentOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    officialEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
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

organizationSchema.index({ type: 1, parentOrganizationId: 1 });

export const Organization = mongoose.model('Organization', organizationSchema);
