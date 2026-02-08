import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { UserRole } from 'src/types/user-role.enum';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('AdminUserService (integration)', () => {
  let module: TestingModule;
  let adminService: AdminUserService;
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    adminService = module.get(AdminUserService);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
    await stopInMemoryMongo(mongo);
  });

  it('should create and retrieve users', async () => {
    const created = await adminService.createUser({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.ADMIN,
      provider: AuthProvider.EMAIL,
    });

    const fetched = await adminService.getUserById(created.id);

    expect(fetched).toEqual(
      expect.objectContaining({ id: created.id, email: 'admin@example.com' }),
    );
  });

  it('should paginate user lists', async () => {
    await adminService.createUser({
      name: 'User A',
      email: 'a@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });
    await adminService.createUser({
      name: 'User B',
      email: 'b@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });

    const result = await adminService.getAllUsers({ page: 1, size: 1 });

    expect(result.users).toHaveLength(1);
    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should search users by name', async () => {
    await adminService.createUser({
      name: 'Find Me',
      email: 'findme@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });
    await adminService.createUser({
      name: 'Another',
      email: 'another@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });

    const result = await adminService.getAllUsers({
      page: 1,
      size: 10,
      search: 'find',
    });

    expect(result.users).toHaveLength(1);
    expect(result?.users?.[0]?.email).toBe('findme@example.com');
  });

  it('should return analytics summaries', async () => {
    await adminService.createUser({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.ADMIN,
      provider: AuthProvider.EMAIL,
    });
    await adminService.createUser({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.USER,
      provider: AuthProvider.EMAIL,
    });

    const analytics = await adminService.getUsersAnalytics();

    expect(analytics.totalUsers).toBe(2);
    expect(analytics.totalAdmins).toBe(1);
    expect(analytics.totalStandardUsers).toBe(1);
    expect(analytics.newThisWeek).toBeGreaterThanOrEqual(2);
    expect(analytics.roleBreakdown).toEqual(
      expect.arrayContaining([
        { name: UserRole.ADMIN, value: 1 },
        { name: UserRole.USER, value: 1 },
      ]),
    );
    expect(analytics.signupTrend).toHaveLength(6);
  });

  it('should throw for invalid user ids', async () => {
    try {
      await adminService.getUserById('invalid-id');
      throw new Error('Expected getUserById to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.getResponse()).toMatchObject({
        message: USER_MESSAGES.INVALID_ID,
      });
    }
  });

  it('should throw for missing users', async () => {
    const missingId = new Types.ObjectId().toString();

    try {
      await adminService.getUserById(missingId);
      throw new Error('Expected getUserById to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(err.getResponse()).toMatchObject({
        message: USER_MESSAGES.NOT_FOUND,
      });
    }
  });

  it('should include password when requested', async () => {
    await adminService.createUser({
      name: 'With Password',
      email: 'with-password@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });

    const found = await adminService.getUserByEmail(
      'with-password@example.com',
      {
        includePassword: true,
      },
    );

    expect(found?.password).toBeDefined();
  });

  it('should update and delete users', async () => {
    const created = await adminService.createUser({
      name: 'User',
      email: 'update@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: AuthProvider.EMAIL,
    });

    const updated = await adminService.updateUser(created.id, {
      name: 'Updated',
    });

    expect(updated).toEqual(
      expect.objectContaining({ id: created.id, name: 'Updated' }),
    );

    const deleted = await adminService.deleteUser(created.id);

    expect(deleted).toEqual(expect.objectContaining({ id: created.id }));
  });
});
