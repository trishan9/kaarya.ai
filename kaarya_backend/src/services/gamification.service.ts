import { Injectable } from '@nestjs/common';
import {
  ATS_SCORE_XP_BANDS,
  GAMIFICATION_SCORE,
  GAMIFICATION_XP,
  INTERVIEW_SCORE_XP_BANDS,
  resolveAtsScoreDelta,
  resolveLevelProgress,
  resolveInterviewScoreDelta,
  resolveXpFromScoreBands,
} from 'src/constants/gamification.constants';
import { ACGamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { ACGamificationProfileRepository } from 'src/repositories/gamification-profile.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { GamificationEventType } from 'src/types/gamification-event-type.enum';
import { UserRole } from 'src/types/user-role.enum';

@Injectable()
export class GamificationService {
  constructor(
    private readonly gamificationEventRepository: ACGamificationEventRepository,
    private readonly gamificationProfileRepository: ACGamificationProfileRepository,
    private readonly userRepository: ACUserRepository,
  ) {}

  async awardProgress(input: {
    userId: string;
    eventType: GamificationEventType;
    eventKey: string;
    xpDelta?: number;
    scoreDelta?: number;
    metadata?: Record<string, unknown>;
  }) {
    if (!input.userId || !input.eventType || !input.eventKey) {
      return { created: false };
    }

    const xpDelta =
      Number.isFinite(input.xpDelta) && (input.xpDelta ?? 0) !== 0
        ? Math.floor(input.xpDelta as number)
        : 0;
    const scoreDelta =
      Number.isFinite(input.scoreDelta) && (input.scoreDelta ?? 0) !== 0
        ? Math.floor(input.scoreDelta as number)
        : 0;

    if (!xpDelta && !scoreDelta) {
      return { created: false };
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user || !this.isCandidateRole(user.role)) {
      return { created: false };
    }

    const event = await this.gamificationEventRepository.createUnique({
      userId: input.userId,
      eventType: input.eventType,
      eventKey: input.eventKey,
      xpAwarded: xpDelta,
      scoreDelta,
      metadata: input.metadata ?? {},
    });

    if (!event.created) {
      return { created: false };
    }

    const updatedProfile = await this.gamificationProfileRepository.applyDelta({
      userId: input.userId,
      xpDelta,
      scoreDelta,
    });

    return {
      created: true,
      xp: updatedProfile?.xp ?? 0,
      level: updatedProfile?.level ?? 1,
      score: updatedProfile?.score ?? 0,
    };
  }

  async awardJobViewed(input: {
    userId: string;
    jobId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.JOB_VIEWED,
      eventKey: `job:viewed:${input.userId}:${input.jobId}`,
      xpDelta: GAMIFICATION_XP.JOB_VIEWED,
      scoreDelta: GAMIFICATION_SCORE.JOB_VIEWED,
      metadata: {
        jobId: input.jobId,
      },
    });
  }

  async awardJobSaved(input: {
    userId: string;
    jobId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.JOB_SAVED,
      eventKey: `job:saved:${input.userId}:${input.jobId}`,
      xpDelta: GAMIFICATION_XP.JOB_SAVED,
      scoreDelta: GAMIFICATION_SCORE.JOB_SAVED,
      metadata: {
        jobId: input.jobId,
      },
    });
  }

  async awardInterviewSaved(input: {
    userId: string;
    interviewId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.INTERVIEW_SAVED,
      eventKey: `interview:saved:${input.userId}:${input.interviewId}`,
      xpDelta: GAMIFICATION_XP.INTERVIEW_SAVED,
      scoreDelta: GAMIFICATION_SCORE.INTERVIEW_SAVED,
      metadata: {
        interviewId: input.interviewId,
      },
    });
  }

  async awardJobApplicationSubmitted(input: {
    userId: string;
    applicationId: string;
    jobId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.JOB_APPLICATION_SUBMITTED,
      eventKey: `job:application:submitted:${input.applicationId}`,
      xpDelta: GAMIFICATION_XP.JOB_APPLICATION_SUBMITTED,
      scoreDelta: GAMIFICATION_SCORE.JOB_APPLICATION_SUBMITTED,
      metadata: {
        applicationId: input.applicationId,
        jobId: input.jobId,
      },
    });
  }

  async awardProfileUpdated(input: { userId: string; updatedAt?: Date | null }) {
    const date = input.updatedAt ?? new Date();
    const dateToken = date.toISOString().slice(0, 10);

    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.PROFILE_UPDATED,
      eventKey: `profile:updated:${input.userId}:${dateToken}`,
      xpDelta: GAMIFICATION_XP.PROFILE_UPDATED,
      scoreDelta: GAMIFICATION_SCORE.PROFILE_UPDATED,
      metadata: {
        date: dateToken,
      },
    });
  }

  async awardApplicationStatus(input: {
    userId: string;
    applicationId: string;
    status:
      | 'shortlisted'
      | 'interview_scheduled'
      | 'accepted'
      | 'rejected';
  }) {
    const byStatus = {
      shortlisted: {
        eventType: GamificationEventType.APPLICATION_STATUS_SHORTLISTED,
        xpDelta: GAMIFICATION_XP.APPLICATION_STATUS_SHORTLISTED,
        scoreDelta: GAMIFICATION_SCORE.APPLICATION_STATUS_SHORTLISTED,
      },
      interview_scheduled: {
        eventType: GamificationEventType.APPLICATION_STATUS_INTERVIEW_SCHEDULED,
        xpDelta: GAMIFICATION_XP.APPLICATION_STATUS_INTERVIEW_SCHEDULED,
        scoreDelta: GAMIFICATION_SCORE.APPLICATION_STATUS_INTERVIEW_SCHEDULED,
      },
      accepted: {
        eventType: GamificationEventType.APPLICATION_STATUS_ACCEPTED,
        xpDelta: GAMIFICATION_XP.APPLICATION_STATUS_ACCEPTED,
        scoreDelta: GAMIFICATION_SCORE.APPLICATION_STATUS_ACCEPTED,
      },
      rejected: {
        eventType: GamificationEventType.APPLICATION_STATUS_REJECTED,
        xpDelta: GAMIFICATION_XP.APPLICATION_STATUS_REJECTED,
        scoreDelta: GAMIFICATION_SCORE.APPLICATION_STATUS_REJECTED,
      },
    } as const;

    const selected = byStatus[input.status];
    if (!selected) {
      return { created: false };
    }

    return await this.awardProgress({
      userId: input.userId,
      eventType: selected.eventType,
      eventKey: `job:application:status:${input.applicationId}:${input.status}`,
      xpDelta: selected.xpDelta,
      scoreDelta: selected.scoreDelta,
      metadata: {
        applicationId: input.applicationId,
        status: input.status,
      },
    });
  }

  async awardInterviewStarted(input: {
    userId: string;
    interviewId: string;
    sessionId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.MOCK_INTERVIEW_STARTED,
      eventKey: `interview:session:started:${input.sessionId}`,
      xpDelta: GAMIFICATION_XP.MOCK_INTERVIEW_STARTED,
      scoreDelta: GAMIFICATION_SCORE.MOCK_INTERVIEW_STARTED,
      metadata: {
        interviewId: input.interviewId,
        sessionId: input.sessionId,
      },
    });
  }

  async awardInterviewCompleted(input: {
    userId: string;
    interviewId: string;
    sessionId: string;
    score?: number | null;
  }) {
    await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.MOCK_INTERVIEW_COMPLETED,
      eventKey: `interview:session:completed:${input.sessionId}`,
      xpDelta: GAMIFICATION_XP.MOCK_INTERVIEW_COMPLETED,
      scoreDelta: GAMIFICATION_SCORE.MOCK_INTERVIEW_COMPLETED,
      metadata: {
        interviewId: input.interviewId,
        sessionId: input.sessionId,
      },
    });

    const scoreXp = resolveXpFromScoreBands(input.score, INTERVIEW_SCORE_XP_BANDS);
    const scoreDelta = resolveInterviewScoreDelta(input.score);

    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.MOCK_INTERVIEW_SCORE_AWARDED,
      eventKey: `interview:session:score:${input.sessionId}`,
      xpDelta: scoreXp,
      scoreDelta,
      metadata: {
        interviewId: input.interviewId,
        sessionId: input.sessionId,
        score: input.score ?? 0,
      },
    });
  }

  async awardResumeBuilderCreated(input: {
    userId: string;
    resumeBuilderId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.RESUME_BUILDER_CREATED,
      eventKey: `resume:builder:created:${input.resumeBuilderId}`,
      xpDelta: GAMIFICATION_XP.RESUME_BUILDER_CREATED,
      scoreDelta: GAMIFICATION_SCORE.RESUME_BUILDER_CREATED,
      metadata: {
        resumeBuilderId: input.resumeBuilderId,
      },
    });
  }

  async awardResumeBuilderSaved(input: {
    userId: string;
    resumeBuilderId: string;
    resumeId: string;
  }) {
    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.RESUME_BUILDER_SAVED,
      eventKey: `resume:builder:saved:${input.resumeBuilderId}`,
      xpDelta: GAMIFICATION_XP.RESUME_BUILDER_SAVED,
      scoreDelta: GAMIFICATION_SCORE.RESUME_BUILDER_SAVED,
      metadata: {
        resumeBuilderId: input.resumeBuilderId,
        resumeId: input.resumeId,
      },
    });
  }

  async awardAtsScan(input: {
    userId: string;
    resumeId: string;
    score?: number | null;
  }) {
    await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.ATS_SCAN_COMPLETED,
      eventKey: `resume:ats:scan:${input.resumeId}`,
      xpDelta: GAMIFICATION_XP.ATS_SCAN_COMPLETED,
      scoreDelta: GAMIFICATION_SCORE.ATS_SCAN_COMPLETED,
      metadata: {
        resumeId: input.resumeId,
      },
    });

    const scoreXp = resolveXpFromScoreBands(input.score, ATS_SCORE_XP_BANDS);
    const scoreDelta = resolveAtsScoreDelta(input.score);

    return await this.awardProgress({
      userId: input.userId,
      eventType: GamificationEventType.ATS_SCORE_AWARDED,
      eventKey: `resume:ats:score:${input.resumeId}`,
      xpDelta: scoreXp,
      scoreDelta,
      metadata: {
        resumeId: input.resumeId,
        score: input.score ?? 0,
      },
    });
  }

  getXpProgress(xp: number | null | undefined) {
    return resolveLevelProgress(xp);
  }

  private isCandidateRole(role: UserRole | string) {
    return role === UserRole.USER || role === UserRole.STUDENT;
  }
}
