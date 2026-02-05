import { HttpStatus } from '@nestjs/common';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { ACUserRepository } from 'src/repositories/user.repository';
import { USER_MESSAGES } from 'src/constants/messages.constants';

const buildRepository = () =>
  ({
    create: jest.fn(),
    findAll: jest.fn(),
    getAnalytics: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  }) as unknown as jest.Mocked<ACUserRepository>;

describe('AdminUserService', () => {
  let service: AdminUserService;
  let repo: jest.Mocked<ACUserRepository>;

  beforeEach(() => {
    repo = buildRepository();
    service = new AdminUserService(repo);
  });

  it('should reject invalid ids', async () => {
    try {
      await service.getUserById('bad-id');
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as Error & {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      expect(apiError.getStatus?.()).toBe(HttpStatus.BAD_REQUEST);
      expect(apiError.getResponse?.()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.INVALID_ID }),
      );
    }
  });

  it('should reject missing users', async () => {
    repo.findById.mockResolvedValue(null);
    const id = '507f191e810c19729de860ea';

    try {
      await service.getUserById(id);
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

  it('should return sanitized users', async () => {
    const id = '507f191e810c19729de860ea';
    repo.findById.mockResolvedValue({
      id,
      email: 'user@example.com',
      password: 'hashed',
      _id: id,
    } as never);

    const result = await service.getUserById(id);

    expect(result).toEqual(expect.objectContaining({ id }));
    expect(result).not.toHaveProperty('password');
  });

  it('should build paginated responses', async () => {
    repo.findAll.mockResolvedValue({
      users: [
        { id: 'user-1', email: 'a@example.com', password: 'hashed' },
        { id: 'user-2', email: 'b@example.com', password: 'hashed' },
      ] as never,
      total: 2,
    });

    const result = await service.getAllUsers({ page: 1, size: 2, search: '' });

    expect(result.users).toHaveLength(2);
    expect(result.users[0]).not.toHaveProperty('password');
    expect(result.meta.totalItems).toBe(2);
  });

  it('should derive analytics data', async () => {
    repo.getAnalytics.mockResolvedValue({
      totalUsers: 3,
      totalAdmins: 1,
      newThisWeek: 2,
      signupTrend: [
        { year: 2024, month: 1, value: 1 },
        { year: 2024, month: 2, value: 2 },
      ],
    });

    const result = await service.getUsersAnalytics();

    expect(result.totalUsers).toBe(3);
    expect(result.totalAdmins).toBe(1);
    expect(result.roleBreakdown).toEqual(
      expect.arrayContaining([
        { name: 'admin', value: 1 },
        { name: 'user', value: 2 },
      ]),
    );
    expect(result.signupTrend).toHaveLength(6);
  });

  it('should delegate update and delete operations', async () => {
    repo.updateById.mockResolvedValue({ id: 'user-1' } as never);
    repo.deleteById.mockResolvedValue({ id: 'user-1' } as never);

    await expect(
      service.updateUser('user-1', { name: 'Updated' }),
    ).resolves.toEqual({ id: 'user-1' });

    await expect(service.deleteUser('user-1')).resolves.toEqual({
      id: 'user-1',
    });
  });
});
