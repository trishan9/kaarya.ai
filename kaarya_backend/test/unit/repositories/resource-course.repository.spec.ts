import { ResourceCourseRepository } from 'src/repositories/resource-course.repository';

describe('ResourceCourseRepository', () => {
  const createRepository = (model: any) => new ResourceCourseRepository(model);

  it('should create a course document', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'c1' });
    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    const repository = createRepository(model);

    const result = await repository.create({ title: 'Course' } as never);
    expect(save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'c1' });
  });

  it('should find by id and return null for empty id', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'c1' });
    const model = {
      findById: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findById('')).toBeNull();
    const found = await repository.findById('c1');
    expect(found).toEqual({ id: 'c1' });
  });

  it('should list courses with defaults and explicit filters', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: 'c1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(2);

    const model = {
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec: findExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    const withDefaults = await repository.findAll({ page: 1, size: 10 });
    const filtered = await repository.findAll({
      page: 2,
      size: 5,
      filter: { visibility: 'public' },
      sort: { updatedAt: -1 },
    });

    expect(model.find).toHaveBeenNthCalledWith(1, {});
    expect(model.find).toHaveBeenNthCalledWith(2, { visibility: 'public' });
    expect(sort).toHaveBeenNthCalledWith(1, { createdAt: -1, _id: -1 });
    expect(sort).toHaveBeenNthCalledWith(2, { updatedAt: -1 });
    expect(skip).toHaveBeenNthCalledWith(1, 0);
    expect(skip).toHaveBeenNthCalledWith(2, 5);
    expect(limit).toHaveBeenNthCalledWith(2, 5);
    expect(withDefaults).toEqual({ courses: [{ id: 'c1' }], total: 2 });
    expect(filtered).toEqual({ courses: [{ id: 'c1' }], total: 2 });
  });

  it('should update and delete by id', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: 'c1' });
    const deleteExec = jest.fn().mockResolvedValue({ id: 'c1' });
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.deleteById('')).toBeNull();

    const updated = await repository.updateById('c1', { title: 'Updated' } as never);
    const deleted = await repository.deleteById('c1');

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      { title: 'Updated' },
      { new: true },
    );
    expect(updated).toEqual({ id: 'c1' });
    expect(deleted).toEqual({ id: 'c1' });
  });
});

