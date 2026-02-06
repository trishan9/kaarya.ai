import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import crypto from 'crypto';
import ms from 'ms';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES, LOG_MESSAGES } from 'src/constants/messages.constants';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { EmailService } from 'src/services/email.service';
import { RateLimitService } from 'src/services/rate-limit.service';
import { RedisService } from 'src/services/redis.service';
import { UserService } from 'src/services/user.service';
import { AllConfigType } from 'src/types/config.type';

type ResetOtpState = {
  userId: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  expiresAt: string;
};

type ResetTokenPayload = {
  sub: string;
  scope: 'password-reset';
  jti: string;
  iat?: number;
  exp?: number;
};

type RequestMetadata = {
  ip: string;
  userAgent?: string;
};

@Injectable()
export class PasswordResetService {
  private readonly resetOtpSecret?: string;
  private readonly resetTokenSecret?: string;
  private readonly resetOtpTtlMs: number;
  private readonly resetOtpTtlSeconds: number;
  private readonly resetOtpMaxAttempts: number;
  private readonly resetRequestWindowSeconds: number;
  private readonly resetRequestMax: number;
  private readonly resetVerifyWindowSeconds: number;
  private readonly resetVerifyMax: number;
  private readonly resetPasswordWindowSeconds: number;
  private readonly resetPasswordMax: number;
  private readonly resetTokenTtlSeconds: number;
  private readonly redisPrefix: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly logger: PinoLoggerService,
  ) {
    const forgotSecret = this.configService.get(
      CONFIG_KEYS.AUTH.FORGOT_SECRET,
      { infer: true },
    );
    this.resetTokenSecret = forgotSecret;
    this.resetOtpSecret =
      this.configService.get(CONFIG_KEYS.AUTH.RESET_OTP_SECRET, {
        infer: true,
      }) ?? forgotSecret;

    const resetOtpExpires = this.configService.get(
      CONFIG_KEYS.AUTH.RESET_OTP_EXPIRES,
      { infer: true },
    );
    this.resetOtpTtlMs = this.parseMs(resetOtpExpires, 10 * 60 * 1000);
    this.resetOtpTtlSeconds = Math.ceil(this.resetOtpTtlMs / 1000);

    this.resetOtpMaxAttempts =
      this.configService.get(CONFIG_KEYS.AUTH.RESET_OTP_MAX_ATTEMPTS, {
        infer: true,
      }) ?? 5;

    const requestWindow = this.configService.get(
      CONFIG_KEYS.AUTH.RESET_REQUEST_WINDOW,
      { infer: true },
    );
    this.resetRequestWindowSeconds = Math.ceil(
      this.parseMs(requestWindow, 60 * 60 * 1000) / 1000,
    );
    this.resetRequestMax =
      this.configService.get(CONFIG_KEYS.AUTH.RESET_REQUEST_MAX, {
        infer: true,
      }) ?? 5;

    const verifyWindow = this.configService.get(
      CONFIG_KEYS.AUTH.RESET_VERIFY_WINDOW,
      { infer: true },
    );
    this.resetVerifyWindowSeconds = Math.ceil(
      this.parseMs(verifyWindow, 15 * 60 * 1000) / 1000,
    );
    this.resetVerifyMax =
      this.configService.get(CONFIG_KEYS.AUTH.RESET_VERIFY_MAX, {
        infer: true,
      }) ?? 10;

    const resetWindow = this.configService.get(
      CONFIG_KEYS.AUTH.RESET_PASSWORD_WINDOW,
      { infer: true },
    );
    this.resetPasswordWindowSeconds = Math.ceil(
      this.parseMs(resetWindow, 15 * 60 * 1000) / 1000,
    );
    this.resetPasswordMax =
      this.configService.get(CONFIG_KEYS.AUTH.RESET_PASSWORD_MAX, {
        infer: true,
      }) ?? 5;

    const resetTokenExpires = this.configService.get(
      CONFIG_KEYS.AUTH.FORGOT_EXPIRES,
      { infer: true },
    );
    this.resetTokenTtlSeconds = Math.ceil(
      this.parseMs(resetTokenExpires, 30 * 60 * 1000) / 1000,
    );

    this.redisPrefix =
      this.configService.get(CONFIG_KEYS.REDIS.KEY_PREFIX, { infer: true }) ??
      'kaarya';
  }

  async requestReset(email: string, metadata: RequestMetadata) {
    this.ensureConfigured();
    const normalizedEmail = this.normalizeEmail(email);
    const emailHash = this.hashIdentifier(normalizedEmail);

    await this.applyRequestRateLimits(emailHash, metadata.ip);

    const user = await this.userService.getUserByEmail(normalizedEmail);
    if (!user) {
      return;
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.resetOtpTtlMs);

    const state: ResetOtpState = {
      userId: user.id?.toString?.() ?? user._id?.toString?.() ?? '',
      otpHash,
      attempts: 0,
      maxAttempts: this.resetOtpMaxAttempts,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    if (!state.userId) {
      return;
    }

    await this.storeOtpState(emailHash, state, this.resetOtpTtlSeconds);
    try {
      await this.emailService.sendPasswordResetOtp(
        normalizedEmail,
        otp,
        Math.ceil(this.resetOtpTtlMs / 60000),
      );
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${state.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        undefined,
        PasswordResetService.name,
      );
    }

    this.logger.log(
      `${LOG_MESSAGES.PASSWORD_RESET_REQUEST} ${state.userId}`,
      PasswordResetService.name,
    );
  }

  async verifyOtp(email: string, otp: string, metadata: RequestMetadata) {
    this.ensureConfigured();
    const normalizedEmail = this.normalizeEmail(email);
    const emailHash = this.hashIdentifier(normalizedEmail);

    await this.applyVerifyRateLimits(emailHash, metadata.ip);

    const state = await this.getOtpState(emailHash);
    if (!state) {
      throw this.invalidOtpError();
    }

    const now = Date.now();
    if (now > new Date(state.expiresAt).getTime()) {
      await this.clearOtpState(emailHash);
      throw this.invalidOtpError();
    }

    if (state.attempts >= state.maxAttempts) {
      await this.clearOtpState(emailHash);
      throw this.invalidOtpError();
    }

    const isValid = this.compareOtp(otp, state.otpHash);
    if (!isValid) {
      await this.bumpOtpAttempts(emailHash, state);
      throw this.invalidOtpError();
    }

    await this.clearOtpState(emailHash);

    const resetToken = await this.issueResetToken(state.userId);

    this.logger.log(
      `${LOG_MESSAGES.PASSWORD_RESET_VERIFIED} ${state.userId}`,
      PasswordResetService.name,
    );

    return { resetToken };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    metadata: RequestMetadata,
  ) {
    this.ensureConfigured();
    await this.applyResetRateLimits(metadata.ip);

    let payload: ResetTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<ResetTokenPayload>(token, {
        secret: this.resetTokenSecret,
      });
    } catch {
      throw this.invalidResetTokenError();
    }

    if (!payload?.sub || payload.scope !== 'password-reset' || !payload.jti) {
      throw this.invalidResetTokenError();
    }

    const tokenKey = this.buildResetTokenKey(payload.jti);
    const client = await this.redisService.getClient();
    const storedUserId = await client.get(tokenKey);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw this.invalidResetTokenError();
    }

    let user;
    try {
      user = await this.userService.getUserByIdRaw(payload.sub);
    } catch {
      throw this.invalidResetTokenError();
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });

    const updated = await this.userService.updatePassword(
      user.id,
      hashedPassword,
    );
    if (!updated) {
      throw this.invalidResetTokenError();
    }

    await client.del(tokenKey);

    if (user.email) {
      try {
        await this.emailService.sendPasswordResetSuccess(user.email, {
          userName: user.name,
          occurredAt: new Date(),
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        });
      } catch (error) {
        this.logger.error(
          `Password reset success email failed for ${user.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          undefined,
          PasswordResetService.name,
        );
      }
    }

    this.logger.warn(
      `${LOG_MESSAGES.PASSWORD_RESET_COMPLETED} ${user.id}`,
      PasswordResetService.name,
    );
  }

  private ensureConfigured() {
    if (!this.resetOtpSecret || !this.resetTokenSecret) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Password reset is not configured.',
      });
    }
  }

  private parseMs(value: ms.StringValue | undefined, fallbackMs: number) {
    if (!value) return fallbackMs;
    const parsed = ms(value);
    if (typeof parsed !== 'number' || Number.isNaN(parsed) || parsed <= 0) {
      return fallbackMs;
    }
    return parsed;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashIdentifier(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private generateOtp() {
    const code = crypto.randomInt(0, 1_000_000);
    return `${code}`.padStart(6, '0');
  }

  private hashOtp(otp: string) {
    return crypto
      .createHmac('sha256', this.resetOtpSecret ?? 'otp')
      .update(otp)
      .digest('hex');
  }

  private compareOtp(candidate: string, expectedHash: string) {
    const candidateHash = this.hashOtp(candidate);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    if (expectedBuffer.length !== candidateBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, candidateBuffer);
  }

  private async storeOtpState(
    emailHash: string,
    state: ResetOtpState,
    ttlSeconds: number,
  ) {
    const key = this.buildOtpKey(emailHash);
    const client = await this.redisService.getClient();
    await client.set(key, JSON.stringify(state), { EX: ttlSeconds });
  }

  private async getOtpState(emailHash: string): Promise<ResetOtpState | null> {
    const key = this.buildOtpKey(emailHash);
    const client = await this.redisService.getClient();
    const raw = await client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ResetOtpState;
    } catch {
      await client.del(key);
      return null;
    }
  }

  private async clearOtpState(emailHash: string) {
    const key = this.buildOtpKey(emailHash);
    const client = await this.redisService.getClient();
    await client.del(key);
  }

  private async bumpOtpAttempts(emailHash: string, state: ResetOtpState) {
    const nextAttempts = state.attempts + 1;
    if (nextAttempts >= state.maxAttempts) {
      await this.clearOtpState(emailHash);
      return;
    }

    const key = this.buildOtpKey(emailHash);
    const client = await this.redisService.getClient();
    const ttl = await client.ttl(key);
    const ttlSeconds = ttl > 0 ? ttl : this.resetOtpTtlSeconds;
    const updatedState = { ...state, attempts: nextAttempts };
    await client.set(key, JSON.stringify(updatedState), { EX: ttlSeconds });
  }

  private async applyRequestRateLimits(emailHash: string, ip: string) {
    await this.rateLimitService.consume(
      this.buildRateLimitKey('request', 'email', emailHash),
      this.resetRequestMax,
      this.resetRequestWindowSeconds,
    );
    await this.rateLimitService.consume(
      this.buildRateLimitKey('request', 'ip', ip),
      this.resetRequestMax,
      this.resetRequestWindowSeconds,
    );
  }

  private async applyVerifyRateLimits(emailHash: string, ip: string) {
    await this.rateLimitService.consume(
      this.buildRateLimitKey('verify', 'email', emailHash),
      this.resetVerifyMax,
      this.resetVerifyWindowSeconds,
    );
    await this.rateLimitService.consume(
      this.buildRateLimitKey('verify', 'ip', ip),
      this.resetVerifyMax,
      this.resetVerifyWindowSeconds,
    );
  }

  private async applyResetRateLimits(ip: string) {
    await this.rateLimitService.consume(
      this.buildRateLimitKey('reset', 'ip', ip),
      this.resetPasswordMax,
      this.resetPasswordWindowSeconds,
    );
  }

  private async issueResetToken(userId: string) {
    const jti = crypto.randomUUID();
    const payload: ResetTokenPayload = {
      sub: userId,
      scope: 'password-reset',
      jti,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.resetTokenSecret,
      expiresIn: this.configService.get(CONFIG_KEYS.AUTH.FORGOT_EXPIRES, {
        infer: true,
      }),
    });

    const tokenKey = this.buildResetTokenKey(jti);
    const client = await this.redisService.getClient();
    await client.set(tokenKey, userId, { EX: this.resetTokenTtlSeconds });

    return token;
  }

  private buildOtpKey(emailHash: string) {
    return `${this.redisPrefix}:reset:otp:${emailHash}`;
  }

  private buildResetTokenKey(jti: string) {
    return `${this.redisPrefix}:reset:token:${jti}`;
  }

  private buildRateLimitKey(
    action: 'request' | 'verify' | 'reset',
    scope: 'email' | 'ip',
    value: string,
  ) {
    return `${this.redisPrefix}:reset:rl:${action}:${scope}:${value}`;
  }

  private invalidOtpError() {
    return new ApiError({
      statusCode: HttpStatus.BAD_REQUEST,
      message: AUTH_MESSAGES.INVALID_RESET_CODE,
    });
  }

  private invalidResetTokenError() {
    return new ApiError({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
    });
  }
}
