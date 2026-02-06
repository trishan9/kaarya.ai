import z from "zod";

const strongPasswordSchema = z
  .string()
  .min(1, "Password can't be empty.")
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.")
  .refine((value) => !/\s/.test(value), {
    message: "Password must not contain spaces.",
  });

export const signinSchema = z.object({
  email: z
    .email("Email address must be valid.")
    .min(1, "Email address can't be empty."),
  password: strongPasswordSchema,
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
    password: strongPasswordSchema,
    confirmPassword: strongPasswordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Please make sure your passwords match.",
  });

export type TSignupSchema = z.infer<typeof signupSchema>;

export const requestPasswordResetSchema = z.object({
  email: z
    .email("Email address must be valid.")
    .min(1, "Email address can't be empty."),
});

export type TRequestPasswordResetSchema = z.infer<
  typeof requestPasswordResetSchema
>;

export const verifyPasswordResetOtpSchema = z.object({
  email: z
    .email("Email address must be valid.")
    .min(1, "Email address can't be empty."),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Verification code must be a 6 digit code."),
});

export type TVerifyPasswordResetOtpSchema = z.infer<
  typeof verifyPasswordResetOtpSchema
>;

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().min(1, "Reset session has expired. Please verify again."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Please make sure your passwords match.",
  });

export type TConfirmPasswordResetSchema = z.infer<
  typeof confirmPasswordResetSchema
>;

export const resetPasswordFormSchema = confirmPasswordResetSchema.omit({
  token: true,
});

export type TResetPasswordFormSchema = z.infer<typeof resetPasswordFormSchema>;
