import { ProjectDocument } from '../models/ProjectDocument.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function uploadDocuments(req, res) {
  try {
    const { projectId } = req.params;
    const { documentType, title } = req.body;
    const userId = req.user._id || req.user.id;

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files uploaded. Please provide at least one valid file.', [], 400);
    }

    const createdDocuments = [];

    for (const file of req.files) {
      const doc = await ProjectDocument.create({
        projectId,
        uploadedBy: userId,
        documentType: documentType || 'OTHER',
        title: title || file.originalname,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype
      });
      createdDocuments.push(doc);
    }

    return sendSuccess(res, `${createdDocuments.length} document(s) uploaded successfully.`, createdDocuments, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to upload document(s).', [], 500);
  }
}

export async function getDocumentsByProject(req, res) {
  try {
    const { projectId } = req.params;
    const documents = await ProjectDocument.find({ projectId })
      .populate('uploadedBy', 'name fullName officialEmail')
      .sort({ uploadedAt: -1 });

    return sendSuccess(res, 'Project documents retrieved.', documents);
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch project documents.', [], 500);
  }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const doc = await ProjectDocument.findByIdAndDelete(id);
    if (!doc) {
      return sendError(res, 'Document not found.', [], 404);
    }
    return sendSuccess(res, 'Document deleted successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete document.', [], 500);
  }
}
