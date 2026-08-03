import { z } from 'zod';

const roleNameSchema = z.enum([
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR',
  'OPERATOR',
  'VIEWER'
]);

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  role: roleNameSchema,
  warehouseIds: z.array(z.string()),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional().or(z.literal('')),
  role: roleNameSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
