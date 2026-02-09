import { EmailProvider } from './email-provider.type';

export type EmailConfig = {
  provider?: EmailProvider;
  from?: string;
  replyTo?: string;
  brandName?: string;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpIgnoreTls?: boolean;
  smtpRequireTls?: boolean;
};
