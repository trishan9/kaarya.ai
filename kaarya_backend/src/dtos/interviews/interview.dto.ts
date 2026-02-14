import z from 'zod';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { InterviewMode } from 'src/types/interview-mode.enum';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
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

const optionalDate = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}, z.coerce.date().optional());

const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}, z.coerce.number().optional());

const interviewQuestionSchema = z
  .string()
  .trim()
  .min(8, 'Each interview question must be at least 8 characters.');

const transcriptMessageSchema = z.object({
  role: z.enum(['assistant', 'user', 'system']),
  content: z.string().trim().min(1),
  timestamp: optionalDate,
});

export const CreateInterviewDTO = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Interview title must be at least 2 characters long.')
    .max(255, 'Interview title cannot exceed 255 characters.'),
  description: optionalTrimmedText,
  interviewType: z.nativeEnum(InterviewType),
  role: z
    .string()
    .trim()
    .min(2, 'Role must be at least 2 characters long.')
    .max(255, 'Role cannot exceed 255 characters.'),
  level: optionalTrimmedText,
  techStack: z.array(z.string().trim().min(1)).default([]),
  questionCount: z.coerce.number().int().min(1).max(20).default(8),
  durationMinutes: z.coerce.number().int().min(5).max(120).default(25),
  visibility: z.nativeEnum(InterviewVisibility).optional(),
  status: z.nativeEnum(InterviewStatus).optional(),
  companyId: ObjectIdDTO.optional(),
  collegeId: ObjectIdDTO.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  instructions: optionalTrimmedText,
  generateQuestions: optionalBoolean.default(false),
  questions: z.array(interviewQuestionSchema).max(30).optional(),
});

export const UpdateInterviewDTO = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Interview title must be at least 2 characters long.')
      .max(255, 'Interview title cannot exceed 255 characters.')
      .optional(),
    description: optionalTrimmedText,
    interviewType: z.nativeEnum(InterviewType).optional(),
    role: z
      .string()
      .trim()
      .min(2, 'Role must be at least 2 characters long.')
      .max(255, 'Role cannot exceed 255 characters.')
      .optional(),
    level: optionalTrimmedText,
    techStack: z.array(z.string().trim().min(1)).optional(),
    questionCount: z.coerce.number().int().min(1).max(20).optional(),
    durationMinutes: z.coerce.number().int().min(5).max(120).optional(),
    visibility: z.nativeEnum(InterviewVisibility).optional(),
    status: z.nativeEnum(InterviewStatus).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    instructions: optionalTrimmedText,
    generateQuestions: optionalBoolean,
    questions: z.array(interviewQuestionSchema).max(30).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const InterviewListQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(12),
  search: optionalTrimmedText,
  status: z.nativeEnum(InterviewStatus).optional(),
  visibility: z.nativeEnum(InterviewVisibility).optional(),
  interviewType: z.nativeEnum(InterviewType).optional(),
  companyId: ObjectIdDTO.optional(),
  collegeId: ObjectIdDTO.optional(),
  ownership: z
    .enum(['all', 'created_by_me', 'taken_by_me', 'not_taken'])
    .default('all'),
  discover: optionalBoolean.default(true),
  sortBy: z
    .enum(['newest', 'popular', 'updated', 'title'])
    .default('newest'),
});

export const StartInterviewSessionDTO = z.object({
  mode: z.nativeEnum(InterviewMode).default(InterviewMode.WEB),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const CompleteInterviewSessionDTO = z.object({
  status: z.nativeEnum(InterviewSessionStatus).default(
    InterviewSessionStatus.COMPLETED,
  ),
  transcript: z.array(transcriptMessageSchema).default([]),
  recordingUrl: optionalTrimmedText,
  vapiCallId: optionalTrimmedText,
  durationSeconds: z.coerce.number().int().min(0).optional(),
  generateEvaluation: optionalBoolean.default(true),
});

export const InterviewSessionQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
});

const optionalStringArrayFromAny = z.preprocess((value) => {
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

export const VapiGenerateInterviewDTO = z
  .object({
    title: optionalTrimmedText,
    description: optionalTrimmedText,
    interviewType: z.nativeEnum(InterviewType).optional(),
    type: optionalTrimmedText,
    role: optionalTrimmedText,
    level: optionalTrimmedText,
    techStack: optionalStringArrayFromAny.optional(),
    techstack: optionalStringArrayFromAny.optional(),
    questionCount: optionalNumber,
    amount: optionalNumber,
    durationMinutes: optionalNumber,
    visibility: z.nativeEnum(InterviewVisibility).optional(),
    status: z.nativeEnum(InterviewStatus).optional(),
    companyId: ObjectIdDTO.optional(),
    collegeId: ObjectIdDTO.optional(),
    tags: optionalStringArrayFromAny.optional(),
    instructions: optionalTrimmedText,
    questions: z.array(interviewQuestionSchema).max(30).optional(),
    generateQuestions: optionalBoolean,
    userId: ObjectIdDTO.optional(),
    userid: ObjectIdDTO.optional(),
    candidateId: ObjectIdDTO.optional(),
    createdBy: ObjectIdDTO.optional(),
  })
  .passthrough();

export type TCreateInterviewDTO = z.infer<typeof CreateInterviewDTO>;
export type TUpdateInterviewDTO = z.infer<typeof UpdateInterviewDTO>;
export type TInterviewListQueryDTO = z.infer<typeof InterviewListQueryDTO>;
export type TStartInterviewSessionDTO = z.infer<typeof StartInterviewSessionDTO>;
export type TCompleteInterviewSessionDTO = z.infer<
  typeof CompleteInterviewSessionDTO
>;
export type TInterviewSessionQueryDTO = z.infer<typeof InterviewSessionQueryDTO>;
export type TVapiGenerateInterviewDTO = z.infer<typeof VapiGenerateInterviewDTO>;
