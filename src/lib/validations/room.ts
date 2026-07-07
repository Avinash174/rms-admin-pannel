import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(255, 'Room name must be less than 255 characters'),
  code: z.string().min(1, 'Room code is required').max(50, 'Room code must be less than 50 characters').toUpperCase(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  isActive: z.boolean(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(255, 'Room name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Room code is required').max(50, 'Room code must be less than 50 characters').toUpperCase().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  warehouseId: z.string().min(1, 'Warehouse is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateRoomData = z.infer<typeof createRoomSchema>;
export type UpdateRoomData = z.infer<typeof updateRoomSchema>;
