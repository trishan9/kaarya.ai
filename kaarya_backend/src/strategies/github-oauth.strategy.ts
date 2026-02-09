import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { CONFIG_KEYS, CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { AllConfigType } from 'src/types/config.type';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(
  Strategy,
  AuthProvider.GITHUB,
) {
  private readonly emailsUrl?: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const authConfig = configService.get(CONFIG_NAMESPACE.AUTH, {
      infer: true,
    });

    super({
      clientID: authConfig?.oauthGithub?.clientId ?? 'oauth-github-client-id',
      clientSecret:
        authConfig?.oauthGithub?.clientSecret ?? 'oauth-github-client-secret',
      callbackURL: GithubOAuthStrategy.buildCallbackUrl(configService),
      scope: ['read:user', 'user:email'],
    });

    this.emailsUrl = authConfig?.oauthGithub?.emailsUrl;
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<OAuthProviderProfile> {
    const { email, emailVerified } = await this.resolveVerifiedEmail(
      accessToken,
      profile,
    );

    return {
      provider: AuthProvider.GITHUB,
      providerUserId: profile.id,
      email,
      emailVerified,
      name: profile.displayName?.trim() || null,
      photo: profile.photos?.[0]?.value?.trim() || null,
    };
  }

  // Keep OAuth state stateless; Redis validates state instead of Passport session store.
  authorizationParams(options: { customState?: string }) {
    return options.customState ? { state: options.customState } : {};
  }

  private async resolveVerifiedEmail(
    accessToken: string,
    profile: Profile,
  ): Promise<{ email: string | null; emailVerified: boolean }> {
    const publicEmail =
      profile.emails?.[0]?.value?.trim().toLowerCase() || null;

    if (!this.emailsUrl) {
      return { email: publicEmail, emailVerified: false };
    }

    try {
      const response = await fetch(this.emailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'kaarya-auth-service',
        },
      });

      const emails = (await response.json().catch(() => null)) as Array<{
        email?: string;
        verified?: boolean;
        primary?: boolean;
      }> | null;

      if (!response.ok || !Array.isArray(emails)) {
        return { email: publicEmail, emailVerified: false };
      }

      const primaryVerified = emails.find(
        (entry) =>
          entry.primary === true &&
          entry.verified === true &&
          typeof entry.email === 'string' &&
          entry.email.trim().length > 0,
      );

      const fallbackVerified = emails.find(
        (entry) =>
          entry.verified === true &&
          typeof entry.email === 'string' &&
          entry.email.trim().length > 0,
      );

      const verifiedEmail =
        primaryVerified?.email?.trim().toLowerCase() ??
        fallbackVerified?.email?.trim().toLowerCase() ??
        null;

      if (verifiedEmail) {
        return { email: verifiedEmail, emailVerified: true };
      }

      return { email: publicEmail, emailVerified: false };
    } catch {
      return { email: publicEmail, emailVerified: false };
    }
  }

  private static buildCallbackUrl(configService: ConfigService<AllConfigType>) {
    const backendDomain =
      configService.get(CONFIG_KEYS.APP.BACKEND_DOMAIN, {
        infer: true,
      }) ?? 'http://localhost:3000';
    const apiPrefix =
      configService.get(CONFIG_KEYS.APP.API_PREFIX, {
        infer: true,
      }) ?? 'api';

    const callbackPath = `/${apiPrefix}/v1/${ROUTES.AUTH.BASE}/oauth/${AuthProvider.GITHUB}/callback`;
    return new URL(callbackPath, backendDomain).toString();
  }
}
