import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import argon2 from 'argon2';
import type { Model } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { AuthService } from 'src/services/auth.service';
import { UserSchemaClass } from 'src/entities/user.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('AuthService (integration)', () => {
  let module: TestingModule | undefined;
  let authService: AuthService;
  let userModel: Model<UserSchemaClass>;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authService = module.get(AuthService);
    userModel = module.get(getModelToken(UserSchemaClass.name));
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
  });

  it('should create users and store hashed passwords', async () => {
    const payload = {
      name: 'Integration User',
      email: 'integration@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    const result = await authService.signup(payload);

    expect(result).toEqual(
      expect.objectContaining({
        email: payload.email,
        name: payload.name,
      }),
    );
    expect(result).not.toHaveProperty('password');

    const stored = await userModel
      .findOne({ email: payload.email })
      .select('+password')
      .exec();

    expect(stored).not.toBeNull();
    expect(await argon2.verify(stored!.password!, payload.password)).toBe(true);
  });

  it('should log in users and return access tokens', async () => {
    const payload = {
      name: 'Integration User',
      email: 'login@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    await authService.signup(payload);

    const login = await authService.login({
      email: payload.email,
      password: payload.password,
    });

    expect(login.accessToken).toEqual(expect.any(String));
    expect(login.user).toEqual(
      expect.objectContaining({ email: payload.email }),
    );
  });

  it('should reject duplicate signups', async () => {
    const payload = {
      name: 'Integration User',
      email: 'duplicate@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    await authService.signup(payload);

    try {
      await authService.signup(payload);
      throw new Error('Expected signup to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(err.getResponse()).toMatchObject({
        message: AUTH_MESSAGES.EMAIL_IN_USE,
      });
    }
  });

  it('should reject login for unknown users', async () => {
    try {
      await authService.login({
        email: 'missing@example.com',
        password: 'Password123',
      });
      throw new Error('Expected login to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(err.getResponse()).toMatchObject({
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }
  });

  it('should reject login for invalid passwords', async () => {
    const payload = {
      name: 'Integration User',
      email: 'wrong-password@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    await authService.signup(payload);

    try {
      await authService.login({
        email: payload.email,
        password: 'WrongPassword123',
      });
      throw new Error('Expected login to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(err.getResponse()).toMatchObject({
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }
  });

  it('should update the current user profile', async () => {
    const payload = {
      name: 'Integration User',
      email: 'update@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    const created = await authService.signup(payload);
    if (!created) {
      throw new Error('Expected user to be created');
    }

    const updated = await authService.updateMe(created.id as string, {
      name: 'Updated',
    });

    expect(updated).toEqual(
      expect.objectContaining({ id: created.id, name: 'Updated' }),
    );
  });

  it('should reject updates that reuse existing emails', async () => {
    const first = await authService.signup({
      name: 'First',
      email: 'first@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    const second = await authService.signup({
      name: 'Second',
      email: 'second@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    if (!first || !second) {
      throw new Error('Expected users to be created');
    }

    try {
      await authService.updateMe(first.id as string, {
        email: 'second@example.com',
      });
      throw new Error('Expected updateMe to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(err.getResponse()).toMatchObject({
        message: AUTH_MESSAGES.EMAIL_IN_USE,
      });
    }
  });
});
