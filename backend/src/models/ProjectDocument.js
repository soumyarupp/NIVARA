import mongoose from 'mongoose';

export const DOCUMENT_TYPES = [
  'SANCTION_LETTER',
  'DPR',
  'TENDER_DOCUMENT',
  'PROJECT_MAP',
  'PROGRESS_PHOTO',
  'ENVIRONMENTAL_CLEARANCE',
  'FOREST_CLEARANCE',
  'LAND_ACQUISITION_GAZETTE',
  'FINANCIAL_APPROVAL',
  'CONTRACT_AGREEMENT',
  'OTHER'
];

const projectDocumentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader ID is required']
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: 'OTHER'
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or path is required']
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const ProjectDocument = mongoose.model('ProjectDocument', projectDocumentSchema);
