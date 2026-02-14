import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { LEADERBOARD_MESSAGES } from 'src/constants/messages.constants';
import { TLeaderboardQueryDTO } from 'src/dtos/colleges/college.dto';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';
import { CollegeService } from './college.service';
import { StudentService } from './student.service';
import { UserService } from './user.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly applicationRepository: ACApplicationRepository,
    private readonly collegeService: CollegeService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
  ) {}

  async getLeaderboard(
    currentUser: TAuthenticatedUser,
    query: TLeaderboardQueryDTO,
  ) {
    if (query.scope === 'college') {
      const collegeId = await this.resolveCollegeScopeId(currentUser, query.collegeId);
      const studentIds = await this.studentService.listCollegeStudentIds(collegeId);
      const [college, leaderboard] = await Promise.all([
        this.collegeService.getCollegeByIdRaw(collegeId),
        this.applicationRepository.getLeaderboardRows({
          page: query.page,
          size: query.size,
          studentIds,
        }),
      ]);

      return {
        scope: 'college',
        workspace: {
          id: college.id,
          name: college.name,
          logo: college.logo ?? null,
        },
        rows: await this.hydrateLeaderboardRows(
          leaderboard.rows,
          query.page,
          query.size,
        ),
        meta: buildPaginationMeta({
          page: query.page,
          size: query.size,
          totalItems: leaderboard.total,
        }),
      };
    }

    const leaderboard = await this.applicationRepository.getLeaderboardRows({
      page: query.page,
      size: query.size,
    });

    return {
      scope: 'global',
      rows: await this.hydrateLeaderboardRows(
        leaderboard.rows,
        query.page,
        query.size,
      ),
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

  private async hydrateLeaderboardRows(
    rows: Array<{
      studentId: string;
      applications: number;
      interviewScheduled: number;
      accepted: number;
      score: number;
    }>,
    page: number,
    size: number,
  ) {
    const startRank = (page - 1) * size;

    return await Promise.all(
      rows.map(async (row, index) => {
        let user: {
          id: string;
          name?: string | null;
          photo?: string | null;
          email?: string | null;
        } | null = null;

        try {
          const userRaw = await this.userService.getUserByIdRaw(row.studentId);
          user = {
            id: userRaw.id,
            name: userRaw.name,
            photo: userRaw.photo ?? null,
            email: userRaw.email ?? null,
          };
        } catch {
          user = { id: row.studentId };
        }

        return {
          rank: startRank + index + 1,
          score: row.score,
          applications: row.applications,
          interviewScheduled: row.interviewScheduled,
          accepted: row.accepted,
          student: user,
        };
      }),
    );
  }
}
