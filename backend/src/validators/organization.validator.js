import { z } from 'zod';
import mongoose from 'mongoose';

const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

export const createMinistrySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Ministry name is required' }).min(2).max(200).trim(),
    code: z.string({ required_error: 'Ministry code is required' }).min(2).max(50).trim().toUpperCase(),
    officialEmail: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable()
  })
});

export const createAgencySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Agency name is required' }).min(2).max(200).trim(),
    code: z.string({ required_error: 'Agency code is required' }).min(2).max(50).trim().toUpperCase(),
    parentOrganizationId: z
      .string()
      .refine(isValidObjectId, 'Invalid parent Ministry ID')
      .optional()
      .nullable(),
    officialEmail: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable()
  })
});
