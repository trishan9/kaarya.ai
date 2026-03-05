import { Types } from 'mongoose';
import { InterviewSessionRepository } from 'src/repositories/interview-session.repository';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';

describe('InterviewSessionRepository', () => {
  const createRepository = (model: any) => new InterviewSessionRepository(model);
  const id = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();
  const interviewId = new Types.ObjectId().toString();

  it('should create, find, and update sessions', async () => {
    const save = jest.fn().mockResolvedValue({ id: 's1' });
    const byIdExec = jest.fn().mockResolvedValue({ id: 's1' });
    const updateExec = jest.fn().mockResolvedValue({ id: 's1' });

    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    model.findById = jest.fn().mockReturnValue({ exec: byIdExec });
    model.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: updateExec });

    const repository = createRepository(model);
    expect(await repository.create({} as never)).toEqual({ id: 's1' });
    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(id)).toEqual({ id: 's1' });
    expect(await repository.updateById('', {})).toBeNull();
    expect(await repository.updateById(id, {} as never)).toEqual({ id: 's1' });
  });

  it('should list by interview id and by user', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: 's1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(3);

    const model = {
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec: findExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;

    const repository = createRepository(model);

    const byInterview = await repository.findAllByInterviewId({
      interviewId,
      page: 1,
      size: 10,
    });
    const byUser = await repository.findAllByUser({
      userId,
      interviewId,
      page: 2,
      size: 5,
      status: InterviewSessionStatus.COMPLETED,
      sort: { updatedAt: -1 },
    });
    const byUserDefault = await repository.findAllByUser({
      userId,
      page: 1,
      size: 10,
    });

    expect(model.find).toHaveBeenNthCalledWith(1, {
      interviewId: expect.any(Types.ObjectId),
    });
    expect(model.find).toHaveBeenNthCalledWith(2, {
      userId: expect.any(Types.ObjectId),
      interviewId: expect.any(Types.ObjectId),
      status: InterviewSessionStatus.COMPLETED,
    });
    expect(model.find).toHaveBeenNthCalledWith(3, {
      userId: expect.any(Types.ObjectId),
    });
    expect(sort).toHaveBeenNthCalledWith(1, { createdAt: -1, _id: -1 });
    expect(sort).toHaveBeenNthCalledWith(2, { updatedAt: -1 });
    expect(skip).toHaveBeenNthCalledWith(2, 5);
    expect(byInterview).toEqual({ sessions: [{ id: 's1' }], total: 3 });
    expect(byUser).toEqual({ sessions: [{ id: 's1' }], total: 3 });
    expect(byUserDefault).toEqual({ sessions: [{ id: 's1' }], total: 3 });
  });

  it('should find interview ids by user with dedupe', async () => {
    const rows = [
      { interviewId: new Types.ObjectId(interviewId) },
      { interviewId },
      { interviewId: null },
    ];
    const exec = jest.fn().mockResolvedValue(rows);
    const lean = jest.fn().mockReturnValue({ exec });
    const select = jest.fn().mockReturnValue({ lean });
    const model = {
      find: jest.fn().mockReturnValue({ select }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findInterviewIdsByUser('')).toEqual([]);
    const ids = await repository.findInterviewIdsByUser(userId);
    expect(ids).toEqual([interviewId]);
  });

  it('should count distinct users by interview id', async () => {
    const model = {
      distinct: jest.fn().mockResolvedValue(['u1', 'u2']),
    } as any;
    const repository = createRepository(model);

    expect(await repository.countDistinctUsersByInterview('')).toBe(0);
    expect(await repository.countDistinctUsersByInterview(interviewId)).toBe(2);
  });

  it('should map latest session by interview ids', async () => {
    const s1 = { id: 's1', interviewId: new Types.ObjectId(interviewId) };
    const s2 = { id: 's2', interviewId: new Types.ObjectId(interviewId) };
    const otherInterviewId = new Types.ObjectId().toString();
    const s3 = { id: 's3', interviewId: new Types.ObjectId(otherInterviewId) };
    const exec = jest.fn().mockResolvedValue([s1, s2, s3]);
    const sort = jest.fn().mockReturnValue({ exec });
    const model = {
      find: jest.fn().mockReturnValue({ sort }),
    } as any;
    const repository = createRepository(model);

    const empty = await repository.findLatestByUserAndInterviewIds({
      userId: '',
      interviewIds: [],
    });
    const map = await repository.findLatestByUserAndInterviewIds({
      userId,
      interviewIds: [interviewId, otherInterviewId],
    });

    expect(empty.size).toBe(0);
    expect(map.size).toBe(2);
    expect(map.get(interviewId)).toEqual(s1);
    expect(map.get(otherInterviewId)).toEqual(s3);
  });
});

