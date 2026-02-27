import { Types } from 'mongoose';
import { RecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';

const buildChain = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    skip: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockImplementation(() => chain),
    populate: jest.fn().mockImplementation(() => chain),
    select: jest.fn().mockImplementation(() => chain),
    lean: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('RecruiterProfileRepository', () => {
  const recruiterId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();

  it('should create and find recruiter/company memberships', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'rp-1' });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    const findOneChain = buildChain({ id: 'rp-1' });
    ctor.findOne = jest.fn().mockReturnValue(findOneChain);
    const repository = new RecruiterProfileRepository(ctor);

    expect(await repository.create({ designation: 'TA' } as never)).toEqual({
      id: 'rp-1',
    });

    expect(await repository.findFirstByRecruiterId('')).toBeNull();
    expect(await repository.findFirstByRecruiterId(recruiterId)).toEqual({
      id: 'rp-1',
    });
    expect(findOneChain.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });

    expect(
      await repository.findByRecruiterAndCompany({
        recruiterId: '',
        companyId,
      }),
    ).toBeNull();
    expect(
      await repository.findByRecruiterAndCompany({
        recruiterId,
        companyId,
      }),
    ).toEqual({ id: 'rp-1' });
  });

  it('should upsert memberships and throw when upsert fails', async () => {
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'rp-1' }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }),
    } as any;
    const repository = new RecruiterProfileRepository(model);

    expect(
      await repository.upsertByRecruiterAndCompany(recruiterId, companyId, {
        designation: 'Recruiter',
      } as never),
    ).toEqual({ id: 'rp-1' });

    await expect(
      repository.upsertByRecruiterAndCompany(recruiterId, companyId, {}),
    ).rejects.toThrow('Recruiter membership upsert failed.');
  });

  it('should evaluate existence and list memberships by recruiter/company', async () => {
    const recruiterListChain = buildChain([{ id: 'rp-1' }]);
    const companyListChain = buildChain([{ id: 'rp-1' }]);
    const selectChain = buildChain([
      { companyId: new Types.ObjectId(companyId) },
      { companyId: undefined },
    ]);
    const model = {
      countDocuments: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) })
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(2) }),
      find: jest
        .fn()
        .mockReturnValueOnce(recruiterListChain)
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(companyListChain),
    } as any;
    const repository = new RecruiterProfileRepository(model);

    expect(
      await repository.existsByRecruiterAndCompany({
        recruiterId: '',
        companyId,
      }),
    ).toBe(false);
    expect(
      await repository.existsByRecruiterAndCompany({
        recruiterId,
        companyId,
      }),
    ).toBe(true);
    expect(
      await repository.existsByRecruiterAndCompany({
        recruiterId,
        companyId,
      }),
    ).toBe(false);

    expect(
      await repository.findAllByRecruiterId({
        recruiterId: '',
        page: 1,
        size: 10,
      }),
    ).toEqual({ recruiterProfiles: [], total: 0 });
    const byRecruiter = await repository.findAllByRecruiterId({
      recruiterId,
      page: 2,
      size: 5,
    });
    expect(recruiterListChain.skip).toHaveBeenCalledWith(5);
    expect(recruiterListChain.limit).toHaveBeenCalledWith(5);
    expect(byRecruiter).toEqual({ recruiterProfiles: [{ id: 'rp-1' }], total: 2 });

    expect(await repository.findCompanyIdsByRecruiterId('')).toEqual([]);
    expect(await repository.findCompanyIdsByRecruiterId(recruiterId)).toEqual([
      companyId,
    ]);

    expect(
      await repository.findAllByCompanyId({
        companyId: '',
        page: 1,
        size: 10,
      }),
    ).toEqual({ recruiterProfiles: [], total: 0 });
    const byCompany = await repository.findAllByCompanyId({
      companyId,
      page: 1,
      size: 10,
    });
    expect(byCompany).toEqual({ recruiterProfiles: [{ id: 'rp-1' }], total: 2 });
  });

  it('should delete memberships by recruiter/company and by company id', async () => {
    const model = {
      findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: 'rp-1' }) }),
      deleteMany: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ deletedCount: 3 }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const repository = new RecruiterProfileRepository(model);

    expect(
      await repository.deleteByRecruiterAndCompany({
        recruiterId: '',
        companyId,
      }),
    ).toBeNull();
    expect(
      await repository.deleteByRecruiterAndCompany({
        recruiterId,
        companyId,
      }),
    ).toEqual({ id: 'rp-1' });

    expect(await repository.deleteManyByCompanyId('')).toBe(0);
    expect(await repository.deleteManyByCompanyId(companyId)).toBe(3);
    expect(await repository.deleteManyByCompanyId(companyId)).toBe(0);
  });
});
