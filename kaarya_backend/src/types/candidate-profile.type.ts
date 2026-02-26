import z from 'zod';

const optionalTrimmedText = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().max(maxLength).optional());

const DATE_VALUE_REGEX = /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;

const parseProfileDate = (value?: string) => {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const optionalDateText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(20).regex(DATE_VALUE_REGEX, 'Date must be in YYYY-MM or YYYY-MM-DD format.').optional());

const optionalUrlText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.url().max(2048).optional());

const optionalPhoneText = z
  .preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().max(40).optional())
  .refine(
    (value) => value === undefined || /^[+\d][\d\s().-]{6,39}$/.test(value),
    'Enter a valid phone number.',
  );

const normalizedStringArray = (maxLength: number, maxItems = 50) =>
  z
    .array(z.string().trim().min(1).max(maxLength))
    .max(maxItems)
    .transform((items) => {
      const seen = new Set<string>();
      const unique: string[] = [];
      items.forEach((item) => {
        const trimmed = item.trim();
        const key = trimmed.toLowerCase();
        if (!trimmed || seen.has(key)) return;
        seen.add(key);
        unique.push(trimmed);
      });
      return unique;
    });

const normalizedUrlArray = (maxItems = 20) =>
  z
    .array(z.string().trim().max(2048).url('Enter a valid URL.'))
    .max(maxItems)
    .transform((items) => {
      const seen = new Set<string>();
      const unique: string[] = [];
      items.forEach((item) => {
        const normalized = item.trim();
        if (!normalized) return;
        const key = normalized.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(normalized);
      });
      return unique;
    });

const candidateSalarySchema = z
  .object({
    currency: optionalTrimmedText(16),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    period: z.enum(['yearly', 'monthly', 'hourly']).optional(),
    isNegotiable: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (
      typeof value.minAmount === 'number' &&
      typeof value.maxAmount === 'number' &&
      value.maxAmount < value.minAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxAmount'],
        message: 'Maximum salary must be greater than minimum salary.',
      });
    }

    if (
      typeof value.minAmount === 'number' ||
      typeof value.maxAmount === 'number'
    ) {
      if (!value.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currency'],
          message: 'Currency is required when salary amount is set.',
        });
      }
      if (!value.period) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['period'],
          message: 'Salary period is required when salary amount is set.',
        });
      }
    }
  });

const candidateEducationItemSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    institution: z.string().trim().min(1).max(180),
    degree: z.string().trim().min(1).max(140),
    fieldOfStudy: optionalTrimmedText(140),
    startDate: optionalDateText,
    endDate: optionalDateText,
    grade: optionalTrimmedText(64),
    description: optionalTrimmedText(1200),
  })
  .superRefine((value, ctx) => {
    const start = parseProfileDate(value.startDate);
    const end = parseProfileDate(value.endDate);
    if (start && end && end.getTime() < start.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date.',
      });
    }
  });

const candidateExperienceItemSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    jobTitle: z.string().trim().min(1).max(160),
    companyName: z.string().trim().min(1).max(180),
    location: optionalTrimmedText(160),
    employmentType: optionalTrimmedText(80),
    startDate: optionalDateText,
    endDate: optionalDateText,
    currentlyWorking: z.boolean().optional().default(false),
    description: optionalTrimmedText(2000),
  })
  .superRefine((value, ctx) => {
    if (value.currentlyWorking && value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be empty for a current role.',
      });
      return;
    }

    const start = parseProfileDate(value.startDate);
    const end = parseProfileDate(value.endDate);
    if (start && end && end.getTime() < start.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date.',
      });
    }
  });

const candidateCertificationItemSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(180),
    issuer: z.string().trim().min(1).max(180),
    issueDate: optionalDateText,
    expiryDate: optionalDateText,
    credentialId: optionalTrimmedText(120),
    credentialUrl: optionalUrlText,
    mediaUrl: optionalUrlText,
    mediaMimeType: optionalTrimmedText(120),
    noExpiry: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.noExpiry && value.expiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date must be empty when no-expiry is enabled.',
      });
      return;
    }

    const issueDate = parseProfileDate(value.issueDate);
    const expiryDate = parseProfileDate(value.expiryDate);
    if (issueDate && expiryDate && expiryDate.getTime() < issueDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date must be on or after issue date.',
      });
    }
  });

export const CandidateProfileZodSchema = z.object({
  headline: optionalTrimmedText(180),
  phone: optionalPhoneText,
  location: optionalTrimmedText(180),
  summary: optionalTrimmedText(2500),
  portfolioUrl: optionalUrlText,
  linkedinUrl: optionalUrlText,
  githubUrl: optionalUrlText,
  preferredRoles: normalizedStringArray(120, 20).optional().default([]),
  preferredLocations: normalizedStringArray(120, 20).optional().default([]),
  preferredWorkModes: z
    .array(z.enum(['remote', 'onsite', 'hybrid']))
    .max(3)
    .optional()
    .default([]),
  skills: normalizedStringArray(64, 60).optional().default([]),
  education: z
    .array(candidateEducationItemSchema)
    .max(30)
    .optional()
    .default([]),
  experience: z
    .array(candidateExperienceItemSchema)
    .max(30)
    .optional()
    .default([]),
  certifications: z
    .array(candidateCertificationItemSchema)
    .max(30)
    .optional()
    .default([]),
  salary: candidateSalarySchema.optional().default({ isNegotiable: false }),
  defaultResumeId: optionalTrimmedText(64),
  portfolioLinks: normalizedUrlArray(20).optional().default([]),
  openToWork: z.boolean().optional().default(true),
});

export type TCandidateProfile = z.infer<typeof CandidateProfileZodSchema>;
export type TCandidateSalary = z.infer<typeof candidateSalarySchema>;
export type TCandidateEducationItem = z.infer<
  typeof candidateEducationItemSchema
>;
export type TCandidateExperienceItem = z.infer<
  typeof candidateExperienceItemSchema
>;
export type TCandidateCertificationItem = z.infer<
  typeof candidateCertificationItemSchema
>;
