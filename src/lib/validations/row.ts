import { z } from 'zod';

export const createRowSchema = z.object({
  column: z.string().min(1, 'Column is required').max(50),
  rowPrefix: z.string().min(1, 'Row prefix is required').max(20),
  noOfRows: z.coerce.number().int().positive('No. of row must be greater than 0'),
  columnsInCell: z.coerce.number().int().positive('Columns in cell must be greater than 0'),
  rackId: z.string().min(1, 'Rack / Cupboard is required'),
  roomId: z.string().min(1, 'Room is required'),
  roomLocation: z.string().optional(),
  floor: z.string().max(100).optional(),
  capacityOfCell: z.coerce.number().int().positive('Capacity of cell is required'),
  isTemporaryLocation: z.boolean(),
  description: z.string().max(500).optional()
});

export const updateRowSchema = createRowSchema
  .omit({ noOfRows: true })
  .partial()
  .extend({
    code: z.string().min(1).max(20).optional(),
    isActive: z.boolean().optional(),
    roomId: z.string().min(1).optional()
  });

export type CreateRowData = z.infer<typeof createRowSchema>;
export type UpdateRowData = z.infer<typeof updateRowSchema>;
