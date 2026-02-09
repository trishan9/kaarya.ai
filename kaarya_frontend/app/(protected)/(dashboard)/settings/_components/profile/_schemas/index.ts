import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name can't be empty.")
    .min(2, "Name must be at least 2 characters."),
  email: z
    .email("Email address must be valid.")
    .min(1, "Email address can't be empty."),
  photo: z.instanceof(File).optional().nullable(),
});

export type TUpdateProfileSchema = z.infer<typeof updateProfileSchema>;
