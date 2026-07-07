import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name must be less than 255 characters'),
  code: z.string().min(1, 'Company code is required').max(50, 'Company code must be less than 50 characters').toUpperCase(),
  isActive: z.boolean(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Company code is required').max(50, 'Company code must be less than 50 characters').toUpperCase().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
