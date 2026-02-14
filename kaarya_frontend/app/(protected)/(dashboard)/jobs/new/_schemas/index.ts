import z from "zod";

export const createJobPostingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long.")
    .max(255, "Title cannot exceed 255 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters long.")
    .refine((value) => value.replace(/<[^>]+>/g, " ").trim().length >= 20, {
      message: "Description must include at least 20 characters of text.",
    }),
  location: z.string().trim().optional(),
  employmentType: z.string().trim().optional(),
  engagementType: z.string().trim().optional(),
  workMode: z.enum(["remote", "onsite", "hybrid"]),
  salaryRange: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).max(30).optional(),
  deadline: z
    .string()
    .min(1, "Application deadline is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Deadline must be a valid date.",
    }),
});

export type TCreateJobPostingSchema = z.infer<typeof createJobPostingSchema>;
