import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import { BOOKMARK_MESSAGES, INTERVIEW_MESSAGES, JOB_MESSAGES } from 'src/constants/messages.constants';
import { TBookmarkListQueryDTO } from 'src/dtos/bookmarks/bookmark.dto';
import { ACBookmarkRepository } from 'src/repositories/bookmark.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import {
  BookmarkEntityType,
  BookmarkListType,
} from 'src/types/bookmark-entity-type.enum';
import { UserRole } from 'src/types/user-role.enum';
import { GamificationService } from './gamification.service';
import { InterviewService } from './interview.service';
import { JobPostingService } from './job-posting.service';

type TBookmarkListItem =
  | {
      entityType: BookmarkEntityType.JOB;
      savedAt: string;
      job: Record<string, unknown>;
    }
  | {
      entityType: BookmarkEntityType.INTERVIEW;
      savedAt: string;
      interview: Record<string, unknown>;
    };

@Injectable()
export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: ACBookmarkRepository,
    private readonly jobPostingService: JobPostingService,
    private readonly interviewService: InterviewService,
    private readonly gamificationService: GamificationService,
  ) {}

  async listMyBookmarks(
    currentUser: TAuthenticatedUser,
    query: TBookmarkListQueryDTO,
  ) {
    this.assertCandidateRole(currentUser);

    const entityType = this.resolveEntityTypeFilter(query.type);
    const bookmarks = await this.bookmarkRepository.findAllByUser({
      userId: currentUser.id,
      entityType,
    });

    const hydratedBookmarks = (
      await Promise.all(
        bookmarks.map((bookmark) =>
          this.hydrateBookmark({
            currentUser,
            entityType: bookmark.entityType,
            entityId: bookmark.entityId.toString(),
            savedAt: bookmark.createdAt?.toISOString?.() ?? new Date().toISOString(),
          }),
        ),
      )
    ).filter(Boolean) as TBookmarkListItem[];

    const searchedBookmarks = query.search
      ? hydratedBookmarks.filter((item) =>
          this.matchesSearchQuery(item, query.search ?? ''),
        )
      : hydratedBookmarks;
    const sortedBookmarks = [...searchedBookmarks].sort((left, right) => {
      const leftTimestamp = new Date(left.savedAt).getTime();
      const rightTimestamp = new Date(right.savedAt).getTime();
      return query.sortBy === 'saved_at_asc'
        ? leftTimestamp - rightTimestamp
        : rightTimestamp - leftTimestamp;
    });

    const jobs = sortedBookmarks
      .filter(
        (item): item is Extract<TBookmarkListItem, { entityType: BookmarkEntityType.JOB }> =>
          item.entityType === BookmarkEntityType.JOB,
      )
      .map((item) => ({
        savedAt: item.savedAt,
        job: item.job,
      }));
    const interviews = sortedBookmarks
      .filter(
        (
          item,
        ): item is Extract<
          TBookmarkListItem,
          { entityType: BookmarkEntityType.INTERVIEW }
        > => item.entityType === BookmarkEntityType.INTERVIEW,
      )
      .map((item) => ({
        savedAt: item.savedAt,
        interview: item.interview,
      }));

    return {
      jobs,
      interviews,
      counts: {
        total: jobs.length + interviews.length,
        jobs: jobs.length,
        interviews: interviews.length,
      },
      lastSavedAt:
        sortedBookmarks.length > 0 ? sortedBookmarks[0].savedAt : null,
    };
  }

  async saveJob(currentUser: TAuthenticatedUser, jobId: string) {
    this.assertCandidateRole(currentUser);
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    await this.jobPostingService.getJobPostingById(currentUser, jobId);
    const bookmark = await this.bookmarkRepository.upsertByUserAndEntity({
      userId: currentUser.id,
      entityType: BookmarkEntityType.JOB,
      entityId: jobId,
    });
    await this.gamificationService.awardJobSaved({
      userId: currentUser.id,
      jobId,
    });

    return {
      entityType: BookmarkEntityType.JOB,
      entityId: jobId,
      savedAt: bookmark.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async removeSavedJob(currentUser: TAuthenticatedUser, jobId: string) {
    this.assertCandidateRole(currentUser);
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const deletedBookmark = await this.bookmarkRepository.deleteByUserAndEntity({
      userId: currentUser.id,
      entityType: BookmarkEntityType.JOB,
      entityId: jobId,
    });

    return {
      entityType: BookmarkEntityType.JOB,
      entityId: jobId,
      removed: Boolean(deletedBookmark),
    };
  }

  async saveInterview(currentUser: TAuthenticatedUser, interviewId: string) {
    this.assertCandidateRole(currentUser);
    if (!interviewId || !isValidObjectId(interviewId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.INVALID_ID,
      });
    }

    await this.interviewService.getInterviewById(currentUser, interviewId);
    const bookmark = await this.bookmarkRepository.upsertByUserAndEntity({
      userId: currentUser.id,
      entityType: BookmarkEntityType.INTERVIEW,
      entityId: interviewId,
    });
    await this.gamificationService.awardInterviewSaved({
      userId: currentUser.id,
      interviewId,
    });

    return {
      entityType: BookmarkEntityType.INTERVIEW,
      entityId: interviewId,
      savedAt: bookmark.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  async removeSavedInterview(
    currentUser: TAuthenticatedUser,
    interviewId: string,
  ) {
    this.assertCandidateRole(currentUser);
    if (!interviewId || !isValidObjectId(interviewId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: INTERVIEW_MESSAGES.INVALID_ID,
      });
    }

    const deletedBookmark = await this.bookmarkRepository.deleteByUserAndEntity({
      userId: currentUser.id,
      entityType: BookmarkEntityType.INTERVIEW,
      entityId: interviewId,
    });

    return {
      entityType: BookmarkEntityType.INTERVIEW,
      entityId: interviewId,
      removed: Boolean(deletedBookmark),
    };
  }

  private resolveEntityTypeFilter(type: BookmarkListType) {
    if (type === BookmarkListType.JOBS) {
      return BookmarkEntityType.JOB;
    }

    if (type === BookmarkListType.INTERVIEWS) {
      return BookmarkEntityType.INTERVIEW;
    }

    return undefined;
  }

  private async hydrateBookmark(input: {
    currentUser: TAuthenticatedUser;
    entityType: BookmarkEntityType;
    entityId: string;
    savedAt: string;
  }): Promise<TBookmarkListItem | null> {
    if (input.entityType === BookmarkEntityType.JOB) {
      try {
        const job = await this.jobPostingService.getJobPostingById(
          input.currentUser,
          input.entityId,
        );
        const sanitizedJob = sanitizeDocument(job);
        if (!sanitizedJob) return null;
        return {
          entityType: BookmarkEntityType.JOB,
          savedAt: input.savedAt,
          job: sanitizedJob,
        };
      } catch {
        return null;
      }
    }

    try {
      const interview = await this.interviewService.getInterviewById(
        input.currentUser,
        input.entityId,
      );
      const sanitizedInterview = sanitizeDocument(interview);
      if (!sanitizedInterview) return null;
      return {
        entityType: BookmarkEntityType.INTERVIEW,
        savedAt: input.savedAt,
        interview: sanitizedInterview,
      };
    } catch {
      return null;
    }
  }

  private matchesSearchQuery(item: TBookmarkListItem, search: string) {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const searchableFields =
      item.entityType === BookmarkEntityType.JOB
        ? [
            this.toStringValue(item.job.title),
            this.toStringValue(item.job.location),
            this.toStringValue(item.job.employmentType),
            this.toStringValue(item.job.workMode),
            this.toStringValue(
              (item.job.company as { name?: unknown } | null | undefined)?.name,
            ),
          ]
        : [
            this.toStringValue(item.interview.title),
            this.toStringValue(item.interview.role),
            this.toStringValue(item.interview.interviewType),
            this.toStringValue(item.interview.source),
            this.toStringValue(
              (item.interview.company as { name?: unknown } | null | undefined)
                ?.name,
            ),
            this.toStringValue(
              (item.interview.college as { name?: unknown } | null | undefined)
                ?.name,
            ),
          ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(normalizedQuery),
    );
  }

  private toStringValue(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private assertCandidateRole(currentUser: TAuthenticatedUser) {
    if (
      currentUser.role !== UserRole.USER &&
      currentUser.role !== UserRole.STUDENT
    ) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: BOOKMARK_MESSAGES.FORBIDDEN,
      });
    }
  }
}
