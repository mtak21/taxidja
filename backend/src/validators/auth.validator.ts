import { z } from 'zod';
import { VehicleType } from '@prisma/client';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{8,15}$/, 'phone must be a valid phone number');

const baseRegisterFields = {
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: phoneSchema,
  email: z.string().trim().email('email must be valid').optional(),
  password: z.string().min(8, 'password must be at least 8 characters'),
};

// A closed set of literals — structurally impossible to register as ADMIN
// through this endpoint (ADMIN accounts only come from the Prisma seed or a
// manual promotion, never from public self-registration).
const passengerRegisterSchema = z.object({
  ...baseRegisterFields,
  role: z.literal('PASSENGER'),
});

const driverRegisterSchema = z.object({
  ...baseRegisterFields,
  role: z.literal('DRIVER'),
  vehicleType: z.enum(VehicleType),
  vehicleBrand: z.string().trim().min(1, 'vehicleBrand is required'),
  vehicleModel: z.string().trim().min(1, 'vehicleModel is required'),
  vehiclePlate: z.string().trim().min(1, 'vehiclePlate is required'),
  vehicleColor: z.string().trim().min(1, 'vehicleColor is required'),
  licenseNumber: z.string().trim().min(1, 'licenseNumber is required'),
  licenseExpiry: z.coerce.date(),
});

// role defaults to PASSENGER when omitted, so existing callers that never
// sent a role keep working unchanged.
export const registerSchema = z.preprocess((input) => {
  if (input && typeof input === 'object' && !('role' in input)) {
    return { ...input, role: 'PASSENGER' };
  }
  return input;
}, z.discriminatedUnion('role', [passengerRegisterSchema, driverRegisterSchema]));

export const loginSchema = z
  .object({
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(1, 'password is required'),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: 'phone or email is required',
    path: ['phone'],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
