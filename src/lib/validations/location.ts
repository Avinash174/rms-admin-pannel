import { z } from 'zod';

export const createLocationSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters'),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  shelfId: z.string().min(1, 'Shelf is required'),
  isActive: z.boolean(),
});

export const updateLocationSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters').optional(),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  shelfId: z.string().min(1, 'Shelf is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateLocationData = z.infer<typeof createLocationSchema>;
export type UpdateLocationData = z.infer<typeof updateLocationSchema>;
