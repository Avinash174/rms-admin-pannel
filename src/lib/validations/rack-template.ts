import { z } from 'zod';

export const rackTemplateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  code: z.string().min(1, 'Template code is required').max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  warehouseType: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'CUSTOM']),
  rowsCount: z.coerce.number().int().positive('Rows must be greater than 0'),
  racksCount: z.coerce.number().int().positive('Racks must be greater than 0'),
  levelsCount: z.coerce.number().int().positive('Levels must be greater than 0'),
  locationPerLevel: z.coerce.number().int().positive('Locations must be greater than 0'),
  rowPrefix: z.string().min(1).max(20),
  rackPrefix: z.string().min(1).max(20),
  levelPrefix: z.string().min(1).max(20),
  locationPrefix: z.string().min(1).max(20),
  locationPadding: z.coerce.number().int().min(1).max(6),
  locationNaming: z.enum(['AUTO', 'MANUAL']),
  status: z.enum(['ACTIVE', 'INACTIVE'])
});

export const cloneTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50).toUpperCase()
});

export const applyTemplateSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  roomId: z.string().min(1, 'Room is required')
});

export type RackTemplateFormData = z.infer<typeof rackTemplateFormSchema>;

export const WAREHOUSE_TYPE_PRESETS: Record<
  'SMALL' | 'MEDIUM' | 'LARGE',
  Pick<RackTemplateFormData, 'rowsCount' | 'racksCount' | 'levelsCount' | 'locationPerLevel'>
> = {
  SMALL: { rowsCount: 1, racksCount: 2, levelsCount: 3, locationPerLevel: 3 },
  MEDIUM: { rowsCount: 2, racksCount: 4, levelsCount: 5, locationPerLevel: 5 },
  LARGE: { rowsCount: 4, racksCount: 6, levelsCount: 8, locationPerLevel: 8 }
};
