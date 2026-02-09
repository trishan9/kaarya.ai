import { UserRepository } from 'src/repositories/user.repository';

describe('UserRepository', () => {
  it('should create users using the model', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'user-1' });
    const userModel = jest.fn().mockImplementation(() => ({ save })) as any;

    const repository = new UserRepository(userModel);
    const result = await repository.create({ name: 'User' });

    expect(save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'user-1' });
  });

  it('should find users with pagination and search', async () => {
    const exec = jest.fn().mockResolvedValue([{ id: 'user-1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(1);

    const userModel = {
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;

    const repository = new UserRepository(userModel);
    const result = await repository.findAll({
      page: 2,
      size: 5,
      search: 'test+user',
    });

    expect(userModel.find).toHaveBeenCalledWith({
      $or: [
        {
          name: { $regex: 'test\\+user', $options: 'i' },
        },
        {
          email: { $regex: 'test\\+user', $options: 'i' },
        },
      ],
    });
    expect(skip).toHaveBeenCalledWith(5);
    expect(limit).toHaveBeenCalledWith(5);
    expect(result).toEqual({ users: [{ id: 'user-1' }], total: 1 });
  });

  it('should handle empty search queries', async () => {
    const exec = jest.fn().mockResolvedValue([]);
    const userModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec,
      }),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn() }),
    } as any;

    const repository = new UserRepository(userModel);
    await repository.findAll({ page: 1, size: 10, search: '   ' });

    expect(userModel.find).toHaveBeenCalledWith({});
  });

  it('should return null for missing ids or emails', async () => {
    const userModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    } as any;

    const repository = new UserRepository(userModel);

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findByEmail('')).toBeNull();
    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.deleteById('')).toBeNull();

    expect(userModel.findById).not.toHaveBeenCalled();
  });

  it('should include password selection when requested', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'user-1' });
    const select = jest.fn().mockReturnThis();

    const userModel = {
      findOne: jest.fn().mockReturnValue({ select, exec }),
    } as any;

    const repository = new UserRepository(userModel);
    const result = await repository.findByEmail('user@example.com', {
      includePassword: true,
    });

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
    expect(select).toHaveBeenCalledWith('+password');
    expect(result).toEqual({ id: 'user-1' });
  });

  it('should update and delete users', async () => {
    const execUpdate = jest.fn().mockResolvedValue({ id: 'user-1' });
    const execDelete = jest.fn().mockResolvedValue({ id: 'user-1' });

    const userModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: execUpdate }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: execDelete }),
    } as any;

    const repository = new UserRepository(userModel);

    const updated = await repository.updateById('user-1', { name: 'New' });
    const deleted = await repository.deleteById('user-1');

    expect(updated).toEqual({ id: 'user-1' });
    expect(deleted).toEqual({ id: 'user-1' });
  });

  it('should build analytics summaries', async () => {
    const userModel = {
      countDocuments: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(10) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(2) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([{ _id: { year: 2024, month: 1 }, value: 5 }]),
      }),
    } as any;

    const repository = new UserRepository(userModel);
    const result = await repository.getAnalytics();

    expect(result).toEqual({
      totalUsers: 10,
      totalAdmins: 2,
      newThisWeek: 1,
      signupTrend: [{ year: 2024, month: 1, value: 5 }],
    });
  });
});
