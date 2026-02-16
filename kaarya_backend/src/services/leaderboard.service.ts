import { HttpStatus, Injectable } from '@nestjs/common';
import {
  resolveLeaderboardTotal,
  resolveLevelFromXp,
  resolveLevelProgress,
  resolveReliableAverageScore,
} from 'src/constants/gamification.constants';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { LEADERBOARD_MESSAGES } from 'src/constants/messages.constants';
import { TLeaderboardQueryDTO } from 'src/dtos/colleges/college.dto';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACGamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { ACGamificationProfileRepository } from 'src/repositories/gamification-profile.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';
import { CollegeService } from './college.service';
import { StudentService } from './student.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly applicationRepository: ACApplicationRepository,
    private readonly userRepository: ACUserRepository,
    private readonly gamificationEventRepository: ACGamificationEventRepository,
    private readonly gamificationProfileRepository: ACGamificationProfileRepository,
    private readonly collegeService: CollegeService,
    private readonly studentService: StudentService,
  ) {}

  async getLeaderboard(
    currentUser: TAuthenticatedUser,
    query: TLeaderboardQueryDTO,
  ) {
    const isCollege = currentUser.role === UserRole.COLLEGE;
    const isRecruiter = currentUser.role === UserRole.RECRUITER;
    const effectiveScope = isCollege ? 'college' : query.scope;

    if (isRecruiter && query.scope === 'college') {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: LEADERBOARD_MESSAGES.FORBIDDEN,
      });
    }

    if (effectiveScope === 'college') {
      const collegeId = await this.resolveCollegeScopeId(
        currentUser,
        query.collegeId,
      );
      const studentIds = await this.studentService.listCollegeStudentIds(collegeId);

      const [college, leaderboard, me] = await Promise.all([
        this.collegeService.getCollegeByIdRaw(collegeId),
        this.buildLeaderboardRows({
          page: query.page,
          size: query.size,
          candidateIds: studentIds,
        }),
        this.buildCurrentUserSummary(currentUser, {
          candidateIds: studentIds,
        }),
      ]);

      return {
        scope: 'college',
        workspace: {
          id: college.id,
          name: college.name,
          logo: college.logo ?? null,
        },
        rows: leaderboard.rows,
        me,
        meta: buildPaginationMeta({
          page: query.page,
          size: query.size,
          totalItems: leaderboard.total,
        }),
      };
    }

    const [leaderboard, me] = await Promise.all([
      this.buildLeaderboardRows({
        page: query.page,
        size: query.size,
      }),
      this.buildCurrentUserSummary(currentUser),
    ]);

    return {
      scope: 'global',
      rows: leaderboard.rows,
      me,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: leaderboard.total,
      }),
    };
  }

  private async resolveCollegeScopeId(
    currentUser: TAuthenticatedUser,
    requestedCollegeId?: string,
  ) {
    if (requestedCollegeId) {
      if (currentUser.role === UserRole.ADMIN) {
        return requestedCollegeId;
      }

      if (currentUser.role === UserRole.COLLEGE) {
        await this.collegeService.assertCanManageCollege(
          currentUser,
          requestedCollegeId,
        );
        return requestedCollegeId;
      }

      if (
        currentUser.role === UserRole.USER ||
        currentUser.role === UserRole.STUDENT
      ) {
        await this.studentService.assertStudentMembership({
          studentId: currentUser.id,
          collegeId: requestedCollegeId,
        });
        return requestedCollegeId;
      }
    }

    if (currentUser.role === UserRole.COLLEGE) {
      const myCollege = await this.collegeService.getMyCollege(currentUser);
      const collegeId = myCollege?.college?.id as string | undefined;
      if (!collegeId) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: LEADERBOARD_MESSAGES.FORBIDDEN,
        });
      }
      return collegeId;
    }

    throw new ApiError({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'collegeId is required for college leaderboard scope.',
    });
  }

  private async buildLeaderboardRows(input: {
    page: number;
    size: number;
    candidateIds?: string[];
  }) {
    const leaderboard = await this.userRepository.findCandidateLeaderboardRows({
      page: input.page,
      size: input.size,
      candidateIds: input.candidateIds,
    });

    const users = leaderboard.users;
    const userIds = users.map((user) => user.id);

    const [applicationStatsMap, activityStatsMap, gamificationProfileMap] =
      await Promise.all([
        this.applicationRepository.getLeaderboardStatsByStudentIds(userIds),
        this.gamificationEventRepository.getActivityStatsByUserIds({ userIds }),
        this.gamificationProfileRepository.findByUserIds(userIds),
      ]);

    const startRank = (input.page - 1) * input.size;

    return {
      rows: users.map((user, index) => {
        const applicationStats = applicationStatsMap.get(user.id);
        const activityStats = activityStatsMap.get(user.id);
        const gamificationProfile = gamificationProfileMap.get(user.id);
        const xp = Number.isFinite(gamificationProfile?.xp)
          ? Math.max(0, gamificationProfile?.xp ?? 0)
          : 0;
        const score = Number.isFinite(gamificationProfile?.score)
          ? (gamificationProfile?.score ?? 0)
          : 0;
        const total = resolveLeaderboardTotal({ xp, score });
        const level = Number.isFinite(gamificationProfile?.level)
          ? Math.max(1, gamificationProfile?.level ?? 1)
          : resolveLevelFromXp(xp);
        const averageInterviewScore = Math.round(
          activityStats?.averageInterviewScore ?? 0,
        );
        const interviewScoreEntries = activityStats?.interviewScoreEntries ?? 0;
        const reliableInterviewScore = resolveReliableAverageScore({
          average: averageInterviewScore,
          count: interviewScoreEntries,
        });
        const averageAtsScore = Math.round(activityStats?.averageAtsScore ?? 0);

        return {
          rank: startRank + index + 1,
          total,
          xp,
          score,
          level,
          applications: applicationStats?.applications ?? 0,
          interviewScheduled: applicationStats?.interviewScheduled ?? 0,
          accepted: applicationStats?.accepted ?? 0,
          shortlisted: applicationStats?.shortlisted ?? 0,
          rejected: applicationStats?.rejected ?? 0,
          profileUpdates: activityStats?.profileUpdates ?? 0,
          jobViews: activityStats?.jobViews ?? 0,
          jobsSaved: activityStats?.jobsSaved ?? 0,
          interviewsSaved: activityStats?.interviewsSaved ?? 0,
          applicationsSubmitted: activityStats?.applicationsSubmitted ?? 0,
          interviewsTaken: activityStats?.interviewsTaken ?? 0,
          interviewsCompleted: activityStats?.interviewsCompleted ?? 0,
          resumesCreated: activityStats?.resumesCreated ?? 0,
          resumesSaved: activityStats?.resumesSaved ?? 0,
          atsScans: activityStats?.atsScans ?? 0,
          bestInterviewScore: activityStats?.bestInterviewScore ?? 0,
          averageInterviewScore,
          reliableInterviewScore,
          interviewScoreEntries,
          bestAtsScore: activityStats?.bestAtsScore ?? 0,
          averageAtsScore,
          atsScoreEntries: activityStats?.atsScoreEntries ?? 0,
          student: {
            id: user.id,
            name: user.name ?? null,
            photo: user.photo ?? null,
            email: user.email ?? null,
          },
        };
      }),
      total: leaderboard.total,
    };
  }

  private async buildCurrentUserSummary(
    currentUser: TAuthenticatedUser,
    options?: {
      candidateIds?: string[];
    },
  ) {
    const isCandidate =
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT;
    if (!isCandidate) {
      return null;
    }

    const me = await this.userRepository.findById(currentUser.id);
    if (!me) {
      return null;
    }

    const meProfile = await this.gamificationProfileRepository.findByUserId(
      currentUser.id,
    );

    if (
      Array.isArray(options?.candidateIds) &&
      options?.candidateIds.length > 0 &&
      !options.candidateIds.includes(currentUser.id)
    ) {
      return null;
    }

    if (Array.isArray(options?.candidateIds) && options.candidateIds.length === 0) {
      return null;
    }

    const xp = Number.isFinite(meProfile?.xp)
      ? Math.max(0, meProfile?.xp ?? 0)
      : 0;
    const score = Number.isFinite(meProfile?.score)
      ? (meProfile?.score ?? 0)
      : 0;
    const total = resolveLeaderboardTotal({ xp, score });
    const [aheadCount, applicationStatsMap, activityStatsMap] = await Promise.all([
      this.userRepository.countCandidatesAheadOfUser({
        userId: currentUser.id,
        score,
        xp,
        candidateIds: options?.candidateIds,
      }),
      this.applicationRepository.getLeaderboardStatsByStudentIds([currentUser.id]),
      this.gamificationEventRepository.getActivityStatsByUserIds({
        userIds: [currentUser.id],
      }),
    ]);

    const applicationStats = applicationStatsMap.get(currentUser.id);
    const activityStats = activityStatsMap.get(currentUser.id);
    const averageInterviewScore = Math.round(
      activityStats?.averageInterviewScore ?? 0,
    );
    const interviewScoreEntries = activityStats?.interviewScoreEntries ?? 0;
    const reliableInterviewScore = resolveReliableAverageScore({
      average: averageInterviewScore,
      count: interviewScoreEntries,
    });
    const averageAtsScore = Math.round(activityStats?.averageAtsScore ?? 0);

    return {
      rank: aheadCount + 1,
      total,
      xp,
      score,
      level: Number.isFinite(meProfile?.level)
        ? Math.max(1, meProfile?.level ?? 1)
        : resolveLevelFromXp(xp),
      progress: resolveLevelProgress(xp),
      applications: applicationStats?.applications ?? 0,
      interviewScheduled: applicationStats?.interviewScheduled ?? 0,
      accepted: applicationStats?.accepted ?? 0,
      shortlisted: applicationStats?.shortlisted ?? 0,
      rejected: applicationStats?.rejected ?? 0,
      profileUpdates: activityStats?.profileUpdates ?? 0,
      jobViews: activityStats?.jobViews ?? 0,
      jobsSaved: activityStats?.jobsSaved ?? 0,
      interviewsSaved: activityStats?.interviewsSaved ?? 0,
      applicationsSubmitted: activityStats?.applicationsSubmitted ?? 0,
      interviewsTaken: activityStats?.interviewsTaken ?? 0,
      interviewsCompleted: activityStats?.interviewsCompleted ?? 0,
      resumesCreated: activityStats?.resumesCreated ?? 0,
      resumesSaved: activityStats?.resumesSaved ?? 0,
      atsScans: activityStats?.atsScans ?? 0,
      bestInterviewScore: activityStats?.bestInterviewScore ?? 0,
      averageInterviewScore,
      reliableInterviewScore,
      interviewScoreEntries,
      bestAtsScore: activityStats?.bestAtsScore ?? 0,
      averageAtsScore,
      atsScoreEntries: activityStats?.atsScoreEntries ?? 0,
      student: {
        id: me.id,
        name: me.name ?? null,
        photo: me.photo ?? null,
        email: me.email ?? null,
      },
    };
  }
}
