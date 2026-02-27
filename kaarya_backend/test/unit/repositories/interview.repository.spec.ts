import { InterviewRepository } from 'src/repositories/interview.repository';

describe('InterviewRepository', () => {
  const createRepository = (model: any) => new InterviewRepository(model);

  it('should create interview document', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'i1' });
    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    const repository = createRepository(model);

    const result = await repository.create({ title: 'Interview' } as never);
    expect(save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'i1' });
  });

  it('should find by id and handle empty id', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'i1' });
    const model = {
      findById: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById('i1')).toEqual({ id: 'i1' });
  });

  it('should list interviews with defaults and explicit options', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: 'i1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(3);

    const model = {
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec: findExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    const first = await repository.findAll({ page: 1, size: 10 });
    const second = await repository.findAll({
      page: 2,
      size: 5,
      filter: { status: 'published' },
      sort: { updatedAt: -1 },
    });

    expect(model.find).toHaveBeenNthCalledWith(1, {});
    expect(model.find).toHaveBeenNthCalledWith(2, { status: 'published' });
    expect(sort).toHaveBeenNthCalledWith(1, { createdAt: -1, _id: -1 });
    expect(sort).toHaveBeenNthCalledWith(2, { updatedAt: -1 });
    expect(skip).toHaveBeenNthCalledWith(2, 5);
    expect(limit).toHaveBeenNthCalledWith(2, 5);
    expect(first).toEqual({ interviews: [{ id: 'i1' }], total: 3 });
    expect(second).toEqual({ interviews: [{ id: 'i1' }], total: 3 });
  });

  it('should update and delete by id and handle empty id', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: 'i1' });
    const deleteExec = jest.fn().mockResolvedValue({ id: 'i1' });
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.deleteById('')).toBeNull();

    const updated = await repository.updateById('i1', { title: 'Updated' } as never);
    const deleted = await repository.deleteById('i1');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'i1',
      { title: 'Updated' },
      { new: true },
    );
    expect(updated).toEqual({ id: 'i1' });
    expect(deleted).toEqual({ id: 'i1' });
  });

  it('should increment attempts and touch interview timestamp', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'i1', attemptsCount: 2 });
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.incrementAttemptsAndTouch('')).toBeNull();

    const incremented = await repository.incrementAttemptsAndTouch('i1', -5);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'i1',
      {
        $inc: { attemptsCount: 0 },
        $set: { lastAttemptAt: expect.any(Date) },
      },
      { new: true },
    );
    expect(incremented).toEqual({ id: 'i1', attemptsCount: 2 });
  });
});

