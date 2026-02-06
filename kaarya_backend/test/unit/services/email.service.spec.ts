import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { EmailService } from 'src/services/email.service';

const sendMailMock = jest.fn();
const createTransportMock = jest.fn().mockReturnValue({
  sendMail: sendMailMock,
});

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: createTransportMock,
  },
}));

const buildConfigService = (overrides: Record<string, unknown> = {}) =>
  ({
    get: jest.fn((key: string) => overrides[key]),
  }) as unknown as ConfigService;

describe('EmailService', () => {
  const logger = {
    error: jest.fn(),
  } as unknown as jest.Mocked<PinoLoggerService>;

  beforeEach(() => {
    sendMailMock.mockReset();
    createTransportMock.mockClear();
    logger.error.mockClear();
  });

  it('should throw when the email provider is not configured', async () => {
    const configService = buildConfigService({
      [CONFIG_KEYS.EMAIL.PROVIDER]: 'nodemailer',
    });
    const service = new EmailService(configService, logger);

    try {
      await service.sendPasswordResetOtp('user@example.com', '123456', 10);
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({
          message: 'Email provider is not configured.',
        }),
      );
    }
  });

  it('should send password reset emails when configured', async () => {
    const configService = buildConfigService({
      [CONFIG_KEYS.EMAIL.PROVIDER]: 'nodemailer',
      [CONFIG_KEYS.EMAIL.FROM]: 'no-reply@example.com',
      [CONFIG_KEYS.EMAIL.REPLY_TO]: 'support@example.com',
      [CONFIG_KEYS.EMAIL.BRAND_NAME]: 'Kaarya',
      [CONFIG_KEYS.EMAIL.SMTP_HOST]: 'smtp.example.com',
      [CONFIG_KEYS.EMAIL.SMTP_PORT]: 587,
      [CONFIG_KEYS.EMAIL.SMTP_USER]: 'smtp-user',
      [CONFIG_KEYS.EMAIL.SMTP_PASS]: 'smtp-pass',
    });

    sendMailMock.mockResolvedValue(undefined);
    const service = new EmailService(configService, logger);

    await service.sendPasswordResetOtp(
      'user@example.com',
      '123456',
      10,
      'https://app.example.com/forgot-password?token=jwt.token',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@example.com',
        to: 'user@example.com',
        subject: 'Kaarya password reset code',
        replyTo: 'support@example.com',
        html: expect.stringContaining(
          'https://app.example.com/forgot-password?token=jwt.token',
        ),
      }),
    );
  });

  it('should send password reset success emails when configured', async () => {
    const configService = buildConfigService({
      [CONFIG_KEYS.EMAIL.PROVIDER]: 'nodemailer',
      [CONFIG_KEYS.EMAIL.FROM]: 'no-reply@example.com',
      [CONFIG_KEYS.EMAIL.BRAND_NAME]: 'Kaarya',
      [CONFIG_KEYS.EMAIL.SMTP_HOST]: 'smtp.example.com',
      [CONFIG_KEYS.EMAIL.SMTP_PORT]: 587,
    });

    sendMailMock.mockResolvedValue(undefined);
    const service = new EmailService(configService, logger);

    await service.sendPasswordResetSuccess('user@example.com', {
      userName: 'Reset User',
      ipAddress: '10.0.0.8',
      userAgent: 'Mozilla/5.0',
      occurredAt: new Date('2026-02-06T12:00:00.000Z'),
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Kaarya password changed successfully',
      }),
    );
  });

  it('should send onboarding emails when configured', async () => {
    const configService = buildConfigService({
      [CONFIG_KEYS.EMAIL.PROVIDER]: 'nodemailer',
      [CONFIG_KEYS.EMAIL.FROM]: 'no-reply@example.com',
      [CONFIG_KEYS.EMAIL.BRAND_NAME]: 'Kaarya',
      [CONFIG_KEYS.EMAIL.SMTP_HOST]: 'smtp.example.com',
      [CONFIG_KEYS.EMAIL.SMTP_PORT]: 587,
    });

    sendMailMock.mockResolvedValue(undefined);
    const service = new EmailService(configService, logger);

    await service.sendOnboardingEmail('user@example.com', {
      userName: 'New User',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Welcome to Kaarya',
      }),
    );
  });

  it('should surface nodemailer errors', async () => {
    const configService = buildConfigService({
      [CONFIG_KEYS.EMAIL.PROVIDER]: 'nodemailer',
      [CONFIG_KEYS.EMAIL.FROM]: 'no-reply@example.com',
      [CONFIG_KEYS.EMAIL.SMTP_HOST]: 'smtp.example.com',
      [CONFIG_KEYS.EMAIL.SMTP_PORT]: 587,
    });

    sendMailMock.mockRejectedValue(new Error('SMTP failed'));
    const service = new EmailService(configService, logger);

    try {
      await service.sendPasswordResetOtp('user@example.com', '123456', 10);
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: 'Failed to send email.' }),
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    }
  });
});
