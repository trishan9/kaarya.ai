import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { AUTH_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
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
  let logger: jest.Mocked<PinoLoggerService>;
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

    logger = {
      log: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    service = new AuthService(userService, jwtService, logger);
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
    mockedArgon2.hash.mockResolvedValue('hashed');
    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({
      id: 'user-1',
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
      expect.objectContaining({ id: 'user-1', email: 'user@example.com' }),
    );
    expect(result).not.toHaveProperty('password');
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
});
