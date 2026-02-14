import z from 'zod';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

export const ObjectIdDTO = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format.');

export const CreateCompanyDTO = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters long.')
    .max(255, 'Company name cannot exceed 255 characters.'),
  industry: optionalTrimmedText,
  location: optionalTrimmedText,
  logo: z.url().optional(),
  verifiedStatus: z.preprocess((value) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }
    return value;
  }, z.boolean().optional()),
  designation: optionalTrimmedText,
});

export const UpdateCompanyDTO = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Company name must be at least 2 characters long.')
      .max(255, 'Company name cannot exceed 255 characters.')
      .optional(),
    industry: optionalTrimmedText,
    location: optionalTrimmedText,
    logo: z.url().optional(),
    verifiedStatus: z.preprocess((value) => {
      if (typeof value === 'string') {
        return value.trim().toLowerCase() === 'true';
      }
      return value;
    }, z.boolean().optional()),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const AssignRecruiterToCompanyDTO = z.object({
  recruiterId: ObjectIdDTO,
  designation: optionalTrimmedText,
});

export const InviteRecruiterToCompanyDTO = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invitee email must be a valid email address.'),
  designation: optionalTrimmedText,
});

export const JoinCompanyByCodeDTO = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, 'Invite code is required.')
    .max(32, 'Invite code is invalid.')
    .transform((value) => value.toUpperCase()),
  designation: optionalTrimmedText,
});

export const CompaniesQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  search: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(1).optional()),
});

export const CompanyRecruitersQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
});

export type TCreateCompanyDTO = z.infer<typeof CreateCompanyDTO>;
export type TUpdateCompanyDTO = z.infer<typeof UpdateCompanyDTO>;
export type TAssignRecruiterToCompanyDTO = z.infer<
  typeof AssignRecruiterToCompanyDTO
>;
export type TInviteRecruiterToCompanyDTO = z.infer<
  typeof InviteRecruiterToCompanyDTO
>;
export type TJoinCompanyByCodeDTO = z.infer<typeof JoinCompanyByCodeDTO>;
export type TCompaniesQueryDTO = z.infer<typeof CompaniesQueryDTO>;
export type TCompanyRecruitersQueryDTO = z.infer<
  typeof CompanyRecruitersQueryDTO
>;
