import { UserRepository } from 'src/repositories/user.repository';

describe('UserRepository', () => {
  const createRepository = (userModel: any) => {
    const gamificationProfileModel = {
      collection: { name: 'gamificationprofiles' },
    } as any;
    return new UserRepository(userModel, gamificationProfileModel);
  };

  it('should create users using the model', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'user-1' });
    const userModel = jest.fn().mockImplementation(() => ({ save })) as any;

    const repository = createRepository(userModel);
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

    const repository = createRepository(userModel);
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

    const repository = createRepository(userModel);
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

    const repository = createRepository(userModel);

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findByEmail('')).toBeNull();
    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.deleteById('')).toBeNull();

    expect(userModel.findById).not.toHaveBeenCalled();
  });

  it('should find a user by id when a valid id is provided', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'user-1' });
    const userModel = {
      findById: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = createRepository(userModel);

    const result = await repository.findById('507f191e810c19729de860ea');

    expect(userModel.findById).toHaveBeenCalledWith('507f191e810c19729de860ea');
    expect(result).toEqual({ id: 'user-1' });
  });

  it('should include password selection when requested', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'user-1' });
    const select = jest.fn().mockReturnThis();

    const userModel = {
      findOne: jest.fn().mockReturnValue({ select, exec }),
    } as any;

    const repository = createRepository(userModel);
    const result = await repository.findByEmail('user@example.com', {
      includePassword: true,
    });

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
    expect(select).toHaveBeenCalledWith('+password');
    expect(result).toEqual({ id: 'user-1' });
  });

  it('should find by normalized email without selecting password by default', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'user-2' });
    const select = jest.fn().mockReturnThis();
    const userModel = {
      findOne: jest.fn().mockReturnValue({ select, exec }),
    } as any;
    const repository = createRepository(userModel);

    const result = await repository.findByEmail('  USER@Example.com  ');

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
    expect(select).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'user-2' });
  });

  it('should update and delete users', async () => {
    const execUpdate = jest.fn().mockResolvedValue({ id: 'user-1' });
    const execDelete = jest.fn().mockResolvedValue({ id: 'user-1' });

    const userModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: execUpdate }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: execDelete }),
    } as any;

    const repository = createRepository(userModel);

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

    const repository = createRepository(userModel);
    const result = await repository.getAnalytics();

    expect(result).toEqual({
      totalUsers: 10,
      totalAdmins: 2,
      newThisWeek: 1,
      signupTrend: [{ year: 2024, month: 1, value: 5 }],
    });
  });

  it('should find users by ids and de-duplicate invalid entries', async () => {
    const exec = jest.fn().mockResolvedValue([{ id: 'user-1' }]);
    const userModel = {
      find: jest.fn().mockReturnValue({ exec }),
    } as any;

    const repository = createRepository(userModel);
    expect(await repository.findByIds([])).toEqual([]);

    const id = '507f191e810c19729de860ea';
    const result = await repository.findByIds([id, id, '', id]);

    expect(userModel.find).toHaveBeenCalledWith({
      _id: { $in: [expect.anything()] },
    });
    expect(result).toEqual([{ id: 'user-1' }]);
  });

  it('should resolve provider social users and return null for invalid inputs', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'social-user' });
    const userModel = {
      findOne: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = createRepository(userModel);

    expect(await repository.findByProviderSocialId('', 'abc')).toBeNull();
    expect(await repository.findByProviderSocialId('google', '')).toBeNull();

    const result = await repository.findByProviderSocialId('google', 'sid-1');
    expect(userModel.findOne).toHaveBeenCalledWith({
      provider: 'google',
      socialId: 'sid-1',
    });
    expect(result).toEqual({ id: 'social-user' });
  });

  it('should return empty leaderboard rows when candidate filter is an empty array', async () => {
    const userModel = {} as any;
    const repository = createRepository(userModel);

    const result = await repository.findCandidateLeaderboardRows({
      page: 1,
      size: 10,
      candidateIds: [],
    });

    expect(result).toEqual({ users: [], total: 0 });
  });

  it('should return empty leaderboard rows when aggregate returns no ranked ids', async () => {
    const aggregateExec = jest.fn().mockResolvedValue([]);
    const countExec = jest.fn().mockResolvedValue(13);
    const userModel = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(userModel);

    const result = await repository.findCandidateLeaderboardRows({
      page: 2,
      size: 5,
      candidateIds: ['507f191e810c19729de860ea'],
    });

    expect(userModel.aggregate).toHaveBeenCalled();
    const aggregatePipeline = userModel.aggregate.mock.calls[0][0];
    expect(aggregatePipeline[0]).toEqual(
      expect.objectContaining({
        $match: expect.objectContaining({
          _id: expect.any(Object),
          role: expect.any(Object),
        }),
      }),
    );
    expect(result).toEqual({ users: [], total: 13 });
  });

  it('should map ranked leaderboard ids to ordered documents', async () => {
    const rankedIds = [
      { _id: '507f191e810c19729de860ea' },
      { _id: '507f191e810c19729de860eb' },
    ];
    const aggregateExec = jest.fn().mockResolvedValue(rankedIds);
    const countExec = jest.fn().mockResolvedValue(2);
    const findExec = jest.fn().mockResolvedValue([
      { _id: '507f191e810c19729de860eb', name: 'B' },
      { _id: '507f191e810c19729de860ea', name: 'A' },
    ]);
    const userModel = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
      find: jest.fn().mockReturnValue({ exec: findExec }),
    } as any;

    const repository = createRepository(userModel);
    const result = await repository.findCandidateLeaderboardRows({
      page: 1,
      size: 10,
    });

    expect(result.total).toBe(2);
    expect(result.users).toEqual([
      { _id: '507f191e810c19729de860ea', name: 'A' },
      { _id: '507f191e810c19729de860eb', name: 'B' },
    ]);
  });

  it('should return zero candidates-ahead for missing user id and empty candidate scope', async () => {
    const userModel = {
      aggregate: jest.fn(),
    } as any;
    const repository = createRepository(userModel);

    expect(
      await repository.countCandidatesAheadOfUser({
        userId: '',
        xp: 0,
        score: 0,
      }),
    ).toBe(0);

    expect(
      await repository.countCandidatesAheadOfUser({
        userId: '507f191e810c19729de860ea',
        xp: 1,
        score: 1,
        candidateIds: [],
      }),
    ).toBe(0);
    expect(userModel.aggregate).not.toHaveBeenCalled();
  });

  it('should compute candidates-ahead count with and without aggregate results', async () => {
    const aggregateExec = jest
      .fn()
      .mockResolvedValueOnce([{ total: 4 }])
      .mockResolvedValueOnce([]);
    const userModel = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = createRepository(userModel);

    const first = await repository.countCandidatesAheadOfUser({
      userId: '507f191e810c19729de860ea',
      xp: 12,
      score: 8,
      candidateIds: ['507f191e810c19729de860eb'],
    });
    const second = await repository.countCandidatesAheadOfUser({
      userId: '507f191e810c19729de860ea',
      xp: 12,
      score: 8,
    });

    expect(first).toBe(4);
    expect(second).toBe(0);
    expect(userModel.aggregate).toHaveBeenCalledTimes(2);
    const pipeline = userModel.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual(
      expect.objectContaining({
        $match: expect.objectContaining({
          _id: expect.any(Object),
        }),
      }),
    );
  });
});
