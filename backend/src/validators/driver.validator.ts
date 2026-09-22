import { z } from 'zod';
import { VehicleType } from '@prisma/client';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateStatusSchema = z.object({
  online: z.boolean(),
});

export const createVehicleSchema = z.object({
  type: z.enum(VehicleType),
  brand: z.string().trim().min(1, 'brand is required'),
  model: z.string().trim().min(1, 'model is required'),
  plate: z.string().trim().min(1, 'plate is required'),
  color: z.string().trim().min(1, 'color is required'),
});

export const updateVehicleSchema = z.object({
  type: z.enum(VehicleType).optional(),
  brand: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  plate: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  // Setting this true makes this vehicle the driver's one active vehicle
  // and deactivates any others (see driver.service.ts#updateVehicle).
  isActive: z.boolean().optional(),
});

export const earningsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type EarningsQueryInput = z.infer<typeof earningsQuerySchema>;
