import { z } from 'zod';

export const createBoxSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters'),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  locationId: z.string().min(1, 'Location is required'),
  clientId: z.string().min(1, 'Client is required'),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
});

export const updateBoxSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters').optional(),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  locationId: z.string().min(1, 'Location is required').optional(),
  clientId: z.string().min(1, 'Client is required').optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBoxData = z.infer<typeof createBoxSchema>;
export type UpdateBoxData = z.infer<typeof updateBoxSchema>;
