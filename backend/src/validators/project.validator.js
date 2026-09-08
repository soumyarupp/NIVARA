import { z } from 'zod';
import mongoose from 'mongoose';

const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

export const createProjectSchema = z.object({
  body: z.object({
    projectName: z.string({ required_error: 'Project name is required' }).min(2).trim(),
    projectCode: z.string({ required_error: 'Project code is required' }).min(2).trim().toUpperCase(),
    description: z.string().optional().default(''),
    lineMinistryId: z.string().refine(isValidObjectId, 'Invalid lineMinistryId').optional().nullable(),
    implementingAgencyId: z.string().refine(isValidObjectId, 'Invalid implementingAgencyId').optional().nullable(),
    budgetEstimatedInCrores: z.number().nonnegative().optional().default(0)
  })
});

export const assignOfficersToProjectSchema = z.object({
  params: z.object({
    id: z.string().refine(isValidObjectId, 'Invalid project ID')
  }),
  body: z.object({
    reportingOfficerId: z.string().refine(isValidObjectId, 'Invalid reportingOfficerId').optional().nullable(),
    nodalOfficerId: z.string().refine(isValidObjectId, 'Invalid nodalOfficerId').optional().nullable()
  })
});
