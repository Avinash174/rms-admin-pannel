import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name must be less than 255 characters'),
  code: z.string().min(1, 'Client code is required').max(50, 'Client code must be less than 50 characters').toUpperCase(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name must be less than 255 characters').optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  contactPhone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone must be 7-15 digits with optional leading +').optional().or(z.literal('')).nullable(),
  isActive: z.boolean().optional(),
});

export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
