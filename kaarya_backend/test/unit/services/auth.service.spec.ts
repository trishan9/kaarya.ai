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
    } as unknown as jest.Mocked<UserService>;

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailService = {
      sendOnboardingEmail: jest.fn(),
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
    } as unknown as jest.Mocked<ACAuthIdentityRepository>;

    oauthService = {
      createOAuthState: jest.fn(),
      handleOAuthProviderError: jest.fn(),
      handleOAuthCallback: jest.fn(),
      exchangeOAuthResultToken: jest.fn(),
      completeOAuthLink: jest.fn(),
    } as unknown as jest.Mocked<AuthOAuthService>;

    const gamificationService = {
      awardProfileUpdated: jest.fn(),
    } as never;

    service = new AuthService(
      userService,
      jwtService,
      emailService,
      logger,
      authIdentityRepository,
      oauthService,
      gamificationService,
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
});
