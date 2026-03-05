import { Types } from 'mongoose';
import { CompanyRepository } from 'src/repositories/company.repository';

const chainWithValue = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    skip: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('CompanyRepository', () => {
  const companyId = new Types.ObjectId().toString();

  it('should create and find by id/invite code', async () => {
    const save = jest.fn().mockResolvedValue({ id: companyId });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: companyId }) });
    ctor.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: companyId }) });
    const repository = new CompanyRepository(ctor);

    expect(await repository.create({ name: 'Acme' } as never)).toEqual({
      id: companyId,
    });

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(companyId)).toEqual({ id: companyId });

    expect(await repository.findByInviteCode('')).toBeNull();
    await repository.findByInviteCode(' kr-abc ');
    expect(ctor.findOne).toHaveBeenCalledWith({ inviteCode: 'KR-ABC' });
  });

  it('should find by ids and update/delete', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: companyId }]);
    const findByIdAndUpdateExec = jest.fn().mockResolvedValue({ id: companyId, name: 'Updated' });
    const findByIdAndDeleteExec = jest.fn().mockResolvedValue({ id: companyId });
    const model = {
      find: jest.fn().mockReturnValue({ exec: findExec }),
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValue({ exec: findByIdAndUpdateExec }),
      findByIdAndDelete: jest
        .fn()
        .mockReturnValue({ exec: findByIdAndDeleteExec }),
    } as any;
    const repository = new CompanyRepository(model);

    expect(await repository.findByIds([])).toEqual([]);
    expect(await repository.findByIds([companyId, companyId])).toEqual([
      { id: companyId },
    ]);
    const byIdsFilter = model.find.mock.calls[0][0];
    expect(byIdsFilter._id.$in).toHaveLength(1);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(companyId, { name: 'Updated' })).toEqual({
      id: companyId,
      name: 'Updated',
    });
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      companyId,
      { name: 'Updated' },
      { new: true },
    );

    expect(await repository.deleteById('')).toBeNull();
    expect(await repository.deleteById(companyId)).toEqual({ id: companyId });
  });

  it('should list companies with and without search filter', async () => {
    const findChain = chainWithValue([{ id: companyId }]);
    const countExec = jest.fn().mockResolvedValue(3);
    const model = {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = new CompanyRepository(model);

    const withSearch = await repository.findAll({
      page: 2,
      size: 5,
      search: 'Acme (Tech)',
    });
    expect(model.find).toHaveBeenLastCalledWith({
      name: {
        $regex: 'Acme \\(Tech\\)',
        $options: 'i',
      },
    });
    expect(findChain.skip).toHaveBeenCalledWith(5);
    expect(findChain.limit).toHaveBeenCalledWith(5);
    expect(withSearch).toEqual({ companies: [{ id: companyId }], total: 3 });

    await repository.findAll({ page: 1, size: 10, search: '   ' });
    expect(model.find).toHaveBeenLastCalledWith({});
  });
});
