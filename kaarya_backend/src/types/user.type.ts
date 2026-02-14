import z from 'zod';
import { AuthProvider } from './auth-provider.enum';

export const UserZodSchema = z.object({
  name: z
    .string()
    .min(1, "Name can't be empty.")
    .min(2, "Name can't be less than 2 characters."),
  email: z
    .email('Email address must be valid.')
    .min(1, "Email address can't be empty."),
  password: z
    .string()
    .min(1, "Password can't be empty.")
    .min(8, 'Password must be between 8 to 16 characters.')
    .max(16, 'Password must be between 8 to 16 characters.'),
  passwordChangedAt: z.date().optional(),
  role: z
    .enum(['user', 'admin', 'student', 'college', 'recruiter', 'faculty'])
    .optional(),
  provider: z.nativeEnum(AuthProvider).optional(),
  socialId: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

export type TUser = z.infer<typeof UserZodSchema>;
