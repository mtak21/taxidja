import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'oldPassword is required'),
  newPassword: z.string().min(8, 'newPassword must be at least 8 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
