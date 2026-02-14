import z from "zod";

export const joinCollegeByCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "Invite code is required.")
    .max(32, "Invite code is invalid."),
  program: z.string().trim().optional(),
  year: z.number().int().min(1).max(10).optional(),
});

export const inviteStudentSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid student email."),
  program: z.string().trim().optional(),
  year: z.number().int().min(1).max(10).optional(),
});

export const updateCollegeProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "College name must be at least 2 characters long.")
    .max(255, "College name cannot exceed 255 characters."),
  institutionType: z.string().trim().optional(),
  location: z.string().trim().optional(),
  logo: z
    .custom<File | null>(
      (value) =>
        value === null ||
        (typeof File !== "undefined" && value instanceof File) ||
        value === undefined,
      "Only image files are allowed.",
    )
    .optional(),
});

export type TJoinCollegeByCodeSchema = z.infer<typeof joinCollegeByCodeSchema>;
export type TInviteStudentSchema = z.infer<typeof inviteStudentSchema>;
export type TUpdateCollegeProfileSchema = z.infer<
  typeof updateCollegeProfileSchema
>;
