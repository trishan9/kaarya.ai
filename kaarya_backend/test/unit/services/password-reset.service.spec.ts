import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  jwtService: jest.Mocked<JwtService>;
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

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const emailService = {
    sendPasswordResetOtp: jest.fn(),
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
    jwtService,
    emailService,
    redisService,
    rateLimitService,
    configService,
    logger,
  );

  return {
    service,
    userService,
    jwtService,
    emailService,
    redisService,
    rateLimitService,
    logger,
    configService,
    redis,
  };
};

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

    jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);

    await service.requestReset('User@Example.com', { ip: '10.0.0.2' });

    expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      5,
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
  });

  it('should fall back to default expiry when configured value is invalid', async () => {
    const { service, userService, emailService } = setup({
      [CONFIG_KEYS.AUTH.RESET_OTP_EXPIRES]: '0',
    });
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);
    jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);

    await service.requestReset('user@example.com', { ip: '10.0.0.9' });

    expect(emailService.sendPasswordResetOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
      10,
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
    const { service, redis, jwtService } = setup();
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

    jest.spyOn(crypto, 'randomUUID').mockReturnValue('jti-1');
    jwtService.signAsync.mockResolvedValue('reset.jwt');

    const result = await service.verifyOtp('user@example.com', '123456', {
      ip: '10.0.0.6',
    });

    expect(result).toEqual({ resetToken: 'reset.jwt' });
    expect(await redis.get(`kaarya:reset:otp:${emailHash}`)).toBeNull();
    expect(await redis.get('kaarya:reset:token:jti-1')).toBe('user-1');
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
    const { service, jwtService } = setup();
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

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
    const { service, jwtService } = setup();
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      scope: 'password-reset',
      jti: 'missing',
    });

    await expect(
      service.resetPassword('reset.jwt', 'NewPassword!123', {
        ip: '10.0.0.12',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('should reject reset tokens with invalid payloads', async () => {
    const { service, jwtService } = setup();
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      scope: 'other',
      jti: 'jti-3',
    });

    await expect(
      service.resetPassword('reset.jwt', 'NewPassword!123', {
        ip: '10.0.0.14',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('should reset the password and clear the reset token', async () => {
    const { service, jwtService, userService, redis } = setup();
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      scope: 'password-reset',
      jti: 'jti-2',
    });
    await redis.set('kaarya:reset:token:jti-2', 'user-1', { EX: 60 });
    userService.getUserByIdRaw.mockResolvedValue({ id: 'user-1' } as never);
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.updatePassword.mockResolvedValue(true as never);

    await service.resetPassword('reset.jwt', 'NewPassword!123', {
      ip: '10.0.0.8',
    });

    expect(userService.updatePassword).toHaveBeenCalledWith('user-1', 'hashed');
    expect(await redis.get('kaarya:reset:token:jti-2')).toBeNull();
  });
});
