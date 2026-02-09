import { HttpStatus } from '@nestjs/common';
import argon2 from 'argon2';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { EmailService } from 'src/services/email.service';
import { PasswordResetService } from 'src/services/password-reset.service';
import { RateLimitService } from 'src/services/rate-limit.service';
import { RedisService } from 'src/services/redis.service';
import { UserService } from 'src/services/user.service';
import { InMemoryRedis } from '../../helpers/in-memory-redis';

jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    argon2id: 'argon2id',
  },
}));

type ServiceDeps = {
  service: PasswordResetService;
  userService: jest.Mocked<UserService>;
  emailService: jest.Mocked<EmailService>;
  redisService: jest.Mocked<RedisService>;
  rateLimitService: jest.Mocked<RateLimitService>;
  logger: jest.Mocked<PinoLoggerService>;
  configService: ConfigService;
  redis: InMemoryRedis;
};

const defaultConfig: Record<string, unknown> = {
  [CONFIG_KEYS.AUTH.FORGOT_SECRET]: 'forgot-secret',
  [CONFIG_KEYS.AUTH.FORGOT_EXPIRES]: '30m',
  [CONFIG_KEYS.AUTH.RESET_OTP_SECRET]: 'otp-secret',
  [CONFIG_KEYS.AUTH.RESET_OTP_EXPIRES]: '10m',
  [CONFIG_KEYS.AUTH.RESET_OTP_MAX_ATTEMPTS]: 3,
  [CONFIG_KEYS.AUTH.RESET_REQUEST_WINDOW]: '1h',
  [CONFIG_KEYS.AUTH.RESET_REQUEST_MAX]: 2,
  [CONFIG_KEYS.AUTH.RESET_VERIFY_WINDOW]: '15m',
  [CONFIG_KEYS.AUTH.RESET_VERIFY_MAX]: 2,
  [CONFIG_KEYS.AUTH.RESET_PASSWORD_WINDOW]: '15m',
  [CONFIG_KEYS.AUTH.RESET_PASSWORD_MAX]: 2,
  [CONFIG_KEYS.REDIS.KEY_PREFIX]: 'kaarya',
};

const buildConfigService = (overrides: Record<string, unknown> = {}) =>
  ({
    get: jest.fn((key: string) =>
      Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key]
        : defaultConfig[key],
    ),
  }) as unknown as ConfigService;

const setup = (overrides: Record<string, unknown> = {}): ServiceDeps => {
  const userService = {
    getUserByEmail: jest.fn(),
    getUserByIdRaw: jest.fn(),
    updatePassword: jest.fn(),
  } as unknown as jest.Mocked<UserService>;

  const emailService = {
    sendPasswordResetOtp: jest.fn(),
    sendPasswordResetSuccess: jest.fn(),
  } as unknown as jest.Mocked<EmailService>;

  const redis = new InMemoryRedis();
  const redisService = {
    getClient: jest.fn().mockResolvedValue(redis),
  } as unknown as jest.Mocked<RedisService>;

  const rateLimitService = {
    consume: jest.fn(),
  } as unknown as jest.Mocked<RateLimitService>;

  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as jest.Mocked<PinoLoggerService>;

  const configService = buildConfigService(overrides);

  const service = new PasswordResetService(
    userService,
    emailService,
    redisService,
    rateLimitService,
    configService,
    logger,
  );

  return {
    service,
    userService,
    emailService,
    redisService,
    rateLimitService,
    logger,
    configService,
    redis,
  };
};

const hashResetToken = (token: string) =>
  crypto.createHmac('sha256', 'forgot-secret').update(token).digest('hex');

describe('PasswordResetService', () => {
  const mockedArgon2 = argon2 as unknown as { hash: jest.Mock };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw when reset secrets are not configured', async () => {
    const { service } = setup({
      [CONFIG_KEYS.AUTH.FORGOT_SECRET]: undefined,
      [CONFIG_KEYS.AUTH.RESET_OTP_SECRET]: undefined,
    });

    try {
      await service.requestReset('user@example.com', {
        ip: '127.0.0.1',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({
          message: 'Password reset is not configured.',
        }),
      );
    }
  });

  it('should return silently when the user does not exist', async () => {
    const { service, userService, emailService, rateLimitService, redis } =
      setup();
    userService.getUserByEmail.mockResolvedValue(null);

    await service.requestReset('User@Example.com', { ip: '10.0.0.1' });

    expect(userService.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(rateLimitService.consume).toHaveBeenCalledTimes(2);
    expect(emailService.sendPasswordResetOtp).not.toHaveBeenCalled();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
  });

  it('should store OTP state and email the user when requesting a reset', async () => {
    const { service, userService, emailService, redis } = setup({
      [CONFIG_KEYS.AUTH.RESET_OTP_EXPIRES]: '5m',
    });
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);

    (jest.spyOn(crypto, 'randomInt') as unknown as jest.Mock).mockReturnValue(
      123456,
    );

    await service.requestReset('User@Example.com', { ip: '10.0.0.2' });

    expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      5,
      undefined,
    );

    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    const stored = await redis.get(`kaarya:reset:otp:${emailHash}`);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored as string) as {
      userId: string;
      otpHash: string;
      attempts: number;
      maxAttempts: number;
    };
    const expectedHash = crypto
      .createHmac('sha256', 'otp-secret')
      .update('123456')
      .digest('hex');
    expect(parsed).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        otpHash: expectedHash,
        attempts: 0,
        maxAttempts: 3,
      }),
    );
    expect(await redis.get('kaarya:reset:token:user:user-1')).toBeTruthy();
  });

  it('should include a direct reset link when frontend domain is configured', async () => {
    const { service, userService, emailService } = setup({
      [CONFIG_KEYS.APP.FRONTEND_DOMAIN]: 'https://app.example.com',
    });
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);
    const tokenBytes = Buffer.alloc(32, 7);
    const expectedToken = tokenBytes.toString('base64url');
    (
      jest.spyOn(crypto, 'randomBytes') as unknown as jest.Mock
    ).mockReturnValue(tokenBytes);
    (jest.spyOn(crypto, 'randomInt') as unknown as jest.Mock).mockReturnValue(
      123456,
    );

    await service.requestReset('user@example.com', { ip: '10.0.0.15' });

    expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      10,
      `https://app.example.com/forgot-password?token=${expectedToken}`,
    );
  });

  it('should fall back to default expiry when configured value is invalid', async () => {
    const { service, userService, emailService } = setup({
      [CONFIG_KEYS.AUTH.RESET_OTP_EXPIRES]: '0',
    });
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);
    (jest.spyOn(crypto, 'randomInt') as unknown as jest.Mock).mockReturnValue(
      123456,
    );

    await service.requestReset('user@example.com', { ip: '10.0.0.9' });

    expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      10,
      undefined,
    );
  });

  it('should reject verification when no OTP state exists', async () => {
    const { service } = setup();

    try {
      await service.verifyOtp('user@example.com', '123456', {
        ip: '10.0.0.3',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.BAD_REQUEST);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_RESET_CODE }),
      );
    }
  });

  it('should reject expired OTP codes and clear state', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(
      `kaarya:reset:otp:${emailHash}`,
      JSON.stringify({
        userId: 'user-1',
        otpHash: 'hash',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
      { EX: 60 },
    );

    await expect(
      service.verifyOtp('user@example.com', '123456', { ip: '10.0.0.4' }),
    ).rejects.toBeInstanceOf(Error);

    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
  });

  it('should clear OTP state when max attempts are exceeded', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(
      `kaarya:reset:otp:${emailHash}`,
      JSON.stringify({
        userId: 'user-1',
        otpHash: 'hash',
        attempts: 2,
        maxAttempts: 2,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { EX: 60 },
    );

    await expect(
      service.verifyOtp('user@example.com', '123456', { ip: '10.0.0.10' }),
    ).rejects.toBeInstanceOf(Error);

    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
  });

  it('should bump OTP attempts on invalid codes', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(
      `kaarya:reset:otp:${emailHash}`,
      JSON.stringify({
        userId: 'user-1',
        otpHash: crypto
          .createHmac('sha256', 'otp-secret')
          .update('999999')
          .digest('hex'),
        attempts: 0,
        maxAttempts: 2,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { EX: 60 },
    );

    await expect(
      service.verifyOtp('user@example.com', '123456', { ip: '10.0.0.5' }),
    ).rejects.toBeInstanceOf(Error);

    const updated = await redis.get(`kaarya:reset:otp:${emailHash}`);
    const parsed = JSON.parse(updated as string) as { attempts: number };
    expect(parsed.attempts).toBe(1);
  });

  it('should clear OTP state when invalid attempts reach the limit', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(
      `kaarya:reset:otp:${emailHash}`,
      JSON.stringify({
        userId: 'user-1',
        otpHash: crypto
          .createHmac('sha256', 'otp-secret')
          .update('999999')
          .digest('hex'),
        attempts: 1,
        maxAttempts: 2,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { EX: 60 },
    );

    await expect(
      service.verifyOtp('user@example.com', '123456', { ip: '10.0.0.13' }),
    ).rejects.toBeInstanceOf(Error);

    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
  });

  it('should clear OTP state and issue a reset token on success', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(
      `kaarya:reset:otp:${emailHash}`,
      JSON.stringify({
        userId: 'user-1',
        otpHash: crypto
          .createHmac('sha256', 'otp-secret')
          .update('123456')
          .digest('hex'),
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { EX: 60 },
    );

    const tokenBytes = Buffer.alloc(32, 4);
    const expectedToken = tokenBytes.toString('base64url');
    const tokenHash = hashResetToken(expectedToken);
    (
      jest.spyOn(crypto, 'randomBytes') as unknown as jest.Mock
    ).mockReturnValue(tokenBytes);

    const result = await service.verifyOtp('user@example.com', '123456', {
      ip: '10.0.0.6',
    });

    expect(result).toEqual({ resetToken: expectedToken });
    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
    expect(await redis.get(`kaarya:reset:token:${tokenHash}`)).toBe('user-1');
    expect(await redis.get('kaarya:reset:token:user:user-1')).toBe(tokenHash);
  });

  it('should invalidate the previous reset token when issuing a new one', async () => {
    const { service, userService, redis } = setup();
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);
    (jest.spyOn(crypto, 'randomInt') as unknown as jest.Mock).mockReturnValue(
      123456,
    );
    const oldTokenBytes = Buffer.alloc(32, 10);
    const newTokenBytes = Buffer.alloc(32, 11);
    const oldTokenHash = hashResetToken(oldTokenBytes.toString('base64url'));
    const newTokenHash = hashResetToken(newTokenBytes.toString('base64url'));
    (
      jest.spyOn(crypto, 'randomBytes') as unknown as jest.Mock
    )
      .mockReturnValueOnce(oldTokenBytes)
      .mockReturnValueOnce(newTokenBytes);

    await service.requestReset('user@example.com', { ip: '10.0.0.16' });
    await service.requestReset('user@example.com', { ip: '10.0.0.17' });

    expect(await redis.get(`kaarya:reset:token:${oldTokenHash}`)).toBeNull();
    expect(await redis.get(`kaarya:reset:token:${newTokenHash}`)).toBe(
      'user-1',
    );
    expect(await redis.get('kaarya:reset:token:user:user-1')).toBe(
      newTokenHash,
    );
  });

  it('should treat corrupted OTP state as invalid', async () => {
    const { service, redis } = setup();
    const emailHash = crypto
      .createHash('sha256')
      .update('user@example.com')
      .digest('hex');
    await redis.set(`kaarya:reset:otp:${emailHash}`, 'not-json', { EX: 60 });

    await expect(
      service.verifyOtp('user@example.com', '123456', { ip: '10.0.0.11' }),
    ).rejects.toBeInstanceOf(Error);

    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
  });

  it('should reject invalid reset tokens', async () => {
    const { service } = setup();

    try {
      await service.resetPassword('bad', 'NewPassword!123', {
        ip: '10.0.0.7',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_RESET_TOKEN }),
      );
    }
  });

  it('should reject reset tokens that are missing in redis', async () => {
    const { service } = setup();

    await expect(
      service.resetPassword('opaque.token', 'NewPassword!123', {
        ip: '10.0.0.12',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('should reset the password, clear the reset token, and send a confirmation email', async () => {
    const { service, userService, redis, emailService } = setup();
    const resetToken = 'opaque.token';
    const resetTokenHash = hashResetToken(resetToken);
    await redis.set(`kaarya:reset:token:${resetTokenHash}`, 'user-1', {
      EX: 60,
    });
    await redis.set('kaarya:reset:token:user:user-1', resetTokenHash, {
      EX: 60,
    });
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Reset User',
    } as never);
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.updatePassword.mockResolvedValue(true as never);

    await service.resetPassword(resetToken, 'NewPassword!123', {
      ip: '10.0.0.8',
      userAgent: 'Mozilla/5.0',
    });

    expect(userService.updatePassword).toHaveBeenCalledWith('user-1', 'hashed');
    expect(await redis.get(`kaarya:reset:token:${resetTokenHash}`)).toBeNull();
    expect(await redis.get('kaarya:reset:token:user:user-1')).toBeNull();
    expect(emailService.sendPasswordResetSuccess).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        userName: 'Reset User',
        ipAddress: '10.0.0.8',
        userAgent: 'Mozilla/5.0',
        occurredAt: expect.any(Date),
      }),
    );
  });
});
