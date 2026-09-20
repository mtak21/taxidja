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

export const rateRideSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).optional(),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type EstimateRideInput = z.infer<typeof estimateRideSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
export type RateRideInput = z.infer<typeof rateRideSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
