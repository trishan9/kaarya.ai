import { AuthProvider } from 'src/types/auth-provider.enum';

export type OAuthProviderProfile = {
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  emailVerified: boolean;
  name?: string | null;
  photo?: string | null;
};
