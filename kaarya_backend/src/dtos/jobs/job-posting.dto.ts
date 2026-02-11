import z from 'zod';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const optionalDate = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}, z.coerce.date().optional());

export const CreateJobPostingDTO = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters long.')
    .max(255, 'Title cannot exceed 255 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long.'),
  location: optionalTrimmedText,
  employmentType: optionalTrimmedText,
  engagementType: optionalTrimmedText,
  workMode: z.nativeEnum(JobWorkMode).optional(),
  salaryRange: optionalTrimmedText,
  requirements: z.record(z.string(), z.unknown()).default({}),
  deadline: z.coerce.date(),
  status: z.nativeEnum(JobPostingStatus).optional(),
  companyId: ObjectIdDTO.optional(),
});

export const UpdateJobPostingDTO = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Title must be at least 2 characters long.')
      .max(255, 'Title cannot exceed 255 characters.')
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters long.')
      .optional(),
    location: optionalTrimmedText,
    employmentType: optionalTrimmedText,
    engagementType: optionalTrimmedText,
    workMode: z.nativeEnum(JobWorkMode).optional(),
    salaryRange: optionalTrimmedText,
    requirements: z.record(z.string(), z.unknown()).optional(),
    deadline: z.coerce.date().optional(),
    status: z.nativeEnum(JobPostingStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const JobPostingQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  feed: z.nativeEnum(JobFeedFilter).default(JobFeedFilter.ALL),
  search: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(1).optional()),
  status: z.nativeEnum(JobPostingStatus).optional(),
  companyId: ObjectIdDTO.optional(),
  location: optionalTrimmedText,
  employmentType: optionalTrimmedText,
  engagementType: optionalTrimmedText,
  workMode: z.nativeEnum(JobWorkMode).optional(),
  remoteOnly: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  }, z.boolean().optional()),
  deadlineFrom: optionalDate,
  deadlineTo: optionalDate,
});

export const JobPostingIdParamDTO = z.object({
  id: ObjectIdDTO,
});

export const JobMetricsQueryDTO = z.object({
  syncApplicationsCount: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  }, z.boolean().default(true)),
});

export const JobApplicationsQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ApplicationStatus).optional(),
});

export type TCreateJobPostingDTO = z.infer<typeof CreateJobPostingDTO>;
export type TUpdateJobPostingDTO = z.infer<typeof UpdateJobPostingDTO>;
export type TJobPostingQueryDTO = z.infer<typeof JobPostingQueryDTO>;
export type TJobPostingIdParamDTO = z.infer<typeof JobPostingIdParamDTO>;
export type TJobMetricsQueryDTO = z.infer<typeof JobMetricsQueryDTO>;
export type TJobApplicationsQueryDTO = z.infer<typeof JobApplicationsQueryDTO>;
