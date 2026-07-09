import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name must be less than 255 characters'),
  code: z.string().min(1, 'Branch code is required').max(50, 'Branch code must be less than 50 characters').toUpperCase(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be less than 100 characters').optional().or(z.literal('')),
  state: z.string().max(100, 'State must be less than 100 characters').optional().or(z.literal('')),
  country: z.string().max(100, 'Country must be less than 100 characters').optional().or(z.literal('')),
  zipCode: z.number().int().positive('Zip code must be a positive number').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Branch code is required').max(50, 'Branch code must be less than 50 characters').toUpperCase().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be less than 100 characters').optional().or(z.literal('')),
  state: z.string().max(100, 'State must be less than 100 characters').optional().or(z.literal('')),
  country: z.string().max(100, 'Country must be less than 100 characters').optional().or(z.literal('')),
  zipCode: z.number().int().positive('Zip code must be a positive number').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CreateBranchData = z.infer<typeof createBranchSchema>;
export type UpdateBranchData = z.infer<typeof updateBranchSchema>;
