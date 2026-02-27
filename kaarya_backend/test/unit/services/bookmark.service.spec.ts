import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { ACBookmarkRepository } from 'src/repositories/bookmark.repository';
import { BookmarkService } from 'src/services/bookmark.service';
import { GamificationService } from 'src/services/gamification.service';
import { InterviewService } from 'src/services/interview.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { BookmarkEntityType, BookmarkListType } from 'src/types/bookmark-entity-type.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('BookmarkService', () => {
  let service: BookmarkService;
  let bookmarkRepository: jest.Mocked<ACBookmarkRepository>;
  let jobPostingService: jest.Mocked<JobPostingService>;
  let interviewService: jest.Mocked<InterviewService>;
  let gamificationService: jest.Mocked<GamificationService>;

  const userId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const interviewId = new Types.ObjectId().toString();

  beforeEach(() => {
    bookmarkRepository = {
      upsertByUserAndEntity: jest.fn(),
      deleteByUserAndEntity: jest.fn(),
      findAllByUser: jest.fn(),
      findSavedEntityIds: jest.fn(),
    } as unknown as jest.Mocked<ACBookmarkRepository>;

    jobPostingService = {
      getJobPostingById: jest.fn(),
    } as unknown as jest.Mocked<JobPostingService>;

    interviewService = {
      getInterviewById: jest.fn(),
    } as unknown as jest.Mocked<InterviewService>;

    gamificationService = {
      awardJobSaved: jest.fn(),
      awardInterviewSaved: jest.fn(),
    } as unknown as jest.Mocked<GamificationService>;

    service = new BookmarkService(
      bookmarkRepository,
      jobPostingService,
      interviewService,
      gamificationService,
    );
  });

  it('should list, search and sort bookmarks', async () => {
    bookmarkRepository.findAllByUser.mockResolvedValue([
      {
        entityType: BookmarkEntityType.JOB,
        entityId: new Types.ObjectId(jobId),
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
      },
      {
        entityType: BookmarkEntityType.INTERVIEW,
        entityId: new Types.ObjectId(interviewId),
        createdAt: new Date('2026-02-12T00:00:00.000Z'),
      },
    ] as never);
    jobPostingService.getJobPostingById.mockResolvedValue({
      id: jobId,
      title: 'Backend Engineer',
      location: 'Remote',
      employmentType: 'Full-Time',
      workMode: 'remote',
      company: { name: 'Acme' },
    } as never);
    interviewService.getInterviewById.mockResolvedValue({
      id: interviewId,
      title: 'System Design',
      role: 'Backend Engineer',
      interviewType: 'technical',
      source: 'company',
      company: { name: 'Acme' },
    } as never);

    const result = await service.listMyBookmarks(
      { id: userId, role: UserRole.STUDENT } as never,
      {
        type: BookmarkListType.ALL,
        sortBy: 'saved_at_desc',
        search: 'acme',
      } as never,
    );

    expect(result.counts.total).toBe(2);
    expect(result.jobs).toHaveLength(1);
    expect(result.interviews).toHaveLength(1);
    expect(result.lastSavedAt).toBe('2026-02-12T00:00:00.000Z');
  });

  it('should reject non-candidate users and invalid ids', async () => {
    await expect(
      service.listMyBookmarks(
        { id: userId, role: UserRole.RECRUITER } as never,
        { type: BookmarkListType.ALL } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expectBadRequestError(() =>
      service.saveJob({ id: userId, role: UserRole.STUDENT } as never, 'bad-id'),
    );
    await expectBadRequestError(() =>
      service.removeSavedJob(
        { id: userId, role: UserRole.STUDENT } as never,
        'bad-id',
      ),
    );
    await expectBadRequestError(() =>
      service.saveInterview(
        { id: userId, role: UserRole.STUDENT } as never,
        'bad-id',
      ),
    );
    await expectBadRequestError(() =>
      service.removeSavedInterview(
        { id: userId, role: UserRole.STUDENT } as never,
        'bad-id',
      ),
    );
  });

  it('should save and remove job/interview bookmarks', async () => {
    bookmarkRepository.upsertByUserAndEntity.mockResolvedValue({
      createdAt: new Date('2026-02-12T00:00:00.000Z'),
    } as never);
    bookmarkRepository.deleteByUserAndEntity
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ id: 'deleted' } as never);

    jobPostingService.getJobPostingById.mockResolvedValue({ id: jobId } as never);
    interviewService.getInterviewById.mockResolvedValue({
      id: interviewId,
    } as never);

    const savedJob = await service.saveJob(
      { id: userId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(savedJob.entityType).toBe(BookmarkEntityType.JOB);
    expect(gamificationService.awardJobSaved).toHaveBeenCalled();

    const removeJob = await service.removeSavedJob(
      { id: userId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(removeJob.removed).toBe(false);
    const removeJob2 = await service.removeSavedJob(
      { id: userId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(removeJob2.removed).toBe(true);

    const savedInterview = await service.saveInterview(
      { id: userId, role: UserRole.STUDENT } as never,
      interviewId,
    );
    expect(savedInterview.entityType).toBe(BookmarkEntityType.INTERVIEW);
    expect(gamificationService.awardInterviewSaved).toHaveBeenCalled();

    bookmarkRepository.deleteByUserAndEntity.mockResolvedValueOnce(null as never);
    const removeInterview = await service.removeSavedInterview(
      { id: userId, role: UserRole.STUDENT } as never,
      interviewId,
    );
    expect(removeInterview.removed).toBe(false);
  });

  it('should cover private helper branches', async () => {
    const internal = service as any;

    expect(internal.resolveEntityTypeFilter(BookmarkListType.JOBS)).toBe(
      BookmarkEntityType.JOB,
    );
    expect(internal.resolveEntityTypeFilter(BookmarkListType.INTERVIEWS)).toBe(
      BookmarkEntityType.INTERVIEW,
    );
    expect(internal.resolveEntityTypeFilter(BookmarkListType.ALL)).toBeUndefined();

    const jobSearchMatch = internal.matchesSearchQuery(
      {
        entityType: BookmarkEntityType.JOB,
        savedAt: new Date().toISOString(),
        job: { title: 'Backend Engineer', company: { name: 'Acme' } },
      },
      'acme',
    );
    expect(jobSearchMatch).toBe(true);
    const interviewSearchMatch = internal.matchesSearchQuery(
      {
        entityType: BookmarkEntityType.INTERVIEW,
        savedAt: new Date().toISOString(),
        interview: {
          title: 'System Design',
          company: { name: 'Acme' },
        },
      },
      'system',
    );
    expect(interviewSearchMatch).toBe(true);

    jobPostingService.getJobPostingById.mockRejectedValueOnce(new Error('boom'));
    interviewService.getInterviewById.mockRejectedValueOnce(new Error('boom'));
    await expect(
      internal.hydrateBookmark({
        currentUser: { id: userId, role: UserRole.STUDENT },
        entityType: BookmarkEntityType.JOB,
        entityId: jobId,
        savedAt: new Date().toISOString(),
      }),
    ).resolves.toBeNull();
    await expect(
      internal.hydrateBookmark({
        currentUser: { id: userId, role: UserRole.STUDENT },
        entityType: BookmarkEntityType.INTERVIEW,
        entityId: interviewId,
        savedAt: new Date().toISOString(),
      }),
    ).resolves.toBeNull();
  });
});

async function expectBadRequestError(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    return;
  }

  throw new Error('Expected ApiError BAD_REQUEST');
}
