import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, 'phone must be a valid phone number'),
  email: z.string().trim().email('email must be valid').optional(),
  password: z.string().min(8, 'password must be at least 8 characters'),
});

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
