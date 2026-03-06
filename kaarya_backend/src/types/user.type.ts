import z from 'zod';
import { AuthProvider } from './auth-provider.enum';
import { CandidateProfileZodSchema } from './candidate-profile.type';
import { UserPlan } from './user-plan.enum';

const UserInvoiceZodSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  transactionUuid: z.string(),
  amountNpr: z.number(),
  currency: z.literal('NPR'),
  paymentProvider: z.enum(['stripe', 'esewa']),
  status: z.enum(['paid', 'failed', 'refunded']),
  planFrom: z.nativeEnum(UserPlan),
  planTo: z.nativeEnum(UserPlan),
  issuedAt: z.coerce.date(),
  paidAt: z.coerce.date().nullable().optional(),
});

const UserBillingZodSchema = z.object({
  autoRenew: z.boolean().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  invoices: z.array(UserInvoiceZodSchema).optional(),
  updatedAt: z.coerce.date().nullable().optional(),
});

export const UserZodSchema = z.object({
  name: z
    .string()
    .min(1, "Name can't be empty.")
    .min(2, "Name can't be less than 2 characters."),
  email: z
    .email('Email address must be valid.')
    .min(1, "Email address can't be empty."),
  password: z
    .string()
    .min(1, "Password can't be empty.")
    .min(8, 'Password must be between 8 to 16 characters.')
    .max(16, 'Password must be between 8 to 16 characters.'),
  passwordChangedAt: z.date().optional(),
  role: z
    .enum(['user', 'admin', 'student', 'college', 'recruiter', 'faculty'])
    .optional(),
  plan: z.nativeEnum(UserPlan).optional(),
  billing: UserBillingZodSchema.optional(),
  provider: z.nativeEnum(AuthProvider).optional(),
  socialId: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  candidateProfile: CandidateProfileZodSchema.optional(),
});

export type TUser = z.infer<typeof UserZodSchema>;
