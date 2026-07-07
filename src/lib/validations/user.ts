import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required'),
  warehouseId: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters').optional(),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required').optional(),
  warehouseId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
