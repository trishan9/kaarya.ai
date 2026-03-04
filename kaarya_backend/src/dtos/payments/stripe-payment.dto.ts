import z from 'zod';

export const CreateStripeCheckoutSessionDTO = z.object({
  successPath: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default('/payment/checkout'),
  cancelPath: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default('/payment/checkout'),
});

export type TCreateStripeCheckoutSessionDTO = z.infer<
  typeof CreateStripeCheckoutSessionDTO
>;

export const CreateStripePortalSessionDTO = z.object({
  returnPath: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default('/payment/checkout'),
});

export type TCreateStripePortalSessionDTO = z.infer<
  typeof CreateStripePortalSessionDTO
>;

export const VerifyStripeCheckoutSessionDTO = z.object({
  sessionId: z.string().trim().min(1),
});

export type TVerifyStripeCheckoutSessionDTO = z.infer<
  typeof VerifyStripeCheckoutSessionDTO
>;
