import { z } from 'zod';
import { UserZodSchema } from 'src/types/user.type';

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be a 6 digit code.');

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

export const RequestPasswordResetDTO = z.object({
  email: UserZodSchema.shape.email,
});

export const VerifyPasswordResetOtpDTO = z.object({
  email: UserZodSchema.shape.email,
  otp: otpSchema,
});

export const ResetPasswordDTO = z
  .object({
    token: z.string().min(1, 'Reset token is required.'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type TRequestPasswordResetDTO = z.infer<typeof RequestPasswordResetDTO>;
export type TVerifyPasswordResetOtpDTO = z.infer<
  typeof VerifyPasswordResetOtpDTO
>;
export type TResetPasswordDTO = z.infer<typeof ResetPasswordDTO>;
