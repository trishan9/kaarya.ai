import { TSanitizedUser } from 'src/common/utils/sanitize-user';
import { TOAuthIntent } from 'src/dtos/auth/oauth.dto';
import { AuthProvider } from 'src/types/auth-provider.enum';

export type OAuthTransactionState = {
  provider: AuthProvider;
  intent: TOAuthIntent;
  redirectUri: string;
  requestedByUserId?: string;
  createdAt: string;
};

export type OAuthLinkTicket = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  emailVerified: boolean;
  name?: string | null;
  photo?: string | null;
  createdAt: string;
};

export type OAuthAuthResult = {
  status: 'authenticated';
  user: TSanitizedUser;
  accessToken: string;
  isNewUser: boolean;
};

export type OAuthLinkRequiredResult = {
  status: 'link_required';
  message: string;
  linkToken: string;
  provider: AuthProvider;
  email?: string | null;
};

export type OAuthErrorResult = {
  status: 'error';
  message: string;
  code:
    | 'invalid_request'
    | 'provider_error'
    | 'email_missing'
    | 'email_unverified'
    | 'provider_unavailable'
    | 'unknown';
};

export type OAuthResultPayload =
  | OAuthAuthResult
  | OAuthLinkRequiredResult
  | OAuthErrorResult;
