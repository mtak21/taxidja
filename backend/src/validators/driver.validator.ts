import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateStatusSchema = z.object({
  online: z.boolean(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
