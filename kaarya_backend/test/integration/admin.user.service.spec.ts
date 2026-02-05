import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { UserRole } from 'src/types/user-role.enum';
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
      provider: 'email',
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
      provider: 'email',
    });
    await adminService.createUser({
      name: 'User B',
      email: 'b@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: 'email',
    });

    const result = await adminService.getAllUsers({ page: 1, size: 1 });

    expect(result.users).toHaveLength(1);
    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should return analytics summaries', async () => {
    await adminService.createUser({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.ADMIN,
      provider: 'email',
    });
    await adminService.createUser({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.USER,
      provider: 'email',
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

  it('should update and delete users', async () => {
    const created = await adminService.createUser({
      name: 'User',
      email: 'update@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      provider: 'email',
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
