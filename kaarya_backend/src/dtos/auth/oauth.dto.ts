import { z } from 'zod';
import { AuthProvider } from 'src/types/auth-provider.enum';

const OAuthIntentSchema = z.enum(['login', 'signup', 'link']);

export const OAuthProviderParamDTO = z.object({
  provider: z.enum(AuthProvider),
});

export const OAuthAuthorizeQueryDTO = z.object({
  redirectUri: z.string().trim().min(1, 'redirectUri is required.'),
  intent: OAuthIntentSchema.optional(),
});

export const OAuthCallbackQueryDTO = z.object({
  code: z.string().trim().optional(),
  state: z.string().trim().optional(),
  error: z.string().trim().optional(),
  error_description: z.string().trim().optional(),
});

export const OAuthExchangeDTO = z.object({
  resultToken: z.string().trim().min(1, 'resultToken is required.'),
});

export const OAuthCompleteLinkDTO = z.object({
  linkToken: z.string().trim().min(1, 'linkToken is required.'),
});

export type TOAuthAuthorizeQueryDTO = z.infer<typeof OAuthAuthorizeQueryDTO>;
export type TOAuthCallbackQueryDTO = z.infer<typeof OAuthCallbackQueryDTO>;
export type TOAuthExchangeDTO = z.infer<typeof OAuthExchangeDTO>;
export type TOAuthCompleteLinkDTO = z.infer<typeof OAuthCompleteLinkDTO>;
export type TOAuthIntent = z.infer<typeof OAuthIntentSchema>;
