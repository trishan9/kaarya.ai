import { z } from 'zod';
import { UserZodSchema } from 'src/types/user.type';

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
  tokenVersion: true,
}).partial();

export const UpdateMeDTO = UserZodSchema.pick({
  name: true,
  email: true,
  photo: true,
}).partial();

export type TCreateUserDTO = z.infer<typeof CreateUserDTO>;
export type TLoginDTO = z.infer<typeof LoginDTO>;
export type TUpdateMeDTO = z.infer<typeof UpdateMeDTO>;
export type TUpdateUserDTO = z.infer<typeof UpdateUserDTO>;
