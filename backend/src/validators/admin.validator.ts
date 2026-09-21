import { z } from 'zod';
import { DriverVerificationStatus, RideStatus, UserRole, VehicleType } from '@prisma/client';

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const listUsersQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  role: z.enum(UserRole).optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listDriversQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
});

export const updateDriverVerificationSchema = z.object({
  status: z.enum(DriverVerificationStatus),
});

export const listVehiclesQuerySchema = pageQuerySchema;

export const createVehicleSchema = z.object({
  driverId: z.string().uuid(),
  type: z.enum(VehicleType),
  plate: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateVehicleSchema = z.object({
  type: z.enum(VehicleType).optional(),
  plate: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listRidesQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: z.enum(RideStatus).optional(),
});

export const createCitySchema = z.object({
  name: z.string().trim().min(1),
});

export const updateCitySchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createZoneSchema = z.object({
  cityId: z.string().uuid(),
  name: z.string().trim().min(1),
});

export const updateZoneSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updatePricingSchema = z.object({
  baseFare: z.number().positive(),
  pricePerKm: z.number().positive(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;
export type UpdateDriverVerificationInput = z.infer<typeof updateDriverVerificationSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type ListRidesQuery = z.infer<typeof listRidesQuerySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
