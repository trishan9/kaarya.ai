import z from 'zod';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const optionalYear = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}, z.coerce.number().int().min(1).max(10).optional());

export const CreateCollegeDTO = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'College name must be at least 2 characters long.')
    .max(255, 'College name cannot exceed 255 characters.'),
  institutionType: optionalTrimmedText,
  location: optionalTrimmedText,
  logo: z.url().optional(),
});

export const UpdateCollegeDTO = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'College name must be at least 2 characters long.')
      .max(255, 'College name cannot exceed 255 characters.')
      .optional(),
    institutionType: optionalTrimmedText,
    location: optionalTrimmedText,
    logo: z.url().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const InviteStudentToCollegeDTO = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invitee email must be a valid email address.'),
  program: optionalTrimmedText,
  year: optionalYear,
});

export const JoinCollegeByCodeDTO = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, 'Invite code is required.')
    .max(32, 'Invite code is invalid.')
    .transform((value) => value.toUpperCase()),
  program: optionalTrimmedText,
  year: optionalYear,
});

export const CollegesQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  search: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(1).optional()),
});

export const CollegeStudentsQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
});

export const LeaderboardQueryDTO = z.object({
  scope: z.enum(['global', 'college']).default('global'),
  collegeId: ObjectIdDTO.optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export type TCreateCollegeDTO = z.infer<typeof CreateCollegeDTO>;
export type TUpdateCollegeDTO = z.infer<typeof UpdateCollegeDTO>;
export type TInviteStudentToCollegeDTO = z.infer<
  typeof InviteStudentToCollegeDTO
>;
export type TJoinCollegeByCodeDTO = z.infer<typeof JoinCollegeByCodeDTO>;
export type TCollegesQueryDTO = z.infer<typeof CollegesQueryDTO>;
export type TCollegeStudentsQueryDTO = z.infer<typeof CollegeStudentsQueryDTO>;
export type TLeaderboardQueryDTO = z.infer<typeof LeaderboardQueryDTO>;
