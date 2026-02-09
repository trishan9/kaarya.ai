import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACE } from 'src/constants/config.constants';
import { EmailConfig } from 'src/types/email-config.type';
import { EmailProvider } from 'src/types/email-provider.type';
import validateConfig from 'src/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsIn(['nodemailer'])
  EMAIL_PROVIDER?: EmailProvider;

  @IsOptional()
  @IsString()
  EMAIL_FROM?: string;

  @IsOptional()
  @IsString()
  EMAIL_REPLY_TO?: string;

  @IsOptional()
  @IsString()
  EMAIL_BRAND_NAME?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  EMAIL_SUPPORT_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  EMAIL_LOGO_URL?: string;

  @IsOptional()
  @IsString()
  EMAIL_PRIMARY_COLOR?: string;

  @IsOptional()
  @IsString()
  MAIL_HOST?: string;

  @IsOptional()
  @IsInt()
  MAIL_PORT?: number;

  @IsOptional()
  @IsString()
  MAIL_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_PASSWORD?: string;

  @IsOptional()
  @IsBooleanString()
  MAIL_SECURE?: string;

  @IsOptional()
  @IsBooleanString()
  MAIL_IGNORE_TLS?: string;

  @IsOptional()
  @IsBooleanString()
  MAIL_REQUIRE_TLS?: string;
}

export default registerAs<EmailConfig>(CONFIG_NAMESPACE.EMAIL, () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    provider: (process.env.EMAIL_PROVIDER ?? 'nodemailer') as EmailProvider,
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
    brandName: process.env.EMAIL_BRAND_NAME ?? 'Kaarya',
    supportUrl: process.env.EMAIL_SUPPORT_URL,
    logoUrl: process.env.EMAIL_LOGO_URL,
    primaryColor: process.env.EMAIL_PRIMARY_COLOR ?? '#1d4ed8',
    smtpHost: process.env.MAIL_HOST,
    smtpPort: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined,
    smtpUser: process.env.MAIL_USER,
    smtpPass: process.env.MAIL_PASSWORD,
    smtpSecure:
      process.env.MAIL_SECURE === undefined
        ? undefined
        : process.env.MAIL_SECURE === 'true',
    smtpIgnoreTls:
      process.env.MAIL_IGNORE_TLS === undefined
        ? undefined
        : process.env.MAIL_IGNORE_TLS === 'true',
    smtpRequireTls:
      process.env.MAIL_REQUIRE_TLS === undefined
        ? undefined
        : process.env.MAIL_REQUIRE_TLS === 'true',
  };
});
