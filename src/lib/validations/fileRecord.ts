import { z } from 'zod';

export const createFileRecordSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  referenceNumber: z.string().max(100, 'Reference number must be less than 100 characters').optional(),
  boxId: z.string().min(1, 'Box is required'),
  clientId: z.string().min(1, 'Client is required'),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
});

export const updateFileRecordSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(100, 'Barcode must be less than 100 characters').optional(),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  referenceNumber: z.string().max(100, 'Reference number must be less than 100 characters').optional(),
  boxId: z.string().min(1, 'Box is required').optional(),
  clientId: z.string().min(1, 'Client is required').optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateFileRecordData = z.infer<typeof createFileRecordSchema>;
export type UpdateFileRecordData = z.infer<typeof updateFileRecordSchema>;
