import { Types } from 'mongoose';
import { AIEvaluationRepository } from 'src/repositories/ai-evaluation.repository';

describe('AIEvaluationRepository', () => {
  const createRepository = (model: any) => new AIEvaluationRepository(model);
  const sessionId = new Types.ObjectId().toString();
  const interviewId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  it('should create evaluation docs', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'e1' });
    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    const repository = createRepository(model);

    const created = await repository.create({ totalScore: 80 } as never);
    expect(created).toEqual({ id: 'e1' });
  });

  it('should upsert and find by session id with guard clauses', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: 'e1' });
    const findExec = jest.fn().mockResolvedValue({ id: 'e1' });
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      findOne: jest.fn().mockReturnValue({ exec: findExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.upsertBySessionId('', {})).toBeNull();
    expect(await repository.findBySessionId('')).toBeNull();
    expect(await repository.upsertBySessionId(sessionId, {} as never)).toEqual({
      id: 'e1',
    });
    expect(await repository.findBySessionId(sessionId)).toEqual({ id: 'e1' });
  });

  it('should find latest by interview + user and list all by interview + user', async () => {
    const latestExec = jest.fn().mockResolvedValue({ id: 'e1' });
    const sort = jest.fn().mockReturnThis();
    const findExec = jest.fn().mockResolvedValue([{ id: 'e1' }]);
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(4);

    const model = {
      findOne: jest.fn().mockReturnValue({ sort, exec: latestExec }),
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec: findExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    expect(
      await repository.findLatestByInterviewAndUser({ interviewId: '', userId }),
    ).toBeNull();
    expect(
      await repository.findLatestByInterviewAndUser({ interviewId, userId: '' }),
    ).toBeNull();

    const latest = await repository.findLatestByInterviewAndUser({
      interviewId,
      userId,
    });
    const list = await repository.findAllByInterviewAndUser({
      interviewId,
      userId,
      page: 2,
      size: 5,
    });

    expect(latest).toEqual({ id: 'e1' });
    expect(skip).toHaveBeenCalledWith(5);
    expect(limit).toHaveBeenCalledWith(5);
    expect(list).toEqual({ evaluations: [{ id: 'e1' }], total: 4 });
  });

  it('should resolve interview score summary defaults and aggregate output', async () => {
    const aggregate = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { averageScore: 81.6, highestScore: 95, evaluationsCount: 3 },
      ])
      .mockResolvedValueOnce([
        { averageScore: 'bad', highestScore: null, evaluationsCount: undefined },
      ]);
    const model = {
      aggregate,
    } as any;
    const repository = createRepository(model);

    const emptyInput = await repository.getInterviewScoreSummary('');
    const emptyRows = await repository.getInterviewScoreSummary(interviewId);
    const withData = await repository.getInterviewScoreSummary(interviewId);
    const withBadData = await repository.getInterviewScoreSummary(interviewId);

    expect(emptyInput).toEqual({
      averageScore: 0,
      highestScore: 0,
      evaluationsCount: 0,
    });
    expect(emptyRows).toEqual({
      averageScore: 0,
      highestScore: 0,
      evaluationsCount: 0,
    });
    expect(withData).toEqual({
      averageScore: 82,
      highestScore: 95,
      evaluationsCount: 3,
    });
    expect(withBadData).toEqual({
      averageScore: 0,
      highestScore: 0,
      evaluationsCount: 0,
    });
  });

  it('should map latest evaluation by interview ids', async () => {
    const secondInterviewId = new Types.ObjectId().toString();
    const rows = [
      { id: 'e1', interviewId: new Types.ObjectId(interviewId) },
      { id: 'e2', interviewId: new Types.ObjectId(interviewId) },
      { id: 'e3', interviewId: new Types.ObjectId(secondInterviewId) },
    ];
    const exec = jest.fn().mockResolvedValue(rows);
    const sort = jest.fn().mockReturnValue({ exec });
    const model = {
      find: jest.fn().mockReturnValue({ sort }),
    } as any;
    const repository = createRepository(model);

    const empty = await repository.findLatestByUserAndInterviewIds({
      userId: '',
      interviewIds: [],
    });
    const mapped = await repository.findLatestByUserAndInterviewIds({
      userId,
      interviewIds: [interviewId, secondInterviewId],
    });

    expect(empty.size).toBe(0);
    expect(mapped.size).toBe(2);
    expect(mapped.get(interviewId)).toEqual(rows[0]);
    expect(mapped.get(secondInterviewId)).toEqual(rows[2]);
  });
});
