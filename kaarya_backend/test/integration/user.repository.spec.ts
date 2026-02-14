import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { UserRepository } from 'src/repositories/user.repository';
import { UserSchemaClass } from 'src/entities/user.schema';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserRole } from 'src/types/user-role.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('UserRepository (integration)', () => {
  let module: TestingModule | undefined;
  let repository: UserRepository;
  let userModel: Model<UserSchemaClass>;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repository = module.get(UserRepository);
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

  it('should create users and find by email', async () => {
    const created = await repository.create({
      name: 'Alpha',
      email: 'alpha@example.com',
      password: 'hashed',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const found = await repository.findByEmail('alpha@example.com', {
      includePassword: true,
    });

    expect(found?.id).toBe(created.id);
    expect(found?.password).toBe('hashed');
  });

  it('should return null for missing identifiers', async () => {
    expect(await repository.findByEmail('')).toBeNull();
    expect(await repository.findById('')).toBeNull();
    expect(await repository.updateById('', { name: 'x' })).toBeNull();
    expect(await repository.deleteById('')).toBeNull();
  });

  it('should return null for unknown ids', async () => {
    const missingId = new Types.ObjectId().toString();
    expect(await repository.findById(missingId)).toBeNull();
  });

  it('should update and delete users by id', async () => {
    const created = await repository.create({
      name: 'Beta',
      email: 'beta@example.com',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const updated = await repository.updateById(created.id, { name: 'Gamma' });
    expect(updated?.name).toBe('Gamma');

    const deleted = await repository.deleteById(created.id);
    expect(deleted?.id).toBe(created.id);
    expect(await repository.findById(created.id)).toBeNull();
  });

  it('should return empty pagination results when no users exist', async () => {
    const result = await repository.findAll({ page: 1, size: 5 });

    expect(result.total).toBe(0);
    expect(result.users).toHaveLength(0);
  });

  it('should paginate users with deterministic ordering', async () => {
    await userModel.create([
      {
        name: 'Oldest',
        email: 'oldest@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
        createdAt: new Date('2020-01-01'),
      },
      {
        name: 'Middle',
        email: 'middle@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
        createdAt: new Date('2021-01-01'),
      },
      {
        name: 'Newest',
        email: 'newest@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
        createdAt: new Date('2022-01-01'),
      },
    ]);

    const page1 = await repository.findAll({ page: 1, size: 2 });

    expect(page1.total).toBe(3);
    expect(page1.users).toHaveLength(2);
    expect(page1.users[0].email).toBe('newest@example.com');
    expect(page1.users[1].email).toBe('middle@example.com');
  });

  it('should paginate and search users with escaped filters', async () => {
    await userModel.create([
      {
        name: 'Alpha',
        email: 'alpha@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
      },
      {
        name: 'test+user',
        email: 'plus@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
      },
    ]);

    const result = await repository.findAll({
      page: 1,
      size: 10,
      search: 'test+user',
    });

    expect(result.total).toBe(1);
    expect(result.users[0].email).toBe('plus@example.com');
  });

  it('should search by email case-insensitively', async () => {
    await userModel.create({
      name: 'Casey',
      email: 'case@example.com',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const result = await repository.findAll({
      page: 1,
      size: 10,
      search: 'EXAMPLE',
    });

    expect(result.total).toBe(1);
    expect(result.users[0].email).toBe('case@example.com');
  });

  it('should include password when requested', async () => {
    await userModel.create({
      name: 'Hashed',
      email: 'hashed@example.com',
      password: 'hashed-password',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const withoutPassword = await repository.findByEmail('hashed@example.com');
    const withPassword = await repository.findByEmail('hashed@example.com', {
      includePassword: true,
    });

    expect(withoutPassword?.password).toBeUndefined();
    expect(withPassword?.password).toBe('hashed-password');
  });

  it('should return analytics summaries', async () => {
    await userModel.create([
      {
        name: 'Admin',
        email: 'admin@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.ADMIN,
        createdAt: new Date(),
      },
      {
        name: 'User',
        email: 'user@example.com',
        provider: AuthProvider.EMAIL,
        role: UserRole.USER,
        createdAt: new Date(),
      },
    ]);

    const analytics = await repository.getAnalytics();

    expect(analytics.totalUsers).toBe(2);
    expect(analytics.totalAdmins).toBe(1);
    expect(analytics.newThisWeek).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(analytics.signupTrend)).toBe(true);
  });
});
