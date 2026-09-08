import { z } from 'zod';
import mongoose from 'mongoose';
import { USER_ROLES, USER_STATUSES } from '../models/User.js';

const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

export const inviteUserSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters long')
      .max(120, 'Full name cannot exceed 120 characters')
      .trim(),
    officialEmail: z
      .string({ required_error: 'Official email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    mobileNumber: z
      .string({ required_error: 'Mobile number is required' })
      .regex(/^[0-9+ -]{10,15}$/, 'Invalid mobile number format')
      .trim(),
    designation: z
      .string({ required_error: 'Designation is required' })
      .min(1, 'Designation is required')
      .trim(),
    employeeId: z
      .string({ required_error: 'Employee ID is required' })
      .min(1, 'Employee ID is required')
      .trim(),
    department: z
      .string({ required_error: 'Department is required' })
      .min(1, 'Department is required')
      .trim(),
    role: z.enum(USER_ROLES, {
      required_error: 'Role is required'
    }),
    organizationId: z
      .string()
      .refine(isValidObjectId, 'Invalid organizationId format')
      .optional()
      .nullable(),
    projectIds: z
      .array(z.string().refine(isValidObjectId, 'Invalid projectId format'))
      .optional()
      .default([])
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().refine(isValidObjectId, 'Invalid user ID')
  }),
  body: z.object({
    fullName: z.string().min(2).max(120).trim().optional(),
    mobileNumber: z.string().regex(/^[0-9+ -]{10,15}$/).trim().optional(),
    designation: z.string().min(1).trim().optional(),
    employeeId: z.string().min(1).trim().optional(),
    department: z.string().min(1).trim().optional()
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().refine(isValidObjectId, 'Invalid user ID')
  }),
  body: z.object({
    status: z.enum(USER_STATUSES, {
      required_error: 'Status is required'
    })
  })
});

export const assignProjectSchema = z.object({
  params: z.object({
    id: z.string().refine(isValidObjectId, 'Invalid user ID')
  }),
  body: z.object({
    projectId: z
      .string({ required_error: 'Project ID is required' })
      .refine(isValidObjectId, 'Invalid project ID format')
  })
});

export const removeProjectSchema = z.object({
  params: z.object({
    id: z.string().refine(isValidObjectId, 'Invalid user ID'),
    projectId: z.string().refine(isValidObjectId, 'Invalid project ID')
  })
});
