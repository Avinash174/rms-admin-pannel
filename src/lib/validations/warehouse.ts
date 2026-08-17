import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Warehouse name must be less than 255 characters'),
  code: z.string().min(1, 'Warehouse code is required').max(50, 'Warehouse code must be less than 50 characters').toUpperCase(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.number().int().positive('Zip code must be a positive number').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  siteId: z.string().min(1, 'Site is required'),
  isActive: z.boolean(),
  admin: z.object({
    fullName: z.string().min(1, 'Admin full name is required'),
    email: z.string().email('Valid admin email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional()
  }).optional()
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Warehouse name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Warehouse code is required').max(50, 'Warehouse code must be less than 50 characters').toUpperCase().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.number().int().positive('Zip code must be a positive number').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  siteId: z.string().min(1, 'Site is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateWarehouseData = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseData = z.infer<typeof updateWarehouseSchema>;
