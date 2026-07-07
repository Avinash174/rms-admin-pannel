import { z } from 'zod';

export const createDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').max(100, 'Device ID must be less than 100 characters'),
  name: z.string().min(1, 'Device name is required').max(255, 'Device name must be less than 255 characters'),
  type: z.enum(['SCANNER', 'TABLET', 'PHONE', 'OTHER']),
  model: z.string().max(100, 'Model must be less than 100 characters').optional(),
  serialNumber: z.string().max(100, 'Serial number must be less than 100 characters').optional(),
  userId: z.string().optional(),
  isActive: z.boolean(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(255, 'Device name must be less than 255 characters').optional(),
  type: z.enum(['SCANNER', 'TABLET', 'PHONE', 'OTHER']).optional(),
  model: z.string().max(100, 'Model must be less than 100 characters').optional(),
  serialNumber: z.string().max(100, 'Serial number must be less than 100 characters').optional(),
  userId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDeviceData = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceData = z.infer<typeof updateDeviceSchema>;
