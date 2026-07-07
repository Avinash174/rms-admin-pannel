import { z } from 'zod';

export const createShelfSchema = z.object({
  name: z.string().min(1, 'Shelf name is required').max(255, 'Shelf name must be less than 255 characters'),
  code: z.string().min(1, 'Shelf code is required').max(50, 'Shelf code must be less than 50 characters').toUpperCase(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  rackId: z.string().min(1, 'Rack is required'),
  isActive: z.boolean(),
});

export const updateShelfSchema = z.object({
  name: z.string().min(1, 'Shelf name is required').max(255, 'Shelf name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Shelf code is required').max(50, 'Shelf code must be less than 50 characters').toUpperCase().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  rackId: z.string().min(1, 'Rack is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateShelfData = z.infer<typeof createShelfSchema>;
export type UpdateShelfData = z.infer<typeof updateShelfSchema>;
