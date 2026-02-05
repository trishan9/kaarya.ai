import { HttpStatus } from '@nestjs/common';
import { UserService } from 'src/services/user.service';
import { ACUserRepository } from 'src/repositories/user.repository';
import { USER_MESSAGES } from 'src/constants/messages.constants';

const buildRepository = () =>
  ({
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateById: jest.fn(),
    findById: jest.fn(),
  }) as unknown as jest.Mocked<ACUserRepository>;

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<ACUserRepository>;

  beforeEach(() => {
    repo = buildRepository();
    service = new UserService(repo);
  });

  it('should create users via repository', async () => {
    repo.create.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.createUser({
      name: 'User',
      email: 'user@example.com',
      password: 'Password123',
    } as never);

    expect(result).toEqual({ id: 'user-1' });
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

  it('should delegate getUserByEmail and updateUser', async () => {
    repo.findByEmail.mockResolvedValue({ id: 'user-1' } as never);
    repo.updateById.mockResolvedValue({ id: 'user-1' } as never);

    await expect(service.getUserByEmail('user@example.com')).resolves.toEqual({
      id: 'user-1',
    });

    await expect(
      service.updateUser('user-1', { name: 'Updated' }),
    ).resolves.toEqual({ id: 'user-1' });
  });
});
