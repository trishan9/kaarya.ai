import { z } from 'zod';
import { UserZodSchema } from 'src/types/user.type';

export const CreateUserDTO = UserZodSchema.pick({
  name: true,
  email: true,
  password: true,
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

export type TCreateUserDTO = z.infer<typeof CreateUserDTO>;
export type TLoginDTO = z.infer<typeof LoginDTO>;
