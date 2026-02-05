import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import argon2 from 'argon2';
import type { Model } from 'mongoose';
import { AppModule } from 'src/app.module';
import { AuthService } from 'src/services/auth.service';
import { UserSchemaClass } from 'src/entities/user.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('AuthService (integration)', () => {
  let module: TestingModule;
  let authService: AuthService;
  let userModel: Model<UserSchemaClass>;
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();

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
    await module.close();
    await stopInMemoryMongo(mongo);
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
});
