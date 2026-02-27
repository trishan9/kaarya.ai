import { Types } from 'mongoose';
import { GamificationProfileRepository } from 'src/repositories/gamification-profile.repository';

describe('GamificationProfileRepository', () => {
  const userId = new Types.ObjectId().toString();

  it('should find by user id and by user ids map', async () => {
    const findOneExec = jest.fn().mockResolvedValue({ id: 'gp-1' });
    const findExec = jest.fn().mockResolvedValue([
      { userId: new Types.ObjectId(userId), xp: 10 },
    ]);
    const model = {
      findOne: jest.fn().mockReturnValue({ exec: findOneExec }),
      find: jest.fn().mockReturnValue({ exec: findExec }),
    } as any;
    const repository = new GamificationProfileRepository(model);

    expect(await repository.findByUserId('')).toBeNull();
    expect(await repository.findByUserId(userId)).toEqual({ id: 'gp-1' });

    const none = await repository.findByUserIds([]);
    expect(none.size).toBe(0);
    const filteredNone = await repository.findByUserIds(['', '']);
    expect(filteredNone.size).toBe(0);

    const map = await repository.findByUserIds([userId]);
    expect(map.get(userId)).toEqual(
      expect.objectContaining({
        userId: expect.any(Types.ObjectId),
        xp: 10,
      }),
    );
  });

  it('should apply deltas with safe guards and update timestamps', async () => {
    const upsertExec = jest
      .fn()
      .mockResolvedValueOnce({ userId: new Types.ObjectId(userId), xp: 4, score: 3 })
      .mockResolvedValueOnce({ userId: new Types.ObjectId(userId), xp: 4, score: 3 })
      .mockResolvedValueOnce(null);
    const updateExec = jest.fn().mockResolvedValue({
      userId: new Types.ObjectId(userId),
      xp: 7,
      score: 7,
      level: 1,
    });
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce({ exec: upsertExec })
        .mockReturnValueOnce({ exec: upsertExec })
        .mockReturnValueOnce({ exec: updateExec })
        .mockReturnValueOnce({ exec: upsertExec }),
    } as any;
    const repository = new GamificationProfileRepository(model);

    expect(await repository.applyDelta({ userId: '' })).toBeNull();

    const noDelta = await repository.applyDelta({
      userId,
      xpDelta: Number.NaN,
      scoreDelta: 0,
    });
    expect(noDelta).toEqual(
      expect.objectContaining({
        xp: 4,
        score: 3,
      }),
    );

    const withDelta = await repository.applyDelta({
      userId,
      xpDelta: 3.9,
      scoreDelta: 4.2,
    });
    expect(withDelta).toEqual(
      expect.objectContaining({
        xp: 7,
        score: 7,
      }),
    );
    const secondUpdateArgs = model.findOneAndUpdate.mock.calls[2][1];
    expect(secondUpdateArgs.$set).toEqual(
      expect.objectContaining({
        xp: 7,
        score: 7,
        xpUpdatedAt: expect.any(Date),
        scoreUpdatedAt: expect.any(Date),
      }),
    );

    const nullProfile = await repository.applyDelta({ userId, xpDelta: 1 });
    expect(nullProfile).toBeNull();
  });

  it('should clamp negative xp and omit score timestamp when score delta is zero', async () => {
    const upsertExec = jest.fn().mockResolvedValue({
      userId: new Types.ObjectId(userId),
      xp: 2,
      score: 9,
    });
    const updateExec = jest.fn().mockResolvedValue({
      userId: new Types.ObjectId(userId),
      xp: 0,
      score: 9,
      level: 1,
    });
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce({ exec: upsertExec })
        .mockReturnValueOnce({ exec: updateExec }),
    } as any;
    const repository = new GamificationProfileRepository(model);

    await repository.applyDelta({ userId, xpDelta: -10, scoreDelta: 0 });
    const updatePayload = model.findOneAndUpdate.mock.calls[1][1].$set;
    expect(updatePayload.xp).toBe(0);
    expect(updatePayload.score).toBe(9);
    expect(updatePayload).toEqual(
      expect.objectContaining({
        xpUpdatedAt: expect.any(Date),
      }),
    );
    expect(updatePayload.scoreUpdatedAt).toBeUndefined();
  });
});
