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
  AUTH_REFRESH_SECRET: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_FORGOT_SECRET: string;

  @IsString()
  AUTH_FORGOT_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_CONFIRM_EMAIL_SECRET: string;

  @IsString()
  AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: string;

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
}

export default registerAs<AuthConfig>(CONFIG_NAMESPACE.AUTH, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    secret: process.env.AUTH_JWT_SECRET,
    expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN as ms.StringValue,
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN as ms.StringValue,
    forgotSecret: process.env.AUTH_FORGOT_SECRET,
    forgotExpires: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN as ms.StringValue,
    confirmEmailSecret: process.env.AUTH_CONFIRM_EMAIL_SECRET,
    confirmEmailExpires: process.env
      .AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN as ms.StringValue,
    resetOtpSecret:
      process.env.AUTH_RESET_OTP_SECRET ?? process.env.AUTH_FORGOT_SECRET,
    resetOtpExpires: (process.env.AUTH_RESET_OTP_EXPIRES_IN ??
      '10m') as ms.StringValue,
    resetOtpMaxAttempts: process.env.AUTH_RESET_OTP_MAX_ATTEMPTS
      ? parseInt(process.env.AUTH_RESET_OTP_MAX_ATTEMPTS, 10)
      : 5,
    resetRequestWindow: (process.env.AUTH_RESET_REQUEST_WINDOW ??
      '1h') as ms.StringValue,
    resetRequestMax: process.env.AUTH_RESET_REQUEST_MAX
      ? parseInt(process.env.AUTH_RESET_REQUEST_MAX, 10)
      : 5,
    resetVerifyWindow: (process.env.AUTH_RESET_VERIFY_WINDOW ??
      '15m') as ms.StringValue,
    resetVerifyMax: process.env.AUTH_RESET_VERIFY_MAX
      ? parseInt(process.env.AUTH_RESET_VERIFY_MAX, 10)
      : 10,
    resetPasswordWindow: (process.env.AUTH_RESET_PASSWORD_WINDOW ??
      '15m') as ms.StringValue,
    resetPasswordMax: process.env.AUTH_RESET_PASSWORD_MAX
      ? parseInt(process.env.AUTH_RESET_PASSWORD_MAX, 10)
      : 5,
  };
});
