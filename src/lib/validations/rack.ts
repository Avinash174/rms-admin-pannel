import { z } from 'zod';

export const createRackSchema = z.object({
  name: z.string().min(1, 'Rack / Cupboard name is required').max(255),
  code: z.string().min(1, 'Rack code is required').max(50).toUpperCase(),
  description: z.string().max(500).optional(),
  floor: z.string().max(100).optional(),
  roomId: z.string().min(1, 'Room / Location is required'),
  isActive: z.boolean(),
});

export const updateRackSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).toUpperCase().optional(),
  description: z.string().max(500).optional(),
  floor: z.string().max(100).optional(),
  roomId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateRackData = z.infer<typeof createRackSchema>;
export type UpdateRackData = z.infer<typeof updateRackSchema>;

export function generateRackCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (cleaned || 'RACK').slice(0, 10);
}
