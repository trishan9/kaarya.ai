import { z } from 'zod';

const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol.')
  .refine((value) => !/\s/.test(value), {
    message: 'Password must not contain spaces.',
  });

export const ChangePasswordDTO = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match.',
  });

export type TChangePasswordDTO = z.infer<typeof ChangePasswordDTO>;
