import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import ms from 'ms';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { AuthConfig } from 'src/types/auth-config.type';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET: string;

  @IsString()
  AUTH_JWT_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_FORGOT_SECRET: string;

  @IsString()
  AUTH_FORGOT_TOKEN_EXPIRES_IN: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_OTP_SECRET?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_OTP_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_OTP_MAX_ATTEMPTS?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_REQUEST_WINDOW?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_REQUEST_MAX?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_VERIFY_WINDOW?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_VERIFY_MAX?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_PASSWORD_WINDOW?: string;

  @IsOptional()
  @IsString()
  AUTH_RESET_PASSWORD_MAX?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_STATE_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_RESULT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_LINK_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_ALLOWED_REDIRECTS?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_AUTH_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_TOKEN_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_USERINFO_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GOOGLE_TOKENINFO_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_AUTH_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_TOKEN_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_USERINFO_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_OAUTH_GITHUB_EMAILS_URL?: string;
}

export default registerAs<AuthConfig>(CONFIG_NAMESPACE.AUTH, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const envOrUndefined = (value?: string) => {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
  };

  const envOrDefault = (value: string | undefined, fallback: string) =>
    envOrUndefined(value) ?? fallback;

  const parseCsv = (value?: string) =>
    (envOrUndefined(value) ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const oauthAllowedRedirects = Array.from(
    new Set([
      ...parseCsv(process.env.AUTH_OAUTH_ALLOWED_REDIRECTS),
      ...parseCsv(process.env.FRONTEND_DOMAIN),
    ]),
  );

  return {
    secret: process.env.AUTH_JWT_SECRET,
    expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN as ms.StringValue,
    forgotSecret: process.env.AUTH_FORGOT_SECRET,
    forgotExpires: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN as ms.StringValue,
    resetOtpSecret:
      process.env.AUTH_RESET_OTP_SECRET ?? process.env.AUTH_FORGOT_SECRET,
    resetOtpExpires: (process.env.AUTH_RESET_OTP_EXPIRES_IN ??
      '10m') as ms.StringValue,
    resetOtpMaxAttempts: process.env.AUTH_RESET_OTP_MAX_ATTEMPTS
      ? parseInt(process.env.AUTH_RESET_OTP_MAX_ATTEMPTS, 10)
      : 10,
    resetRequestWindow: (process.env.AUTH_RESET_REQUEST_WINDOW ??
      '1h') as ms.StringValue,
    resetRequestMax: process.env.AUTH_RESET_REQUEST_MAX
      ? parseInt(process.env.AUTH_RESET_REQUEST_MAX, 10)
      : 10,
    resetVerifyWindow: (process.env.AUTH_RESET_VERIFY_WINDOW ??
      '15m') as ms.StringValue,
    resetVerifyMax: process.env.AUTH_RESET_VERIFY_MAX
      ? parseInt(process.env.AUTH_RESET_VERIFY_MAX, 10)
      : 10,
    resetPasswordWindow: (process.env.AUTH_RESET_PASSWORD_WINDOW ??
      '15m') as ms.StringValue,
    resetPasswordMax: process.env.AUTH_RESET_PASSWORD_MAX
      ? parseInt(process.env.AUTH_RESET_PASSWORD_MAX, 10)
      : 10,
    oauthStateExpires: (process.env.AUTH_OAUTH_STATE_EXPIRES_IN ??
      '10m') as ms.StringValue,
    oauthResultExpires: (process.env.AUTH_OAUTH_RESULT_EXPIRES_IN ??
      '5m') as ms.StringValue,
    oauthLinkExpires: (process.env.AUTH_OAUTH_LINK_EXPIRES_IN ??
      '15m') as ms.StringValue,
    oauthAllowedRedirects,
    oauthGoogle: {
      clientId: envOrUndefined(process.env.AUTH_OAUTH_GOOGLE_CLIENT_ID),
      clientSecret: envOrUndefined(process.env.AUTH_OAUTH_GOOGLE_CLIENT_SECRET),
      authorizationUrl: envOrDefault(
        process.env.AUTH_OAUTH_GOOGLE_AUTH_URL,
        'https://accounts.google.com/o/oauth2/v2/auth',
      ),
      tokenUrl: envOrDefault(
        process.env.AUTH_OAUTH_GOOGLE_TOKEN_URL,
        'https://oauth2.googleapis.com/token',
      ),
      userInfoUrl: envOrDefault(
        process.env.AUTH_OAUTH_GOOGLE_USERINFO_URL,
        'https://openidconnect.googleapis.com/v1/userinfo',
      ),
      tokenInfoUrl: envOrDefault(
        process.env.AUTH_OAUTH_GOOGLE_TOKENINFO_URL,
        'https://oauth2.googleapis.com/tokeninfo',
      ),
    },
    oauthGithub: {
      clientId: envOrUndefined(process.env.AUTH_OAUTH_GITHUB_CLIENT_ID),
      clientSecret: envOrUndefined(process.env.AUTH_OAUTH_GITHUB_CLIENT_SECRET),
      authorizationUrl: envOrDefault(
        process.env.AUTH_OAUTH_GITHUB_AUTH_URL,
        'https://github.com/login/oauth/authorize',
      ),
      tokenUrl: envOrDefault(
        process.env.AUTH_OAUTH_GITHUB_TOKEN_URL,
        'https://github.com/login/oauth/access_token',
      ),
      userInfoUrl: envOrDefault(
        process.env.AUTH_OAUTH_GITHUB_USERINFO_URL,
        'https://api.github.com/user',
      ),
      emailsUrl: envOrDefault(
        process.env.AUTH_OAUTH_GITHUB_EMAILS_URL,
        'https://api.github.com/user/emails',
      ),
    },
  };
});
