import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { BOOKMARK_MESSAGES } from 'src/constants/messages.constants';
import { BookmarkController } from 'src/controllers/bookmark.controller';
import { BookmarkService } from 'src/services/bookmark.service';
import { BookmarkListType } from 'src/types/bookmark-entity-type.enum';

describe('BookmarkController', () => {
  const userId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const interviewId = new Types.ObjectId().toString();

  let controller: BookmarkController;
  let bookmarkService: jest.Mocked<BookmarkService>;

  beforeEach(() => {
    bookmarkService = {
      listMyBookmarks: jest.fn(),
      saveJob: jest.fn(),
      removeSavedJob: jest.fn(),
      saveInterview: jest.fn(),
      removeSavedInterview: jest.fn(),
    } as unknown as jest.Mocked<BookmarkService>;

    controller = new BookmarkController(bookmarkService);
  });

  it('should list bookmarks with parsed query', async () => {
    bookmarkService.listMyBookmarks.mockResolvedValue({
      jobs: [],
      interviews: [],
      counts: { jobs: 0, interviews: 0, total: 0 },
      lastSavedAt: null,
    } as never);

    const result = await controller.listMyBookmarks(
      { user: { id: userId, role: 'student' } as never },
      {
        type: BookmarkListType.ALL,
        search: '  backend ',
        sortBy: 'saved_at_desc',
      },
    );

    expect(bookmarkService.listMyBookmarks).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
      expect.objectContaining({ search: 'backend' }),
    );
    expect(result).toEqual({
      success: true,
      message: BOOKMARK_MESSAGES.FETCH_SUCCESS,
      data: expect.any(Object),
    });
  });

  it('should reject invalid bookmark list query', async () => {
    await expect(
      controller.listMyBookmarks(
        { user: { id: userId } as never },
        { sortBy: 'invalid' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should save and remove jobs', async () => {
    bookmarkService.saveJob.mockResolvedValue({
      entityType: 'job',
      entityId: jobId,
      savedAt: '2026-02-01T00:00:00.000Z',
    } as never);
    bookmarkService.removeSavedJob.mockResolvedValue({
      entityType: 'job',
      entityId: jobId,
      removed: true,
    } as never);

    const saved = await controller.saveJob(
      { user: { id: userId } as never },
      jobId,
    );
    const removed = await controller.removeSavedJob(
      { user: { id: userId } as never },
      jobId,
    );

    expect(bookmarkService.saveJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
      jobId,
    );
    expect(saved.message).toBe(BOOKMARK_MESSAGES.SAVE_JOB_SUCCESS);
    expect(removed.message).toBe(BOOKMARK_MESSAGES.UNSAVE_JOB_SUCCESS);
  });

  it('should reject invalid job ids', async () => {
    await expect(
      controller.saveJob({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.removeSavedJob({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should save and remove interviews', async () => {
    bookmarkService.saveInterview.mockResolvedValue({
      entityType: 'interview',
      entityId: interviewId,
      savedAt: '2026-02-01T00:00:00.000Z',
    } as never);
    bookmarkService.removeSavedInterview.mockResolvedValue({
      entityType: 'interview',
      entityId: interviewId,
      removed: true,
    } as never);

    const saved = await controller.saveInterview(
      { user: { id: userId } as never },
      interviewId,
    );
    const removed = await controller.removeSavedInterview(
      { user: { id: userId } as never },
      interviewId,
    );

    expect(saved.message).toBe(BOOKMARK_MESSAGES.SAVE_INTERVIEW_SUCCESS);
    expect(removed.message).toBe(BOOKMARK_MESSAGES.UNSAVE_INTERVIEW_SUCCESS);
  });

  it('should reject invalid interview ids', async () => {
    try {
      await controller.saveInterview(
        { user: { id: userId } as never },
        'bad-id',
      );
      throw new Error('Expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});

