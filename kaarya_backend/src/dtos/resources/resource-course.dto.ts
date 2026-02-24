import z from 'zod';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { ResourceCourseDifficulty } from 'src/types/resource-course-difficulty.enum';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { ResourceCourseSource } from 'src/types/resource-course-source.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().min(1).optional());

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  return value;
}, z.boolean().optional());

const optionalStringArray = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string().trim().min(1)).default([]));

const optionalUrlArray = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string().trim().url()).default([]));

export const CreateResourceCourseDTO = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Course name must be at least 2 characters long.')
    .max(180, 'Course name cannot exceed 180 characters.'),
  description: optionalTrimmedText,
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters long.')
    .max(120, 'Category cannot exceed 120 characters.'),
  generationMode: z
    .nativeEnum(ResourceCourseGenerationMode)
    .optional()
    .default(ResourceCourseGenerationMode.LEARN),
  difficulty: z.nativeEnum(ResourceCourseDifficulty),
  targetRoles: z
    .array(z.string().trim().min(2).max(120))
    .min(1, 'At least one target role is required.')
    .max(12, 'Target roles cannot exceed 12 items.'),
  chapterCount: z.coerce.number().int().min(1).max(14).default(6),
  chapterTitles: z
    .array(z.string().trim().min(2).max(180))
    .max(14)
    .optional()
    .default([]),
  visibility: z
    .nativeEnum(ResourceCourseVisibility)
    .optional()
    .default(ResourceCourseVisibility.PRIVATE),
  includeVideoRecommendations: optionalBoolean.default(true),
  customVideoUrls: optionalUrlArray,
  promptContext: optionalTrimmedText,
  jobDescriptionContext: optionalTrimmedText,
  companyId: ObjectIdDTO.optional(),
  collegeId: ObjectIdDTO.optional(),
});

export const UpdateResourceCourseDTO = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: optionalTrimmedText,
    category: z.string().trim().min(2).max(120).optional(),
    generationMode: z.nativeEnum(ResourceCourseGenerationMode).optional(),
    difficulty: z.nativeEnum(ResourceCourseDifficulty).optional(),
    targetRoles: z.array(z.string().trim().min(2).max(120)).min(1).max(12).optional(),
    chapterCount: z.coerce.number().int().min(1).max(14).optional(),
    chapterTitles: z.array(z.string().trim().min(2).max(180)).max(14).optional(),
    visibility: z.nativeEnum(ResourceCourseVisibility).optional(),
    includeVideoRecommendations: optionalBoolean,
    customVideoUrls: optionalUrlArray.optional(),
    promptContext: optionalTrimmedText,
    jobDescriptionContext: optionalTrimmedText,
    regenerateContent: optionalBoolean.default(false),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const ResourceCourseListQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(12),
  search: optionalTrimmedText,
  category: optionalTrimmedText,
  difficulty: z.nativeEnum(ResourceCourseDifficulty).optional(),
  visibility: z.nativeEnum(ResourceCourseVisibility).optional(),
  source: z.nativeEnum(ResourceCourseSource).optional(),
  ownership: z.enum(['all', 'mine', 'public']).default('all'),
  sortBy: z.enum(['newest', 'updated', 'title']).default('newest'),
});

export type TCreateResourceCourseDTO = z.infer<typeof CreateResourceCourseDTO>;
export type TUpdateResourceCourseDTO = z.infer<typeof UpdateResourceCourseDTO>;
export type TResourceCourseListQueryDTO = z.infer<typeof ResourceCourseListQueryDTO>;
export type TResourceCourseContentChapterSectionDTO = {
  heading: string;
  subheadings: string[];
  summary?: string | null;
  content: string[];
};
export type TResourceCourseContentChapterVideoDTO = {
  title: string;
  youtubeUrl: string;
  reason?: string | null;
};
export type TResourceCourseContentChapterDTO = {
  title: string;
  overview?: string | null;
  estimatedMinutes: number;
  material: string[];
  sections: TResourceCourseContentChapterSectionDTO[];
  learningObjectives: string[];
  coreConcepts: Array<{
    concept: string;
    theory?: string | null;
    explanation?: string | null;
    interviewApplication?: string | null;
  }>;
  interviewQuestions: Array<{
    question: string;
    whyAsked?: string | null;
    answerFramework?: string | null;
    sampleAnswer?: string | null;
  }>;
  practicePrompts: string[];
  youtubeVideos: TResourceCourseContentChapterVideoDTO[];
};
