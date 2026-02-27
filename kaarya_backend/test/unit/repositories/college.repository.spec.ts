import { Types } from 'mongoose';
import { CollegeRepository } from 'src/repositories/college.repository';

const buildChain = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    skip: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('CollegeRepository', () => {
  const collegeId = new Types.ObjectId().toString();
  const creatorId = new Types.ObjectId().toString();

  it('should create and resolve by id/invite code', async () => {
    const save = jest.fn().mockResolvedValue({ id: collegeId });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: collegeId }) });
    ctor.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: collegeId }) });
    const repository = new CollegeRepository(ctor);

    expect(await repository.create({ name: 'College A' } as never)).toEqual({
      id: collegeId,
    });

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(collegeId)).toEqual({ id: collegeId });

    expect(await repository.findByInviteCode('')).toBeNull();
    await repository.findByInviteCode(' clg-1 ');
    expect(ctor.findOne).toHaveBeenCalledWith({ inviteCode: 'CLG-1' });
  });

  it('should find by ids and by createdBy variants', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: collegeId }]);
    const findOneChain = buildChain({ id: collegeId });
    const findManyChain = buildChain([{ id: collegeId }]);
    const model = {
      find: jest
        .fn()
        .mockReturnValueOnce({ exec: findExec })
        .mockReturnValueOnce(findManyChain),
      findOne: jest.fn().mockReturnValue(findOneChain),
    } as any;
    const repository = new CollegeRepository(model);

    expect(await repository.findByIds([])).toEqual([]);
    expect(await repository.findByIds([collegeId, collegeId])).toEqual([
      { id: collegeId },
    ]);
    const idsFilter = model.find.mock.calls[0][0];
    expect(idsFilter._id.$in).toHaveLength(1);

    expect(await repository.findFirstByCreatedBy('')).toBeNull();
    expect(await repository.findFirstByCreatedBy(creatorId)).toEqual({
      id: collegeId,
    });
    expect(findOneChain.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });

    expect(await repository.findByCreatedBy('')).toEqual([]);
    expect(await repository.findByCreatedBy(creatorId)).toEqual([{ id: collegeId }]);
    expect(findManyChain.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
  });

  it('should update/delete and list with search', async () => {
    const findChain = buildChain([{ id: collegeId }]);
    const updateExec = jest.fn().mockResolvedValue({ id: collegeId, name: 'Updated' });
    const deleteExec = jest.fn().mockResolvedValue({ id: collegeId });
    const countExec = jest.fn().mockResolvedValue(2);
    const model = {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = new CollegeRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(collegeId, { name: 'Updated' })).toEqual({
      id: collegeId,
      name: 'Updated',
    });

    expect(await repository.deleteById('')).toBeNull();
    expect(await repository.deleteById(collegeId)).toEqual({ id: collegeId });

    const listed = await repository.findAll({
      page: 2,
      size: 4,
      search: 'Data.*',
    });
    expect(model.find).toHaveBeenLastCalledWith({
      name: {
        $regex: 'Data\\.\\*',
        $options: 'i',
      },
    });
    expect(findChain.skip).toHaveBeenCalledWith(4);
    expect(findChain.limit).toHaveBeenCalledWith(4);
    expect(listed).toEqual({ colleges: [{ id: collegeId }], total: 2 });

    await repository.findAll({ page: 1, size: 10, search: '' });
    expect(model.find).toHaveBeenLastCalledWith({});
  });
});
