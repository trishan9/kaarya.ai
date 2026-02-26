import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import {
  AUTH_MESSAGES,
  LOG_MESSAGES,
  USER_MESSAGES,
} from 'src/constants/messages.constants';
import { TOAuthIntent } from 'src/dtos/auth/oauth.dto';
import {
  TCreateUserDTO,
  TLoginDTO,
  TUpdateMeDTO,
} from 'src/dtos/users/user.dto';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { ACAuthIdentityRepository } from 'src/repositories/auth-identity.repository';
import {
  AuthOAuthService,
  OAuthResultPayload,
} from 'src/services/auth-oauth.service';
import { EmailService } from 'src/services/email.service';
import { GamificationService } from 'src/services/gamification.service';
import { UserService } from 'src/services/user.service';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';
import { UserRole } from 'src/types/user-role.enum';

type TLinkedAuthAccount = {
  provider: AuthProvider;
  email: string | null;
  emailVerified: boolean;
  linkedAt: string | null;
  lastLoginAt: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly logger: PinoLoggerService,
    private readonly authIdentityRepository: ACAuthIdentityRepository,
    private readonly oauthService: AuthOAuthService,
    private readonly gamificationService: GamificationService,
  ) {}

  async signup(payload: TCreateUserDTO) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const existingUser = await this.userService.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ApiError({
        statusCode: HttpStatus.CONFLICT,
        message: AUTH_MESSAGES.EMAIL_IN_USE,
      });
    }

    const hashedPassword = await argon2.hash(payload.password, {
      type: argon2.argon2id,
    });

    const user = await this.userService.createUser({
      ...payload,
      email: normalizedEmail,
      provider: payload.provider ?? AuthProvider.EMAIL,
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    if (user.email) {
      try {
        await this.emailService.sendOnboardingEmail(user.email, {
          userName: user.name,
        });
      } catch (error) {
        this.logger.error(
          `Onboarding email failed for ${user.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          undefined,
          AuthService.name,
        );
      }
    }

    await this.ensureEmailIdentity(
      user.id,
      normalizedEmail,
      user.name,
      user.photo,
    );

    return sanitizeUser(user);
  }

  async login(payload: TLoginDTO) {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const user = await this.userService.getUserByEmail(normalizedEmail, {
      includePassword: true,
    });

    if (!user || !user.password) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      payload.password,
    );

    if (!isPasswordValid) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const accessToken = await this.signAccessToken(
      user.id,
      user.email,
      user.role,
    );

    this.logger.log(
      `${LOG_MESSAGES.LOGIN_SUCCESS} ${user.id}`,
      AuthService.name,
    );

    return {
      user: sanitizeUser(user),
      accessToken,
    };
  }

  async me(id: string) {
    if (!id) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    const user = await this.userService.getUserById(id);
    const safeUser = user ?? {};
    const linkedAccounts = await this.getLinkedAccounts(id);
    const linkedProviders = this.getUniqueLinkedProviders(
      linkedAccounts,
      (safeUser as { provider?: AuthProvider }).provider,
    );

    return {
      ...safeUser,
      linkedAccounts,
      linkedProviders,
    };
  }

  async getLinkedAccounts(userId: string): Promise<TLinkedAuthAccount[]> {
    if (!userId) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    await this.userService.getUserByIdRaw(userId);
    const identities = await this.authIdentityRepository.findByUserId(userId);
    return this.mapLinkedAccounts(identities);
  }

  async unlinkOAuthProvider(userId: string, provider: AuthProvider) {
    if (!userId) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    if (provider === AuthProvider.EMAIL) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_PROVIDER_NOT_SUPPORTED,
      });
    }

    const currentUser = await this.userService.getUserByIdRaw(userId);
    const identityToUnlink =
      await this.authIdentityRepository.findByUserAndProvider(userId, provider);

    if (!identityToUnlink) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
      });
    }

    const identities = await this.authIdentityRepository.findByUserId(userId);
    const remaining = identities.filter(
      (identity) => identity.id !== identityToUnlink.id,
    );
    const hasRemainingOAuth = remaining.some(
      (identity) => identity.provider !== AuthProvider.EMAIL,
    );
    const hasPrimaryEmailCredential =
      currentUser.provider === AuthProvider.EMAIL &&
      remaining.some((identity) => identity.provider === AuthProvider.EMAIL);

    if (!hasRemainingOAuth && !hasPrimaryEmailCredential) {
      throw new ApiError({
        statusCode: HttpStatus.CONFLICT,
        message: AUTH_MESSAGES.OAUTH_UNLINK_LAST_METHOD,
      });
    }

    await this.authIdentityRepository.deleteById(identityToUnlink.id);

    const refreshedAccounts = await this.getLinkedAccounts(userId);
    return {
      linkedAccounts: refreshedAccounts,
      linkedProviders: this.getUniqueLinkedProviders(
        refreshedAccounts,
        currentUser.provider,
      ),
    };
  }

  async updateMe(id: string, payload: TUpdateMeDTO) {
    if (!id) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    const currentUser = await this.userService.getUserById(id);
    if (!currentUser) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
      });
    }

    if (payload.email && payload.email !== currentUser.email) {
      const normalizedEmail = this.normalizeEmail(payload.email);
      const existingUser =
        await this.userService.getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new ApiError({
          statusCode: HttpStatus.CONFLICT,
          message: AUTH_MESSAGES.EMAIL_IN_USE,
        });
      }
      payload.email = normalizedEmail;
    }

    const user = await this.userService.updateUser(id, payload);
    if (!user) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
      });
    }

    if (payload.email) {
      await this.ensureEmailIdentity(
        user.id,
        payload.email,
        user.name,
        user.photo,
      );
    }

    await this.gamificationService.awardProfileUpdated({
      userId: user.id,
      updatedAt: new Date(),
    });

    return sanitizeUser(user);
  }

  async createOAuthState(input: {
    provider: AuthProvider;
    redirectUri: string;
    intent?: TOAuthIntent;
    requestedByUserId?: string;
  }) {
    return await this.oauthService.createOAuthState(input);
  }

  async handleOAuthProviderError(input: {
    provider: AuthProvider;
    state?: string;
    error?: string;
    errorDescription?: string;
  }) {
    return await this.oauthService.handleOAuthProviderError(input);
  }

  async handleOAuthCallback(input: {
    provider: AuthProvider;
    state?: string;
    profile: OAuthProviderProfile;
  }) {
    return await this.oauthService.handleOAuthCallback(input);
  }

  async exchangeOAuthResultToken(
    resultToken: string,
  ): Promise<OAuthResultPayload> {
    return await this.oauthService.exchangeOAuthResultToken(resultToken);
  }

  async completeOAuthLink(userId: string, linkToken: string) {
    return await this.oauthService.completeOAuthLink(userId, linkToken);
  }

  private async ensureEmailIdentity(
    userId: string,
    email: string,
    name?: string | null,
    photo?: string | null,
  ) {
    try {
      const existing = await this.authIdentityRepository.findByUserAndProvider(
        userId,
        AuthProvider.EMAIL,
      );

      if (existing) {
        await this.authIdentityRepository.updateById(existing.id, {
          email,
          emailVerified: true,
          name: name ?? existing.name,
          photo: photo ?? existing.photo,
          lastLoginAt: new Date(),
        });
        return;
      }

      await this.authIdentityRepository.create({
        userId: new Types.ObjectId(userId),
        provider: AuthProvider.EMAIL,
        providerUserId: userId,
        email,
        emailVerified: true,
        name: name ?? null,
        photo: photo ?? null,
        lastLoginAt: new Date(),
      });
    } catch (error) {
      const isDuplicateError =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;

      if (!isDuplicateError) {
        this.logger.warn(
          `Unable to maintain email identity for ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          AuthService.name,
        );
      }
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async signAccessToken(
    userId: string,
    email: string | null,
    role: UserRole,
  ) {
    return await this.jwtService.signAsync({
      sub: userId,
      email: email ?? undefined,
      role,
    });
  }

  private mapLinkedAccounts(
    identities: Array<{
      provider: AuthProvider;
      email?: string | null;
      emailVerified?: boolean;
      createdAt?: Date;
      lastLoginAt?: Date;
    }>,
  ): TLinkedAuthAccount[] {
    return identities.map((identity) => ({
      provider: identity.provider,
      email: identity.email ?? null,
      emailVerified: Boolean(identity.emailVerified),
      linkedAt: identity.createdAt?.toISOString?.() ?? null,
      lastLoginAt: identity.lastLoginAt?.toISOString?.() ?? null,
    }));
  }

  private getUniqueLinkedProviders(
    linkedAccounts: TLinkedAuthAccount[],
    fallbackProvider?: AuthProvider,
  ): AuthProvider[] {
    const providers = linkedAccounts.map((account) => account.provider);
    if (fallbackProvider && !providers.includes(fallbackProvider)) {
      providers.push(fallbackProvider);
    }
    return Array.from(new Set(providers));
  }
}
