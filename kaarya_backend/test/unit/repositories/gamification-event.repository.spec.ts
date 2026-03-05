import { Types } from 'mongoose';
import { GamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { GamificationEventType } from 'src/types/gamification-event-type.enum';

describe('GamificationEventRepository', () => {
  const userId = new Types.ObjectId().toString();
  const eventKey = 'evt-job-view-1';

  it('should create unique events and handle duplicate-key path', async () => {
    const duplicateError = { code: 11000 };
    const model = {
      create: jest
        .fn()
        .mockResolvedValueOnce({ id: 'ev-1' })
        .mockRejectedValueOnce(duplicateError)
        .mockRejectedValueOnce(new Error('db down')),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: 'existing' }) }),
    } as any;
    const repository = new GamificationEventRepository(model);

    expect(
      await repository.createUnique({
        userId: '',
        eventType: GamificationEventType.JOB_VIEWED,
        eventKey,
        xpAwarded: 1,
      }),
    ).toEqual({ created: false, event: null });

    const created = await repository.createUnique({
      userId,
      eventType: GamificationEventType.JOB_VIEWED,
      eventKey,
      xpAwarded: 2,
      scoreDelta: 2.9,
      metadata: { score: 10 },
    });
    expect(created).toEqual({
      created: true,
      event: { id: 'ev-1' },
    });
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(Types.ObjectId),
        scoreDelta: 2,
      }),
    );

    const duplicate = await repository.createUnique({
      userId,
      eventType: GamificationEventType.JOB_VIEWED,
      eventKey,
      xpAwarded: 2,
    });
    expect(duplicate).toEqual({
      created: false,
      event: { id: 'existing' },
    });

    await expect(
      repository.createUnique({
        userId,
        eventType: GamificationEventType.JOB_VIEWED,
        eventKey,
        xpAwarded: 2,
      }),
    ).rejects.toThrow('db down');
  });

  it('should aggregate activity stats by user ids', async () => {
    const aggregateExec = jest.fn().mockResolvedValue([
      {
        _id: new Types.ObjectId(userId),
        profileUpdates: 1,
        jobViews: 2,
        jobsSaved: 3,
        interviewsSaved: 4,
        applicationsSubmitted: 5,
        interviewsTaken: 6,
        interviewsCompleted: 7,
        resumesCreated: 8,
        resumesSaved: 9,
        atsScans: 10,
        bestInterviewScore: 80,
        averageInterviewScore: 60,
        interviewScoreEntries: 2,
        bestAtsScore: 90,
        averageAtsScore: 70,
        atsScoreEntries: 3,
      },
      {
        _id: new Types.ObjectId(),
      },
    ]);
    const model = {
      aggregate: jest.fn().mockReturnValue({ exec: aggregateExec }),
    } as any;
    const repository = new GamificationEventRepository(model);

    const empty = await repository.getActivityStatsByUserIds({ userIds: [] });
    expect(empty.size).toBe(0);

    const map = await repository.getActivityStatsByUserIds({ userIds: [userId] });
    expect(map.get(userId)).toEqual({
      profileUpdates: 1,
      jobViews: 2,
      jobsSaved: 3,
      interviewsSaved: 4,
      applicationsSubmitted: 5,
      interviewsTaken: 6,
      interviewsCompleted: 7,
      resumesCreated: 8,
      resumesSaved: 9,
      atsScans: 10,
      bestInterviewScore: 80,
      averageInterviewScore: 60,
      interviewScoreEntries: 2,
      bestAtsScore: 90,
      averageAtsScore: 70,
      atsScoreEntries: 3,
    });
    const secondValue = [...map.values()][1];
    expect(secondValue).toEqual({
      profileUpdates: 0,
      jobViews: 0,
      jobsSaved: 0,
      interviewsSaved: 0,
      applicationsSubmitted: 0,
      interviewsTaken: 0,
      interviewsCompleted: 0,
      resumesCreated: 0,
      resumesSaved: 0,
      atsScans: 0,
      bestInterviewScore: 0,
      averageInterviewScore: 0,
      interviewScoreEntries: 0,
      bestAtsScore: 0,
      averageAtsScore: 0,
      atsScoreEntries: 0,
    });
  });
});
