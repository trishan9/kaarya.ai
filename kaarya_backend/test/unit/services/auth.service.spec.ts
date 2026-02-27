import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { AUTH_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { ACAuthIdentityRepository } from 'src/repositories/auth-identity.repository';
import { AuthOAuthService } from 'src/services/auth-oauth.service';
import { AuthService } from 'src/services/auth.service';
import { EmailService } from 'src/services/email.service';
import { UserService } from 'src/services/user.service';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserRole } from 'src/types/user-role.enum';

jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    verify: jest.fn(),
    argon2id: 'argon2id',
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let logger: jest.Mocked<PinoLoggerService>;
  let authIdentityRepository: jest.Mocked<ACAuthIdentityRepository>;
  let oauthService: jest.Mocked<AuthOAuthService>;
  let gamificationService: { awardProfileUpdated: jest.Mock };
  const mockedArgon2 = argon2 as unknown as {
    hash: jest.Mock;
    verify: jest.Mock;
    argon2id: string;
  };

  beforeEach(() => {
    userService = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      getUserById: jest.fn(),
      getUserByIdRaw: jest.fn(),
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailService = {
      sendOnboardingEmail: jest.fn(),
      sendPasswordChanged: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    authIdentityRepository = {
      create: jest.fn(),
      findByUserAndProvider: jest.fn(),
      updateById: jest.fn(),
      findByUserId: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<ACAuthIdentityRepository>;

    oauthService = {
      createOAuthState: jest.fn(),
      handleOAuthProviderError: jest.fn(),
      handleOAuthCallback: jest.fn(),
      exchangeOAuthResultToken: jest.fn(),
      completeOAuthLink: jest.fn(),
    } as unknown as jest.Mocked<AuthOAuthService>;

    gamificationService = {
      awardProfileUpdated: jest.fn(),
    };

    service = new AuthService(
      userService,
      jwtService,
      emailService,
      logger,
      authIdentityRepository,
      oauthService,
      gamificationService as never,
    );
  });

  it('should prevent duplicate signups', async () => {
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);

    try {
      await service.signup({
        name: 'User',
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.CONFLICT);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.EMAIL_IN_USE }),
      );
    }
  });

  it('should hash passwords and returns sanitized users on signup', async () => {
    const userId = '507f191e810c19729de860ea';
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue(
      null as never,
    );
    userService.createUser.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      password: 'hashed',
    } as never);

    const result = await service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed' }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: userId, email: 'user@example.com' }),
    );
    expect(result).not.toHaveProperty('password');
    expect(emailService.sendOnboardingEmail).toHaveBeenCalledWith(
      'user@example.com',
      { userName: undefined },
    );
    expect(authIdentityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AuthProvider.EMAIL,
        email: 'user@example.com',
      }),
    );
  });

  it('should reject login when the user does not exist', async () => {
    userService.getUserByEmail.mockResolvedValue(null);

    try {
      await service.login({
        email: 'user@example.com',
        password: 'Password123',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_CREDENTIALS }),
      );
    }
  });

  it('should reject login when the password is missing', async () => {
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as never);

    try {
      await service.login({
        email: 'user@example.com',
        password: 'Password123',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_CREDENTIALS }),
      );
    }
  });

  it('should reject login when the password is invalid', async () => {
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed',
    } as never);
    mockedArgon2.verify.mockResolvedValue(false);

    try {
      await service.login({
        email: 'user@example.com',
        password: 'Password123',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.INVALID_CREDENTIALS }),
      );
    }
  });

  it('should return a token and sanitized user on login', async () => {
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed',
      role: UserRole.USER,
    } as never);
    mockedArgon2.verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('token');

    const result = await service.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user).toEqual(
      expect.objectContaining({ id: 'user-1', email: 'user@example.com' }),
    );
    expect(result.user).not.toHaveProperty('password');
  });

  it('should require an id for fetching the current user', async () => {
    try {
      await service.me('');
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.INVALID_ID }),
      );
    }
  });

  it('should require an id for updates', async () => {
    try {
      await service.updateMe('', {});
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.UNAUTHORIZED);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.INVALID_ID }),
      );
    }
  });

  it('should prevent email collisions on update', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue({ id: 'user-2' } as never);

    try {
      await service.updateMe('user-1', { email: 'new@example.com' });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.CONFLICT);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.EMAIL_IN_USE }),
      );
    }
  });

  it('should update and returns a sanitized user', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.updateUser.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
      password: 'hashed',
    } as never);

    const result = await service.updateMe('user-1', { name: 'Updated' });

    expect(result).toEqual(
      expect.objectContaining({ id: 'user-1', email: 'old@example.com' }),
    );
    expect(result).not.toHaveProperty('password');
  });

  it('should propagate not-found errors on update', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.updateUser.mockResolvedValue(null);

    try {
      await service.updateMe('user-1', { name: 'Updated' });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.NOT_FOUND);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.NOT_FOUND }),
      );
    }
  });

  it('should delegate OAuth state creation', async () => {
    oauthService.createOAuthState.mockResolvedValue('opaque-state');

    const result = await service.createOAuthState({
      provider: AuthProvider.GOOGLE,
      redirectUri: 'http://localhost:3000/oauth/callback',
      intent: 'login',
    });

    expect(result).toBe('opaque-state');
    expect(oauthService.createOAuthState).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      redirectUri: 'http://localhost:3000/oauth/callback',
      intent: 'login',
    });
  });

  it('should skip onboarding email when created user has no email', async () => {
    const userId = '507f191e810c19729de860eb';
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue(
      null as never,
    );
    userService.createUser.mockResolvedValue({
      id: userId,
      email: null,
      name: 'User',
    } as never);

    await service.signup({
      name: 'User',
      email: 'NoMail@Example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(emailService.sendOnboardingEmail).not.toHaveBeenCalled();
    expect(authIdentityRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should log onboarding failures and continue signup flow', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue(
      null as never,
    );
    userService.createUser.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      email: 'user@example.com',
      name: 'User',
    } as never);
    emailService.sendOnboardingEmail.mockRejectedValue('mail-down');

    const result = await service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(result).toEqual(
      expect.objectContaining({ email: 'user@example.com' }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('mail-down'),
      undefined,
      AuthService.name,
    );
  });

  it('should log onboarding failures when provider throws Error instances', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue(
      null as never,
    );
    userService.createUser.mockResolvedValue({
      id: '507f191e810c19729de860ed',
      email: 'user@example.com',
      name: 'User',
    } as never);
    emailService.sendOnboardingEmail.mockRejectedValue(
      new Error('smtp provider failed'),
    );

    await service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('smtp provider failed'),
      undefined,
      AuthService.name,
    );
  });

  it('should normalize null email to undefined when signing access tokens', async () => {
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-2',
      email: null,
      password: 'hashed',
      role: UserRole.USER,
    } as never);
    mockedArgon2.verify.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('null-email-token');

    const result = await service.login({
      email: 'USER@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('null-email-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-2',
        email: undefined,
        role: UserRole.USER,
      }),
    );
  });

  it('should return linked accounts with mapped metadata and fallback provider from me()', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      provider: AuthProvider.GOOGLE,
    } as never);
    userService.getUserByIdRaw.mockResolvedValue({ id: 'user-1' } as never);
    authIdentityRepository.findByUserId.mockResolvedValue([
      {
        provider: AuthProvider.EMAIL,
        email: 'user@example.com',
        emailVerified: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        lastLoginAt: new Date('2025-01-02T00:00:00.000Z'),
      },
    ] as never);

    const result = await service.me('user-1');

    expect(result.linkedAccounts).toEqual([
      {
        provider: AuthProvider.EMAIL,
        email: 'user@example.com',
        emailVerified: true,
        linkedAt: '2025-01-01T00:00:00.000Z',
        lastLoginAt: '2025-01-02T00:00:00.000Z',
      },
    ]);
    expect(result.linkedProviders).toEqual([
      AuthProvider.EMAIL,
      AuthProvider.GOOGLE,
    ]);
  });

  it('should return linked account data even when current user record is missing', async () => {
    userService.getUserById.mockResolvedValue(null);
    userService.getUserByIdRaw.mockResolvedValue({ id: 'user-1' } as never);
    authIdentityRepository.findByUserId.mockResolvedValue([
      {
        provider: AuthProvider.GOOGLE,
        email: 'oauth@example.com',
      },
    ] as never);

    const result = await service.me('user-1');

    expect(result).toEqual(
      expect.objectContaining({
        linkedProviders: [AuthProvider.GOOGLE],
      }),
    );
  });

  it('should map linked accounts with null-safe defaults', async () => {
    userService.getUserByIdRaw.mockResolvedValue({ id: 'user-1' } as never);
    authIdentityRepository.findByUserId.mockResolvedValue([
      {
        provider: AuthProvider.GITHUB,
      },
    ] as never);

    const accounts = await service.getLinkedAccounts('user-1');

    expect(accounts).toEqual([
      {
        provider: AuthProvider.GITHUB,
        email: null,
        emailVerified: false,
        linkedAt: null,
        lastLoginAt: null,
      },
    ]);
  });

  it('should reject getLinkedAccounts when user id is missing', async () => {
    await expect(service.getLinkedAccounts('')).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('should reject unlinking OAuth provider for invalid input states', async () => {
    await expect(
      service.unlinkOAuthProvider('', AuthProvider.GITHUB),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });

    await expect(
      service.unlinkOAuthProvider('user-1', AuthProvider.EMAIL),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject unlink when target identity does not exist', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      provider: AuthProvider.EMAIL,
    } as never);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue(
      null as never,
    );

    await expect(
      service.unlinkOAuthProvider('user-1', AuthProvider.GOOGLE),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('should reject unlink when removing the final authentication method', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      provider: AuthProvider.GOOGLE,
    } as never);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue({
      id: 'google-identity',
      provider: AuthProvider.GOOGLE,
    } as never);
    authIdentityRepository.findByUserId.mockResolvedValue([
      { id: 'google-identity', provider: AuthProvider.GOOGLE },
    ] as never);

    await expect(
      service.unlinkOAuthProvider('user-1', AuthProvider.GOOGLE),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });

  it('should unlink provider and return refreshed linked provider state', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      provider: AuthProvider.EMAIL,
    } as never);
    authIdentityRepository.findByUserAndProvider
      .mockResolvedValueOnce({
        id: 'google-identity',
        provider: AuthProvider.GOOGLE,
      } as never)
      .mockResolvedValueOnce({
        id: 'email-identity',
        provider: AuthProvider.EMAIL,
        email: 'user@example.com',
      } as never);
    authIdentityRepository.findByUserId
      .mockResolvedValueOnce([
        { id: 'google-identity', provider: AuthProvider.GOOGLE },
        { id: 'email-identity', provider: AuthProvider.EMAIL },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'email-identity',
          provider: AuthProvider.EMAIL,
          email: 'user@example.com',
          emailVerified: true,
        },
      ] as never);

    const result = await service.unlinkOAuthProvider(
      'user-1',
      AuthProvider.GOOGLE,
    );

    expect(authIdentityRepository.deleteById).toHaveBeenCalledWith(
      'google-identity',
    );
    expect(result).toEqual({
      linkedAccounts: [
        {
          provider: AuthProvider.EMAIL,
          email: 'user@example.com',
          emailVerified: true,
          linkedAt: null,
          lastLoginAt: null,
        },
      ],
      linkedProviders: [AuthProvider.EMAIL],
    });
  });

  it('should reject update when the current user cannot be found', async () => {
    userService.getUserById.mockResolvedValue(null);

    await expect(service.updateMe('user-1', { name: 'Updated' })).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('should normalize updated email and maintain existing email identity records', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.updateUser.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: 'Renamed',
      photo: null,
    } as never);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue({
      id: 'identity-email',
      name: 'Existing Name',
      photo: 'https://img.existing',
    } as never);

    const result = await service.updateMe('user-1', {
      email: 'New@Example.com',
      name: 'Renamed',
    });

    expect(userService.updateUser).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      name: 'Renamed',
    });
    expect(authIdentityRepository.updateById).toHaveBeenCalledWith(
      'identity-email',
      expect.objectContaining({
        email: 'new@example.com',
        emailVerified: true,
      }),
    );
    expect(gamificationService.awardProfileUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'new@example.com',
      }),
    );
  });

  it('should preserve existing identity name/photo when updated values are undefined', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.updateUser.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      name: undefined,
      photo: undefined,
    } as never);
    authIdentityRepository.findByUserAndProvider.mockResolvedValue({
      id: 'identity-email',
      name: 'Existing Name',
      photo: 'https://img.existing',
    } as never);

    await service.updateMe('user-1', { email: 'new@example.com' });

    expect(authIdentityRepository.updateById).toHaveBeenCalledWith(
      'identity-email',
      expect.objectContaining({
        name: 'Existing Name',
        photo: 'https://img.existing',
      }),
    );
  });

  it('should swallow duplicate key errors while ensuring email identity', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({
      id: '507f191e810c19729de860ef',
      email: 'user@example.com',
      name: 'User',
    } as never);
    authIdentityRepository.findByUserAndProvider.mockRejectedValue({ code: 11000 });

    await expect(
      service.signup({
        name: 'User',
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    ).resolves.toEqual(expect.objectContaining({ email: 'user@example.com' }));

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn when ensureEmailIdentity fails with non-duplicate error', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({
      id: '507f191e810c19729de860f0',
      email: 'user@example.com',
      name: 'User',
    } as never);
    authIdentityRepository.findByUserAndProvider.mockRejectedValue(
      new Error('identity-store-down'),
    );

    await service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('identity-store-down'),
      AuthService.name,
    );
  });

  it('should warn using stringified values for non-Error ensureEmailIdentity failures', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({
      id: '507f191e810c19729de860f1',
      email: 'user@example.com',
      name: 'User',
    } as never);
    authIdentityRepository.findByUserAndProvider.mockRejectedValue('identity-failure');

    await service.signup({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('identity-failure'),
      AuthService.name,
    );
  });

  it('should delegate oauth provider callback operations', async () => {
    oauthService.handleOAuthProviderError.mockResolvedValue(
      'https://app.example.com/provider-error',
    );
    oauthService.handleOAuthCallback.mockResolvedValue(
      'https://app.example.com/provider-success',
    );
    oauthService.exchangeOAuthResultToken.mockResolvedValue({
      accessToken: 'oauth-token',
      user: { id: 'user-1' },
    } as never);
    oauthService.completeOAuthLink.mockResolvedValue({
      linked: true,
    } as never);

    const providerErrorResult = await service.handleOAuthProviderError({
      provider: AuthProvider.GOOGLE,
      state: 'state-1',
      error: 'access_denied',
    });
    const callbackResult = await service.handleOAuthCallback({
      provider: AuthProvider.GITHUB,
      state: 'state-2',
      profile: {
        provider: AuthProvider.GITHUB,
        id: 'oauth-id',
      } as never,
    });
    const exchanged = await service.exchangeOAuthResultToken('result-token');
    const completed = await service.completeOAuthLink('user-1', 'link-token');

    expect(providerErrorResult).toBe('https://app.example.com/provider-error');
    expect(callbackResult).toBe('https://app.example.com/provider-success');
    expect(exchanged).toEqual(
      expect.objectContaining({ accessToken: 'oauth-token' }),
    );
    expect(completed).toEqual(expect.objectContaining({ linked: true }));
  });

  it('should enforce password change prerequisites and failures', async () => {
    userService.getUserByIdRaw.mockResolvedValue(null as never);
    await expect(
      service.changePassword('user-1', 'old', 'new', {}),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });

    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: null,
    } as never);
    await expect(
      service.changePassword('user-1', 'old', 'new', {}),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });

    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    await expect(
      service.changePassword('user-1', 'old', 'new', {}),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });

    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-current',
    } as never);
    mockedArgon2.verify.mockResolvedValue(false);
    await expect(
      service.changePassword('user-1', 'wrong', 'new', {}),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });

    mockedArgon2.verify.mockResolvedValue(true);
    mockedArgon2.hash.mockResolvedValue('hashed-new');
    userService.updatePassword.mockResolvedValue(null);
    await expect(
      service.changePassword('user-1', 'old', 'new', {}),
    ).rejects.toMatchObject({ status: HttpStatus.INTERNAL_SERVER_ERROR });
  });

  it('should change password and continue when notification email fails', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Name',
    } as never);
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-current',
    } as never);
    mockedArgon2.verify.mockResolvedValue(true);
    mockedArgon2.hash.mockResolvedValue('hashed-next');
    userService.updatePassword.mockResolvedValue({
      id: 'user-1',
    } as never);
    emailService.sendPasswordChanged.mockRejectedValue(new Error('smtp down'));

    const result = await service.changePassword(
      'user-1',
      'old-password',
      'new-password',
      { ip: '127.0.0.1', userAgent: 'jest-agent' },
    );

    expect(result).toEqual({ changed: true });
    expect(emailService.sendPasswordChanged).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        userName: 'User Name',
        ipAddress: '127.0.0.1',
        userAgent: 'jest-agent',
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('smtp down'),
      undefined,
      AuthService.name,
    );
  });

  it('should log password-change notification failures for non-Error values', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Name',
    } as never);
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-current',
    } as never);
    mockedArgon2.verify.mockResolvedValue(true);
    mockedArgon2.hash.mockResolvedValue('hashed-next');
    userService.updatePassword.mockResolvedValue({
      id: 'user-1',
    } as never);
    emailService.sendPasswordChanged.mockRejectedValue('mail-service-down');

    await service.changePassword('user-1', 'old-password', 'new-password', {});

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('mail-service-down'),
      undefined,
      AuthService.name,
    );
  });

  it('should change password successfully when notification email sends', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Name',
    } as never);
    userService.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'hashed-current',
    } as never);
    mockedArgon2.verify.mockResolvedValue(true);
    mockedArgon2.hash.mockResolvedValue('hashed-next');
    userService.updatePassword.mockResolvedValue({
      id: 'user-1',
    } as never);
    emailService.sendPasswordChanged.mockResolvedValue(undefined as never);

    await expect(
      service.changePassword('user-1', 'old', 'new', {}),
    ).resolves.toEqual({ changed: true });

    expect(logger.error).not.toHaveBeenCalled();
  });
});
