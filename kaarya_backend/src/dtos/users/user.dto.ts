import { z } from 'zod';
import { UserZodSchema } from 'src/types/user.type';
import { CandidateProfileZodSchema } from 'src/types/candidate-profile.type';

export const CreateUserDTO = UserZodSchema.pick({
  name: true,
  email: true,
  password: true,
  provider: true,
  role: true,
  photo: true,
})
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const LoginDTO = UserZodSchema.pick({
  email: true,
  password: true,
});

export const UpdateUserDTO = UserZodSchema.omit({
  passwordChangedAt: true,
}).partial();

const candidateProfileFromPayload = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}, CandidateProfileZodSchema);

export const UpdateMeDTO = z
  .object({
    name: UserZodSchema.shape.name.optional(),
    email: UserZodSchema.shape.email.optional(),
    photo: UserZodSchema.shape.photo.optional(),
    candidateProfile: candidateProfileFromPayload.optional(),
  })
  .partial();

export type TCreateUserDTO = z.infer<typeof CreateUserDTO>;
export type TLoginDTO = z.infer<typeof LoginDTO>;
export type TUpdateMeDTO = z.infer<typeof UpdateMeDTO>;
export type TUpdateUserDTO = z.infer<typeof UpdateUserDTO>;
