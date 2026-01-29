import z from "zod";

export const adminCreateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name can't be empty.")
      .min(2, "Name can't be less than 2 characters."),
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
    role: z.enum(["user", "admin"]).optional(),
    provider: z.string().optional(),
    photo: z.instanceof(File).optional().or(z.null()),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Please make sure your passwords match.",
  });

export type TAdminCreateUserSchema = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name can't be less than 2 characters.")
      .optional()
      .or(z.literal("")),
    email: z.email("Email address must be valid.").optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be between 8 to 16 characters.")
      .max(16, "Password must be between 8 to 16 characters.")
      .optional()
      .or(z.literal("")),
    confirmPassword: z
      .string()
      .min(8, "Password must be between 8 to 16 characters.")
      .max(16, "Password must be between 8 to 16 characters.")
      .optional()
      .or(z.literal("")),
    role: z.enum(["user", "admin"]).optional(),
    provider: z.string().optional(),
    photo: z.instanceof(File).optional().or(z.null()),
  })
  .superRefine((value, ctx) => {
    const hasPassword = value.password && value.password.length > 0;
    const hasConfirm =
      value.confirmPassword && value.confirmPassword.length > 0;

    if (hasPassword || hasConfirm) {
      if (!hasPassword || !hasConfirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Password confirmation is required.",
        });
        return;
      }

      if (value.password !== value.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Please make sure your passwords match.",
        });
      }
    }
  });

export type TAdminUpdateUserSchema = z.infer<typeof adminUpdateUserSchema>;
