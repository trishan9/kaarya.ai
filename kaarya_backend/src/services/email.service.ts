import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { buildPasswordResetEmail } from 'src/templates/email/password-reset.template';
import { AllConfigType } from 'src/types/config.type';
import { EmailProvider } from 'src/types/email-provider.type';

type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailService {
  private readonly provider?: EmailProvider;
  private readonly from?: string;
  private readonly replyTo?: string;
  private readonly brandName: string;
  private readonly supportUrl?: string;
  private readonly logoUrl?: string;
  private readonly primaryColor?: string;
  private readonly smtpHost?: string;
  private readonly smtpPort?: number;
  private readonly smtpUser?: string;
  private readonly smtpPass?: string;
  private readonly smtpSecure?: boolean;
  private readonly smtpIgnoreTls?: boolean;
  private readonly smtpRequireTls?: boolean;
  private readonly isConfigured: boolean;
  private readonly transporter?: Transporter;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: PinoLoggerService,
  ) {
    this.provider = this.configService.get(CONFIG_KEYS.EMAIL.PROVIDER, {
      infer: true,
    });
    this.from = this.configService.get(CONFIG_KEYS.EMAIL.FROM, { infer: true });
    this.replyTo = this.configService.get(CONFIG_KEYS.EMAIL.REPLY_TO, {
      infer: true,
    });
    this.brandName =
      this.configService.get(CONFIG_KEYS.EMAIL.BRAND_NAME, { infer: true }) ??
      'Kaarya';
    this.supportUrl = this.configService.get(CONFIG_KEYS.EMAIL.SUPPORT_URL, {
      infer: true,
    });
    this.logoUrl = this.configService.get(CONFIG_KEYS.EMAIL.LOGO_URL, {
      infer: true,
    });
    this.primaryColor = this.configService.get(
      CONFIG_KEYS.EMAIL.PRIMARY_COLOR,
      { infer: true },
    );
    this.smtpHost = this.configService.get(CONFIG_KEYS.EMAIL.SMTP_HOST, {
      infer: true,
    });
    this.smtpPort = this.configService.get(CONFIG_KEYS.EMAIL.SMTP_PORT, {
      infer: true,
    });
    this.smtpUser = this.configService.get(CONFIG_KEYS.EMAIL.SMTP_USER, {
      infer: true,
    });
    this.smtpPass = this.configService.get(CONFIG_KEYS.EMAIL.SMTP_PASS, {
      infer: true,
    });
    this.smtpSecure = this.configService.get(CONFIG_KEYS.EMAIL.SMTP_SECURE, {
      infer: true,
    });
    this.smtpIgnoreTls = this.configService.get(
      CONFIG_KEYS.EMAIL.SMTP_IGNORE_TLS,
      { infer: true },
    );
    this.smtpRequireTls = this.configService.get(
      CONFIG_KEYS.EMAIL.SMTP_REQUIRE_TLS,
      { infer: true },
    );

    const hasProvider = this.provider === 'nodemailer';
    const hasSmtpConfig = !!this.smtpHost && !!this.smtpPort;
    const hasValidAuth =
      (!this.smtpUser && !this.smtpPass) ||
      (!!this.smtpUser && !!this.smtpPass);

    this.isConfigured =
      !!this.from && hasProvider && hasSmtpConfig && hasValidAuth;

    this.transporter = this.isConfigured
      ? nodemailer.createTransport({
          host: this.smtpHost,
          port: this.smtpPort,
          secure: this.smtpSecure ?? false,
          auth: this.smtpUser
            ? { user: this.smtpUser, pass: this.smtpPass ?? '' }
            : undefined,
          ignoreTLS: this.smtpIgnoreTls,
          requireTLS: this.smtpRequireTls,
        })
      : undefined;
  }

  async sendPasswordResetOtp(
    to: string,
    otp: string,
    expiresInMinutes: number,
  ) {
    const { subject, html, text } = buildPasswordResetEmail({
      brandName: this.brandName,
      otp,
      expiresInMinutes,
      supportUrl: this.supportUrl,
      logoUrl: this.logoUrl,
      primaryColor: this.primaryColor,
    });

    await this.sendEmail({ to, subject, html, text });
  }

  private async sendEmail(payload: SendEmailPayload) {
    if (!this.isConfigured || !this.transporter) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Email provider is not configured.',
      });
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: this.replyTo,
      });
    } catch (error) {
      this.logger.error(
        `Nodemailer error: ${error instanceof Error ? error.message : error}`,
        undefined,
        EmailService.name,
      );
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send email.',
      });
    }
  }
}
