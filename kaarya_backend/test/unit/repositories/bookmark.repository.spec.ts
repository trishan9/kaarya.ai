import { Types } from 'mongoose';
import { BookmarkRepository } from 'src/repositories/bookmark.repository';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';

describe('BookmarkRepository', () => {
  const userId = new Types.ObjectId().toString();
  const entityId = new Types.ObjectId().toString();

  it('should upsert bookmark and throw when upsert fails', async () => {
    const exec = jest.fn().mockResolvedValue({ id: 'bookmark-1' });
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec }),
    } as any;
    const repository = new BookmarkRepository(model);

    const result = await repository.upsertByUserAndEntity({
      userId,
      entityType: BookmarkEntityType.JOB,
      entityId,
    });

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        userId: expect.any(Types.ObjectId),
        entityType: BookmarkEntityType.JOB,
        entityId: expect.any(Types.ObjectId),
      },
      {
        userId: expect.any(Types.ObjectId),
        entityType: BookmarkEntityType.JOB,
        entityId: expect.any(Types.ObjectId),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(result).toEqual({ id: 'bookmark-1' });

    model.findOneAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(
      repository.upsertByUserAndEntity({
        userId,
        entityType: BookmarkEntityType.JOB,
        entityId,
      }),
    ).rejects.toThrow('Bookmark upsert failed.');
  });

  it('should delete and list bookmarks', async () => {
    const deleteExec = jest.fn().mockResolvedValue({ id: 'deleted' });
    const findExec = jest.fn().mockResolvedValue([{ id: 'bookmark-1' }]);
    const sort = jest.fn().mockReturnThis();
    const model = {
      findOneAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
      find: jest.fn().mockReturnValue({ sort, exec: findExec }),
    } as any;
    const repository = new BookmarkRepository(model);

    const deleted = await repository.deleteByUserAndEntity({
      userId,
      entityType: BookmarkEntityType.JOB,
      entityId,
    });
    const listAll = await repository.findAllByUser({ userId });
    const listByType = await repository.findAllByUser({
      userId,
      entityType: BookmarkEntityType.INTERVIEW,
    });

    expect(deleted).toEqual({ id: 'deleted' });
    expect(model.find).toHaveBeenNthCalledWith(1, {
      userId: expect.any(Types.ObjectId),
    });
    expect(model.find).toHaveBeenNthCalledWith(2, {
      userId: expect.any(Types.ObjectId),
      entityType: BookmarkEntityType.INTERVIEW,
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(listAll).toEqual([{ id: 'bookmark-1' }]);
    expect(listByType).toEqual([{ id: 'bookmark-1' }]);
  });

  it('should return saved entity ids with mixed lean row formats', async () => {
    const leanExec = jest.fn().mockResolvedValue([
      { entityId: new Types.ObjectId(entityId) },
      { entityId: entityId },
      { entityId: 10 },
    ]);
    const lean = jest.fn().mockReturnValue({ exec: leanExec });
    const select = jest.fn().mockReturnValue({ lean });
    const model = {
      find: jest.fn().mockReturnValue({ select }),
    } as any;
    const repository = new BookmarkRepository(model);

    const idsWithFilter = await repository.findSavedEntityIds({
      userId,
      entityType: BookmarkEntityType.JOB,
      entityIds: [entityId],
    });
    const idsWithoutFilter = await repository.findSavedEntityIds({
      userId,
      entityType: BookmarkEntityType.INTERVIEW,
      entityIds: [],
    });

    expect(model.find).toHaveBeenNthCalledWith(1, {
      userId: expect.any(Types.ObjectId),
      entityType: BookmarkEntityType.JOB,
      entityId: { $in: [expect.any(Types.ObjectId)] },
    });
    expect(model.find).toHaveBeenNthCalledWith(2, {
      userId: expect.any(Types.ObjectId),
      entityType: BookmarkEntityType.INTERVIEW,
    });
    expect(idsWithFilter.has(entityId)).toBe(true);
    expect(idsWithoutFilter.has(entityId)).toBe(true);
    expect(idsWithFilter.size).toBe(1);
  });
});

