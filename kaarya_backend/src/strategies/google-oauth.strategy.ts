import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { CONFIG_KEYS, CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { AllConfigType } from 'src/types/config.type';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(
  Strategy,
  AuthProvider.GOOGLE,
) {
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const authConfig = configService.get(CONFIG_NAMESPACE.AUTH, {
      infer: true,
    });

    super({
      clientID: authConfig?.oauthGoogle?.clientId ?? 'oauth-google-client-id',
      clientSecret:
        authConfig?.oauthGoogle?.clientSecret ?? 'oauth-google-client-secret',
      callbackURL: GoogleOAuthStrategy.buildCallbackUrl(configService),
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<OAuthProviderProfile> {
    const primaryEmail =
      profile.emails?.find((entry) => entry.verified) ?? profile.emails?.[0];
    const normalizedEmail = primaryEmail?.value?.trim().toLowerCase() || null;
    const emailVerified = Boolean(
      primaryEmail?.verified ||
      ((profile as unknown as { _json?: { email_verified?: boolean } })._json
        ?.email_verified ??
        false),
    );

    return await Promise.resolve({
      provider: AuthProvider.GOOGLE,
      providerUserId: profile.id,
      email: normalizedEmail,
      emailVerified,
      name: profile.displayName?.trim() || null,
      photo: profile.photos?.[0]?.value?.trim() || null,
    });
  }

  // Keep OAuth state stateless; Redis validates state instead of Passport session store.
  authorizationParams(options: { customState?: string }) {
    return options.customState ? { state: options.customState } : {};
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

    const callbackPath = `/${apiPrefix}/v1/${ROUTES.AUTH.BASE}/oauth/${AuthProvider.GOOGLE}/callback`;
    return new URL(callbackPath, backendDomain).toString();
  }
}
