import { z } from 'zod';
import { VehicleType } from '@prisma/client';

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const estimateRideSchema = z.object({
  pickup: coordinatesSchema,
  destination: coordinatesSchema,
  vehicleType: z.enum(VehicleType),
});

export const createRideSchema = z.object({
  pickup: coordinatesSchema,
  destination: coordinatesSchema,
  vehicleType: z.enum(VehicleType),
  pickupAddress: z.string().trim().min(1).optional(),
  destinationAddress: z.string().trim().min(1).optional(),
});

export type EstimateRideInput = z.infer<typeof estimateRideSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
