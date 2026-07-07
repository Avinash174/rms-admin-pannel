import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Warehouse name must be less than 255 characters'),
  code: z.string().min(1, 'Warehouse code is required').max(50, 'Warehouse code must be less than 50 characters').toUpperCase(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  siteId: z.string().min(1, 'Site is required'),
  isActive: z.boolean(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Warehouse name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Warehouse code is required').max(50, 'Warehouse code must be less than 50 characters').toUpperCase().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  siteId: z.string().min(1, 'Site is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateWarehouseData = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseData = z.infer<typeof updateWarehouseSchema>;
