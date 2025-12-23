import z from "zod";

export const signinSchema = z.object({
  email: z
    .email("Email address must be valid.")
    .min(1, "Email address can't be empty."),
  password: z
    .string()
    .min(1, "Password can't be empty.")
    .min(8, "Password must be between 8 to 16 characters.")
    .max(16, "Password must be between 8 to 16 characters."),
});

export type TSigninSchema = z.infer<typeof signinSchema>;

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name can't be empty.")
      .min(2, "First name can't be less than 2 characters."),
    lastName: z
      .string()
      .min(1, "Last name can't be empty.")
      .min(2, "Last name can't be less than 2 characters."),
    email: z
      .email("Email address must be valid.")
      .min(1, "Email address can't be empty."),
    password: z
      .string()
      .min(1, "Password can't be empty.")
      .min(8, "Password must be between 8 to 16 characters.")
      .max(16, "Password must be between 8 to 16 characters."),
    confirmPassword: z
      .string()
      .min(1, "Password can't be empty.")
      .min(8, "Password must be between 8 to 16 characters.")
      .max(16, "Password must be between 8 to 16 characters."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Please make sure your passwords match.",
  });

export type TSignupSchema = z.infer<typeof signupSchema>;
