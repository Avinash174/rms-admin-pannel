import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(255),
  code: z.string().min(1, 'Vendor code is required').max(50).toUpperCase(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  companyId: z.string().optional()
});

export type VendorFormData = z.infer<typeof vendorSchema>;
