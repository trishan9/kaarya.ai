import { z } from 'zod';
import {
  RESUME_BUILDER_TEMPLATE_IDS,
  type ResumeBuilderTemplateId,
} from 'src/types/resume-builder.types';

const optionalString = z.preprocess(
  (value) => (value === null ? '' : value),
  z.string().trim().optional().or(z.literal('')),
);

const personalInfoSchema = z.object({
  firstName: optionalString,
  lastName: optionalString,
  jobTitle: optionalString,
  email: optionalString,
  phone: optionalString,
  city: optionalString,
  country: optionalString,
  linkedin: optionalString,
  github: optionalString,
  portfolio: optionalString,
});

const experienceItemSchema = z.object({
  id: z.string().optional(),
  company: optionalString,
  position: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  currentlyWorking: z.boolean().optional(),
  bulletPoints: z.array(z.string()).optional(),
});

const educationItemSchema = z.object({
  id: z.string().optional(),
  school: optionalString,
  degree: optionalString,
  major: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  coursework: optionalString,
});

const projectItemSchema = z.object({
  id: z.string().optional(),
  name: optionalString,
  description: optionalString,
  url: optionalString,
  technologies: optionalString,
});

const achievementItemSchema = z.object({
  id: z.string().optional(),
  text: optionalString,
});

export const resumeBuilderContentSchema = z.object({
  personalInfo: personalInfoSchema.optional().nullable(),
  professionalSummary: optionalString.nullable(),
  targetRole: optionalString.nullable(),
  experience: z.array(experienceItemSchema).optional(),
  education: z.array(educationItemSchema).optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(projectItemSchema).optional(),
  achievements: z.array(achievementItemSchema).optional(),
});

const templateIdSchema = z.enum(
  RESUME_BUILDER_TEMPLATE_IDS as unknown as [ResumeBuilderTemplateId, ...ResumeBuilderTemplateId[]],
);

export const createResumeBuilderDTO = z.object({
  title: z.string().trim().min(1).optional().default('Untitled Resume'),
  targetRole: optionalString.nullable().optional(),
  templateId: templateIdSchema.optional().default('professional'),
  content: resumeBuilderContentSchema.optional().default({}),
});
export type TCreateResumeBuilderDTO = z.infer<typeof createResumeBuilderDTO>;

export const updateResumeBuilderDTO = z.object({
  title: z.string().trim().min(1).optional(),
  targetRole: optionalString.nullable().optional(),
  templateId: templateIdSchema.optional(),
  content: resumeBuilderContentSchema.optional(),
});
export type TUpdateResumeBuilderDTO = z.infer<typeof updateResumeBuilderDTO>;

export const listResumeBuilderQueryDTO = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  size: z.coerce.number().int().min(1).max(50).optional().default(10),
});
export type TListResumeBuilderQueryDTO = z.infer<typeof listResumeBuilderQueryDTO>;

export const aiSummaryDTO = z.object({
  targetRole: optionalString.optional(),
  professionalSummary: optionalString.optional(),
  experience: z.array(experienceItemSchema).optional(),
  education: z.array(educationItemSchema).optional(),
  skills: z.array(z.string()).optional(),
});
export type TAiSummaryDTO = z.infer<typeof aiSummaryDTO>;

export const aiExperienceBulletsDTO = z.object({
  targetRole: optionalString.optional(),
  position: optionalString.optional(),
  company: optionalString.optional(),
  description: z.string().trim().min(1),
});
export type TAiExperienceBulletsDTO = z.infer<typeof aiExperienceBulletsDTO>;

export const aiSuggestionsDTO = z.object({
  focus: z
    .enum(['setup', 'personal', 'summary', 'skills'])
    .optional()
    .default('summary'),
  targetRole: optionalString.optional(),
  personalInfo: personalInfoSchema.optional().nullable(),
  professionalSummary: optionalString.optional(),
  experience: z.array(experienceItemSchema).optional(),
  education: z.array(educationItemSchema).optional(),
  skills: z.array(z.string()).optional(),
});
export type TAiSuggestionsDTO = z.infer<typeof aiSuggestionsDTO>;

export const atsScanBodyDTO = z.object({
  targetRole: z.string().trim().optional(),
  experienceLevel: z.string().trim().optional(),
  jobDescription: z.string().trim().optional(),
});
export type TAtsScanBodyDTO = z.infer<typeof atsScanBodyDTO>;
