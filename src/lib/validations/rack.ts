import { z } from 'zod';

export const createRackSchema = z.object({
  name: z.string().min(1, 'Rack name is required').max(255, 'Rack name must be less than 255 characters'),
  code: z.string().min(1, 'Rack code is required').max(50, 'Rack code must be less than 50 characters').toUpperCase(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  roomId: z.string().min(1, 'Room is required'),
  isActive: z.boolean(),
});

export const updateRackSchema = z.object({
  name: z.string().min(1, 'Rack name is required').max(255, 'Rack name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Rack code is required').max(50, 'Rack code must be less than 50 characters').toUpperCase().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  roomId: z.string().min(1, 'Room is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateRackData = z.infer<typeof createRackSchema>;
export type UpdateRackData = z.infer<typeof updateRackSchema>;
