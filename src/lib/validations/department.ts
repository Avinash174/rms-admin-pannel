import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255, 'Department name must be less than 255 characters'),
  code: z.string().min(1, 'Department code is required').max(50, 'Department code must be less than 50 characters').toUpperCase(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  clientId: z.string().min(1, 'Client is required'),
  isActive: z.boolean(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255, 'Department name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Department code is required').max(50, 'Department code must be less than 50 characters').toUpperCase().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  clientId: z.string().min(1, 'Client is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentData = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentData = z.infer<typeof updateDepartmentSchema>;
