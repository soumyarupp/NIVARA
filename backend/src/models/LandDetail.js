import mongoose from 'mongoose';

const landDetailSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      unique: true,
      index: true
    },
    landRequired: {
      type: Boolean,
      default: true
    },
    landArea: {
      type: Number,
      default: 0
    },
    areaUnit: {
      type: String,
      enum: ['HECTARES', 'ACRES', 'SQ_METERS', 'KM_LENGTH'],
      default: 'HECTARES'
    },
    fullyAcquired: {
      type: Boolean,
      default: false
    },
    remainingLandPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    likelyAcquisitionDate: {
      type: Date,
      default: null
    },
    rightOfWayApplicable: {
      type: Boolean,
      default: true
    },
    rightOfWayAvailability: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    scheduledStartDate: {
      type: Date,
      default: null
    },
    actualStartDate: {
      type: Date,
      default: null
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

export const LandDetail = mongoose.model('LandDetail', landDetailSchema);
