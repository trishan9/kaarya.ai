import z from "zod";

export const createCompanyWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters long.")
    .max(255, "Company name cannot exceed 255 characters."),
  industry: z.string().trim().optional(),
  location: z.string().trim().optional(),
  designation: z.string().trim().optional(),
});

export const joinWorkspaceByCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "Invite code is required.")
    .max(32, "Invite code is invalid."),
  designation: z.string().trim().optional(),
});

export const inviteRecruiterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid recruiter email."),
  designation: z.string().trim().optional(),
});

export const updateCompanyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters long.")
    .max(255, "Company name cannot exceed 255 characters."),
  industry: z.string().trim().optional(),
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

export type TCreateCompanyWorkspaceSchema = z.infer<
  typeof createCompanyWorkspaceSchema
>;
export type TJoinWorkspaceByCodeSchema = z.infer<typeof joinWorkspaceByCodeSchema>;
export type TInviteRecruiterSchema = z.infer<typeof inviteRecruiterSchema>;
export type TUpdateCompanyProfileSchema = z.infer<
  typeof updateCompanyProfileSchema
>;
