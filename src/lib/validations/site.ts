import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(255, 'Site name must be less than 255 characters'),
  code: z.string().min(1, 'Site code is required').max(50, 'Site code must be less than 50 characters').toUpperCase(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  branchId: z.string().min(1, 'Branch is required'),
  isActive: z.boolean(),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(255, 'Site name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Site code is required').max(50, 'Site code must be less than 50 characters').toUpperCase().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  branchId: z.string().min(1, 'Branch is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateSiteData = z.infer<typeof createSiteSchema>;
export type UpdateSiteData = z.infer<typeof updateSiteSchema>;
