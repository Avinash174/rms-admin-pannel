import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name must be less than 255 characters'),
  code: z.string().min(1, 'Client code is required').max(50, 'Client code must be less than 50 characters').toUpperCase(),
  contactPerson: z.string().max(100, 'Contact person must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  isActive: z.boolean(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255, 'Client name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Client code is required').max(50, 'Client code must be less than 50 characters').toUpperCase().optional(),
  contactPerson: z.string().max(100, 'Contact person must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(100, 'State must be less than 100 characters').optional(),
  country: z.string().max(100, 'Country must be less than 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be less than 20 characters').optional(),
  isActive: z.boolean().optional(),
});

export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
