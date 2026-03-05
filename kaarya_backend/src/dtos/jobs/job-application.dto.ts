import z from 'zod';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { ApplicationStatus } from 'src/types/application-status.enum';

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

const optionalStringArray = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [value];
      }

      return [value];
    }

    return value;
  },
  z.array(z.string().trim().min(1)).max(10).optional(),
);

export const JobApplicationsQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ApplicationStatus).optional(),
});

export const MyJobApplicationsQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ApplicationStatus).optional(),
  fromDate: optionalDate,
  toDate: optionalDate,
});

const optionalYearMonth = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  },
  z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format.')
    .optional(),
);

const optionalStatuses = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const toTokenList = (entry: unknown) =>
      String(entry)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    if (Array.isArray(value)) {
      return value.flatMap((entry) => toTokenList(entry));
    }

    return toTokenList(value);
  },
  z.array(z.nativeEnum(ApplicationStatus)).min(1).max(10).optional(),
);

export const MyApplicationsSummaryQueryDTO = z.object({
  month: optionalYearMonth,
  statuses: optionalStatuses,
});

export const MyResumesQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateJobApplicationDTO = z.object({
  resumeId: ObjectIdDTO.optional(),
  coverLetter: optionalTrimmedText,
  portfolioLinks: optionalStringArray,
  resumeFileName: optionalTrimmedText,
  resumeUrl: optionalTrimmedText,
  resumePublicId: optionalTrimmedText,
  resumeMimeType: optionalTrimmedText,
  resumeFileSize: z.coerce.number().int().positive().optional(),
});

export const UploadMyResumeDTO = z.object({
  resumeFileName: optionalTrimmedText,
  resumeUrl: optionalTrimmedText,
  resumePublicId: optionalTrimmedText,
  resumeMimeType: optionalTrimmedText,
  resumeFileSize: z.coerce.number().int().positive().optional(),
});

export const UpdateJobApplicationDTO = z
  .object({
    status: z.nativeEnum(ApplicationStatus).optional(),
    interviewScheduledAt: optionalDate,
    interviewNote: optionalTrimmedText,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const UpdateResumeActivityDTO = z.object({
  action: z.enum(['viewed', 'downloaded']),
});

export type TJobApplicationsQueryDTO = z.infer<typeof JobApplicationsQueryDTO>;
export type TMyJobApplicationsQueryDTO = z.infer<
  typeof MyJobApplicationsQueryDTO
>;
export type TMyApplicationsSummaryQueryDTO = z.infer<
  typeof MyApplicationsSummaryQueryDTO
>;
export type TMyResumesQueryDTO = z.infer<typeof MyResumesQueryDTO>;
export type TCreateJobApplicationDTO = z.infer<typeof CreateJobApplicationDTO>;
export type TUploadMyResumeDTO = z.infer<typeof UploadMyResumeDTO>;
export type TUpdateJobApplicationDTO = z.infer<typeof UpdateJobApplicationDTO>;
export type TUpdateResumeActivityDTO = z.infer<typeof UpdateResumeActivityDTO>;
