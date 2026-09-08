import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  body: z.object({
    officialEmail: z
      .string({ required_error: 'Official email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required')
  })
});

export const activateSchema = z.object({
  body: z
    .object({
      token: z
        .string({ required_error: 'Activation token is required' })
        .min(1, 'Activation token is required'),
      password: passwordValidation,
      confirmPassword: z
        .string({ required_error: 'Password confirmation is required' })
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    officialEmail: z
      .string({ required_error: 'Official email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string({ required_error: 'Reset token is required' })
        .min(1, 'Reset token is required'),
      password: passwordValidation,
      confirmPassword: z
        .string({ required_error: 'Password confirmation is required' })
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
});
