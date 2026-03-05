import { Types } from 'mongoose';
import { ApplicationRepository } from 'src/repositories/application.repository';
import { ApplicationStatus } from 'src/types/application-status.enum';

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

describe('ApplicationRepository', () => {
  const createRepository = (model: any) => new ApplicationRepository(model);
  const id = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const jobId2 = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();
  const resumeId = new Types.ObjectId().toString();

  it('should create and find by id', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'a1' });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findById = jest.fn().mockReturnValue(buildChain({ id: 'a1' }));
    const repository = createRepository(ctor);

    expect(await repository.create({ status: ApplicationStatus.APPLIED } as never)).toEqual({
      id: 'a1',
    });
    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(id)).toEqual({ id: 'a1' });
  });

  it('should find by job + student combinations and by id for job', async () => {
    const findOneChain = buildChain({ id: 'a1' });
    const model = {
      findOne: jest.fn().mockReturnValue(findOneChain),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findByJobIdAndStudentId('', studentId)).toBeNull();
    expect(await repository.findByJobIdAndStudentId(jobId, '')).toBeNull();
    expect(await repository.findByJobIdAndStudentId(jobId, studentId)).toEqual({
      id: 'a1',
    });
    expect(model.findOne).toHaveBeenCalledWith({
      $or: [{ jobId: expect.any(Types.ObjectId) }, { jobId }],
      $and: [{ $or: [{ studentId: expect.any(Types.ObjectId) }, { studentId }] }],
    });

    expect(await repository.findByJobIdAndStudentIdWithRelations('', studentId)).toBeNull();
    expect(
      await repository.findByJobIdAndStudentIdWithRelations(jobId, studentId),
    ).toEqual({ id: 'a1' });

    expect(await repository.findByIdForJob('', id)).toBeNull();
    expect(await repository.findByIdForJob(jobId, '')).toBeNull();
    expect(await repository.findByIdForJob(jobId, id)).toEqual({ id: 'a1' });
  });

  it('should map applications by student and job ids', async () => {
    const model = {
      find: jest.fn().mockReturnValue(
        buildChain([
          { _id: new Types.ObjectId(), jobId: new Types.ObjectId(jobId), status: ApplicationStatus.APPLIED },
        ]),
      ),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findByStudentAndJobIds({ studentId: '', jobIds: [jobId] })).toEqual(
      [],
    );
    expect(await repository.findByStudentAndJobIds({ studentId, jobIds: [] })).toEqual([]);

    const rows = await repository.findByStudentAndJobIds({
      studentId,
      jobIds: [jobId, jobId],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      applicationId: expect.any(String),
      jobId,
      status: ApplicationStatus.APPLIED,
    });
  });

  it('should list by student with filters and count', async () => {
    const findChain = buildChain([{ id: 'a1' }]);
    const countExec = jest.fn().mockResolvedValue(3);
    const model = {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    const empty = await repository.findAllByStudentId({
      studentId: '',
      page: 1,
      size: 10,
    });
    const listed = await repository.findAllByStudentId({
      studentId,
      page: 2,
      size: 5,
      status: ApplicationStatus.REVIEWING,
      fromDate: new Date('2026-02-01T00:00:00.000Z'),
      toDate: new Date('2026-03-01T00:00:00.000Z'),
    });

    expect(empty).toEqual({ applications: [], total: 0 });
    expect(model.find).toHaveBeenLastCalledWith({
      studentId: expect.any(Types.ObjectId),
      status: { $in: [ApplicationStatus.REVIEWING] },
      createdAt: {
        $gte: new Date('2026-02-01T00:00:00.000Z'),
        $lt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });
    expect(findChain.skip).toHaveBeenCalledWith(5);
    expect(findChain.limit).toHaveBeenCalledWith(5);
    expect(listed).toEqual({ applications: [{ id: 'a1' }], total: 3 });
  });

  it('should count by student filters and map status counts', async () => {
    const countExec = jest.fn().mockResolvedValue(11);
    const aggregateExec = jest
      .fn()
      .mockResolvedValue([
        { _id: ApplicationStatus.APPLIED, count: 3 },
        { _id: ApplicationStatus.ACCEPTED, count: 1 },
      ]);
    const model = {
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = createRepository(model);

    expect(
      await repository.countByStudentWithFilters({
        studentId: '',
        statuses: [ApplicationStatus.APPLIED],
      }),
    ).toBe(0);
    expect(
      await repository.countByStudentWithFilters({
        studentId,
        statuses: [ApplicationStatus.APPLIED],
      }),
    ).toBe(11);

    expect(
      await repository.getStatusCountsByStudentWithFilters({ studentId: '' }),
    ).toEqual({
      applied: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewScheduled: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    });

    expect(
      await repository.getStatusCountsByStudentWithFilters({ studentId }),
    ).toEqual({
      applied: 3,
      reviewing: 0,
      shortlisted: 0,
      interviewScheduled: 0,
      accepted: 1,
      rejected: 0,
      withdrawn: 0,
    });
  });

  it('should resolve daily/job counts by student filters', async () => {
    const aggregateExec = jest
      .fn()
      .mockResolvedValueOnce([{ date: '2026-02-14', count: 2 }])
      .mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(jobId),
          count: 4,
          latestAppliedAt: new Date('2026-02-14T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(jobId2),
          count: 1,
          latestAppliedAt: 'bad-date',
        },
      ]);
    const model = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = createRepository(model);

    expect(
      await repository.getDailyCountsByStudentWithFilters({
        studentId: '',
        fromDate: new Date('2026-02-01T00:00:00.000Z'),
        toDate: new Date('2026-02-28T00:00:00.000Z'),
      }),
    ).toEqual([]);
    const daily = await repository.getDailyCountsByStudentWithFilters({
      studentId,
      fromDate: new Date('2026-02-01T00:00:00.000Z'),
      toDate: new Date('2026-02-28T00:00:00.000Z'),
      statuses: [ApplicationStatus.APPLIED],
    });
    expect(daily).toEqual([{ date: '2026-02-14', count: 2 }]);

    expect(
      await repository.getJobCountsByStudentWithFilters({ studentId: '' }),
    ).toEqual([]);
    const jobs = await repository.getJobCountsByStudentWithFilters({
      studentId,
      statuses: [ApplicationStatus.APPLIED],
      limit: 999,
    });
    const jobsFallback = await repository.getJobCountsByStudentWithFilters({
      studentId,
      limit: 0,
    });

    expect(jobs[0]).toEqual({
      jobId,
      count: 4,
      latestAppliedAt: '2026-02-14T00:00:00.000Z',
    });
    expect(jobsFallback[0]).toEqual({
      jobId: jobId2,
      count: 1,
      latestAppliedAt: expect.any(String),
    });
  });

  it('should update by id and find job ids by statuses', async () => {
    const updateChain = buildChain({ id: 'a1' });
    const findChain = buildChain([{ jobId: new Types.ObjectId(jobId) }]);
    const model = {
      findByIdAndUpdate: jest.fn().mockReturnValue(updateChain),
      find: jest.fn().mockReturnValue(findChain),
    } as any;
    const repository = createRepository(model);

    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(id, { status: ApplicationStatus.ACCEPTED } as never)).toEqual({
      id: 'a1',
    });

    expect(
      await repository.findJobIdsByStudentAndStatuses({
        studentId: '',
        statuses: [ApplicationStatus.APPLIED],
      }),
    ).toEqual([]);
    expect(
      await repository.findJobIdsByStudentAndStatuses({
        studentId,
        statuses: [],
      }),
    ).toEqual([]);
    expect(
      await repository.findJobIdsByStudentAndStatuses({
        studentId,
        statuses: [ApplicationStatus.APPLIED],
      }),
    ).toEqual([jobId]);
  });

  it('should count by job/student ids and list by job id', async () => {
    const countExec = jest.fn().mockResolvedValue(5);
    const findChain = buildChain([{ id: 'a1' }]);
    const model = {
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
      find: jest.fn().mockReturnValue(findChain),
    } as any;
    const repository = createRepository(model);

    expect(await repository.countByJobId('')).toBe(0);
    expect(await repository.countByJobId(jobId)).toBe(5);

    expect(await repository.countByStudentIds([])).toBe(0);
    expect(await repository.countByStudentIds([studentId])).toBe(5);

    expect(await repository.findAllByJobId({ jobId: '', page: 1, size: 10 })).toEqual({
      applications: [],
      total: 0,
    });
    const list = await repository.findAllByJobId({
      jobId,
      page: 2,
      size: 5,
      status: ApplicationStatus.REVIEWING,
    });
    expect(model.find).toHaveBeenLastCalledWith({
      $or: [{ jobId: expect.any(Types.ObjectId) }, { jobId }],
      status: ApplicationStatus.REVIEWING,
    });
    expect(findChain.skip).toHaveBeenCalledWith(5);
    expect(findChain.limit).toHaveBeenCalledWith(5);
    expect(list).toEqual({ applications: [{ id: 'a1' }], total: 5 });
  });

  it('should find distinct student ids and count by student + resume id', async () => {
    const aggregateExec = jest.fn().mockResolvedValue([
      { _id: new Types.ObjectId(studentId) },
    ]);
    const countExec = jest.fn().mockResolvedValue(2);
    const model = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findDistinctStudentIdsByJobIds([])).toEqual([]);
    expect(await repository.findDistinctStudentIdsByJobIds([jobId])).toEqual([
      studentId,
    ]);

    expect(
      await repository.countByStudentAndResumeId({ studentId: '', resumeId }),
    ).toBe(0);
    expect(
      await repository.countByStudentAndResumeId({ studentId, resumeId: '' }),
    ).toBe(0);
    expect(
      await repository.countByStudentAndResumeId({ studentId, resumeId }),
    ).toBe(2);
  });

  it('should resolve status counts and leaderboard stats by student ids', async () => {
    const aggregateExec = jest
      .fn()
      .mockResolvedValueOnce([
        { _id: ApplicationStatus.APPLIED, count: 7 },
        { _id: ApplicationStatus.REJECTED, count: 2 },
      ])
      .mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(studentId),
          applications: 9,
          interviewScheduled: 3,
          accepted: 2,
          shortlisted: 1,
          rejected: 4,
        },
      ]);
    const model = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.getStatusCountsByStudentIds([])).toEqual({
      applied: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewScheduled: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    });
    expect(await repository.getStatusCountsByStudentIds([studentId])).toEqual({
      applied: 7,
      reviewing: 0,
      shortlisted: 0,
      interviewScheduled: 0,
      accepted: 0,
      rejected: 2,
      withdrawn: 0,
    });

    const emptyMap = await repository.getLeaderboardStatsByStudentIds([]);
    const statsMap = await repository.getLeaderboardStatsByStudentIds([studentId]);
    expect(emptyMap.size).toBe(0);
    expect(statsMap.get(studentId)).toEqual({
      applications: 9,
      interviewScheduled: 3,
      accepted: 2,
      shortlisted: 1,
      rejected: 4,
    });
  });

  it('should build leaderboard rows with and without candidate filter', async () => {
    const aggregateExec = jest
      .fn()
      .mockResolvedValueOnce([
        {
          rows: [
            {
              _id: new Types.ObjectId(studentId),
              applications: 3,
              interviewScheduled: 1,
              accepted: 1,
              score: 70,
            },
          ],
          meta: [{ total: 1 }],
        },
      ])
      .mockResolvedValueOnce([
        {
          rows: [],
          meta: [],
        },
      ]);
    const model = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = createRepository(model);

    const empty = await repository.getLeaderboardRows({
      page: 1,
      size: 10,
      studentIds: [],
    });
    expect(empty).toEqual({ rows: [], total: 0 });

    const withIds = await repository.getLeaderboardRows({
      page: 1,
      size: 10,
      studentIds: [studentId],
    });
    const withoutIds = await repository.getLeaderboardRows({
      page: 2,
      size: 5,
    });

    expect(withIds).toEqual({
      rows: [
        {
          studentId,
          applications: 3,
          interviewScheduled: 1,
          accepted: 1,
          score: 70,
        },
      ],
      total: 1,
    });
    expect(withoutIds).toEqual({ rows: [], total: 0 });
  });
});

