import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name must be less than 255 characters'),
  code: z.string().min(1, 'Branch code is required').max(50, 'Branch code must be less than 50 characters').toUpperCase(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(255, 'Branch name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Branch code is required').max(50, 'Branch code must be less than 50 characters').toUpperCase().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CreateBranchData = z.infer<typeof createBranchSchema>;
export type UpdateBranchData = z.infer<typeof updateBranchSchema>;
