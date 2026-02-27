import { Types } from 'mongoose';
import { JobPostingRepository } from 'src/repositories/job-posting.repository';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';

const buildChain = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    skip: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('JobPostingRepository', () => {
  const jobId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();

  it('should create and find by id', async () => {
    const save = jest.fn().mockResolvedValue({ id: jobId });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: jobId }) });
    const repository = new JobPostingRepository(ctor);

    expect(await repository.create({ title: 'Backend' } as never)).toEqual({
      id: jobId,
    });

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(jobId)).toEqual({ id: jobId });
  });

  it('should list with full filter combinations and with minimal filters', async () => {
    const findChain = buildChain([{ id: jobId }]);
    const countExec = jest.fn().mockResolvedValue(4);
    const model = {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = new JobPostingRepository(model);

    const createdFrom = new Date('2026-01-01T00:00:00.000Z');
    const createdTo = new Date('2026-02-01T00:00:00.000Z');
    const deadlineFrom = new Date('2026-03-01T00:00:00.000Z');
    const deadlineTo = new Date('2026-04-01T00:00:00.000Z');

    const full = await repository.findAll({
      page: 2,
      size: 5,
      search: 'Backend (API)',
      status: JobPostingStatus.OPEN,
      visibility: JobVisibility.GLOBAL,
      companyId,
      collegeId,
      accessibleCollegeIds: [collegeId],
      location: 'Kath.*',
      employmentType: 'Full-Time',
      engagementType: 'Contract',
      workMode: JobWorkMode.HYBRID,
      remoteOnly: true,
      jobIds: [jobId],
      createdFrom,
      createdTo,
      deadlineFrom,
      deadlineTo,
      sort: { viewsCount: -1 },
    });

    const fullFilter = model.find.mock.calls[0][0];
    expect(fullFilter.$and).toHaveLength(14);
    expect(findChain.sort).toHaveBeenCalledWith({ viewsCount: -1 });
    expect(findChain.skip).toHaveBeenCalledWith(5);
    expect(findChain.limit).toHaveBeenCalledWith(5);
    expect(full).toEqual({ jobs: [{ id: jobId }], total: 4 });

    await repository.findAll({
      page: 1,
      size: 10,
      status: JobPostingStatus.CLOSED,
    });
    expect(model.find).toHaveBeenLastCalledWith({ status: JobPostingStatus.CLOSED });
  });

  it('should update/delete and remove by company/college ids', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: jobId, status: JobPostingStatus.CLOSED });
    const deleteExec = jest.fn().mockResolvedValue({ id: jobId });
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
      deleteMany: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ deletedCount: 2 }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const repository = new JobPostingRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(jobId, { status: JobPostingStatus.CLOSED })).toEqual({
      id: jobId,
      status: JobPostingStatus.CLOSED,
    });

    expect(await repository.deleteById('')).toBeNull();
    expect(await repository.deleteById(jobId)).toEqual({ id: jobId });

    expect(await repository.deleteManyByCompanyId('')).toBe(0);
    expect(await repository.deleteManyByCompanyId(companyId)).toBe(2);
    expect(await repository.deleteManyByCollegeId('')).toBe(0);
    expect(await repository.deleteManyByCollegeId(collegeId)).toBe(0);
  });

  it('should increment views and set applications count with clamped values', async () => {
    const model = {
      findByIdAndUpdate: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: jobId, viewsCount: 2 }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: jobId, applicationsCount: 3 }) }),
    } as any;
    const repository = new JobPostingRepository(model);

    expect(await repository.incrementViewsCount('')).toBeNull();
    expect(await repository.incrementViewsCount(jobId, -5)).toEqual({
      id: jobId,
      viewsCount: 2,
    });
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      jobId,
      { $inc: { viewsCount: 0 } },
      { new: true },
    );

    expect(await repository.setApplicationsCount('' as string, 1)).toBeNull();
    expect(await repository.setApplicationsCount(jobId, 3.8)).toEqual({
      id: jobId,
      applicationsCount: 3,
    });
    expect(model.findByIdAndUpdate).toHaveBeenLastCalledWith(
      jobId,
      { applicationsCount: 3 },
      { new: true },
    );
  });
});
