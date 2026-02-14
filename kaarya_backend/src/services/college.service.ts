import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { COLLEGE_MESSAGES } from 'src/constants/messages.constants';
import {
  TCollegesQueryDTO,
  TCollegeStudentsQueryDTO,
  TCreateCollegeDTO,
  TInviteStudentToCollegeDTO,
  TJoinCollegeByCodeDTO,
  TUpdateCollegeDTO,
} from 'src/dtos/colleges/college.dto';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { AllConfigType } from 'src/types/config.type';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import { EmailService } from './email.service';
import { StudentService } from './student.service';
import { UserService } from './user.service';

@Injectable()
export class CollegeService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly collegeRepository: ACCollegeRepository,
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly studentRepository: ACStudentRepository,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async createCollege(
    currentUser: TAuthenticatedUser,
    payload: TCreateCollegeDTO,
  ) {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.COLLEGE
    ) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.COLLEGE_ROLE_REQUIRED,
      });
    }

    if (currentUser.role === UserRole.COLLEGE) {
      const existingCollege = await this.collegeRepository.findFirstByCreatedBy(
        currentUser.id,
      );
      if (existingCollege) {
        throw new ApiError({
          statusCode: HttpStatus.CONFLICT,
          message: 'This account already has a college workspace.',
        });
      }
    }

    const inviteCode = await this.generateUniqueInviteCode();
    const college = await this.collegeRepository.create({
      name: payload.name,
      institutionType: payload.institutionType ?? null,
      location: payload.location ?? null,
      logo: payload.logo ?? null,
      inviteCode,
      createdBy: new Types.ObjectId(currentUser.id),
    });

    return sanitizeDocument(college);
  }

  async updateCollege(
    currentUser: TAuthenticatedUser,
    collegeId: string,
    payload: TUpdateCollegeDTO,
  ) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);

    const college = await this.collegeRepository.updateById(collegeId, payload);
    if (!college) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(college);
  }

  async deleteCollege(currentUser: TAuthenticatedUser, collegeId: string) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);

    await Promise.all([
      this.jobPostingRepository.deleteManyByCollegeId(collegeId),
      this.studentService.removeAllByCollegeId(collegeId),
    ]);

    const deletedCollege = await this.collegeRepository.deleteById(collegeId);
    if (!deletedCollege) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(deletedCollege);
  }

  async listColleges(query: TCollegesQueryDTO) {
    const { colleges, total } = await this.collegeRepository.findAll(query);

    return {
      colleges: colleges
        .map((college) => sanitizeDocument(college))
        .filter((college): college is Record<string, unknown> => !!college),
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
        search: query.search,
      }),
    };
  }

  async listStudentWorkspaces(
    currentUser: TAuthenticatedUser,
    query: TCollegeStudentsQueryDTO,
  ) {
    if (currentUser.role === UserRole.COLLEGE) {
      const college = await this.collegeRepository.findFirstByCreatedBy(
        currentUser.id,
      );
      if (!college) {
        return {
          workspaces: [],
          meta: buildPaginationMeta({
            page: query.page,
            size: query.size,
            totalItems: 0,
          }),
        };
      }

      return {
        workspaces: [
          {
            college: {
              id: college.id,
              name: college.name,
              logo: college.logo ?? null,
              inviteCode: college.inviteCode ?? null,
            },
            membershipId: `owner-${college.id}`,
            program: null,
            year: null,
            joinedAt:
              college.createdAt instanceof Date
                ? college.createdAt.toISOString()
                : college.createdAt,
          },
        ],
        meta: buildPaginationMeta({
          page: query.page,
          size: query.size,
          totalItems: 1,
        }),
      };
    }

    if (
      currentUser.role !== UserRole.USER &&
      currentUser.role !== UserRole.STUDENT
    ) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
      });
    }

    const { students, total } = await this.studentService.listStudentMemberships({
      studentId: currentUser.id,
      page: query.page,
      size: query.size,
    });

    return {
      workspaces: students
        .map((profile) => this.buildWorkspaceSwitcherItem(profile))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async listCollegeStudents(
    currentUser: TAuthenticatedUser,
    collegeId: string,
    query: TCollegeStudentsQueryDTO,
  ) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);
    const college = await this.getCollegeByIdRaw(collegeId);

    const { students, total } = await this.studentRepository.findAllByCollegeId({
      collegeId,
      page: query.page,
      size: query.size,
    });

    return {
      workspace: {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
        inviteCode: college.inviteCode ?? null,
      },
      members: students
        .map((profile) => this.buildStudentProfileResponse(profile))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async joinCollegeByInviteCode(
    currentUser: TAuthenticatedUser,
    payload: TJoinCollegeByCodeDTO,
  ) {
    if (
      currentUser.role !== UserRole.USER &&
      currentUser.role !== UserRole.STUDENT
    ) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
      });
    }

    const college = await this.collegeRepository.findByInviteCode(
      payload.inviteCode,
    );
    if (!college) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.INVITE_CODE_INVALID,
      });
    }

    const membership = await this.studentService.assignStudentToCollege({
      studentId: currentUser.id,
      collegeId: college.id,
      program: payload.program,
      year: payload.year,
    });

    return {
      workspace: {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
        inviteCode: college.inviteCode ?? null,
      },
      member: sanitizeDocument(membership),
    };
  }

  async resetCollegeInviteCode(
    currentUser: TAuthenticatedUser,
    collegeId: string,
  ) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);
    const inviteCode = await this.generateUniqueInviteCode();
    const college = await this.collegeRepository.updateById(collegeId, {
      inviteCode,
    });

    if (!college) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.NOT_FOUND,
      });
    }

    return {
      college: {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
      },
      inviteCode: college.inviteCode,
    };
  }

  async inviteStudentToCollege(
    currentUser: TAuthenticatedUser,
    collegeId: string,
    payload: TInviteStudentToCollegeDTO,
  ) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);
    const college = await this.getCollegeByIdRaw(collegeId);
    const inviteeEmail = payload.email.trim().toLowerCase();

    const inviteeUser = await this.userService.getUserByEmail(inviteeEmail);
    if (
      inviteeUser &&
      inviteeUser.role !== UserRole.USER &&
      inviteeUser.role !== UserRole.STUDENT
    ) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
      });
    }

    if (inviteeUser) {
      const existingMembership =
        await this.studentService.getMembershipByStudentAndCollege({
          studentId: inviteeUser.id,
          collegeId: college.id,
        });

      if (existingMembership) {
        throw new ApiError({
          statusCode: HttpStatus.CONFLICT,
          message: COLLEGE_MESSAGES.INVITEE_ALREADY_IN_COLLEGE,
        });
      }
    }

    const inviteCode = college.inviteCode ?? (await this.generateUniqueInviteCode());
    if (inviteCode !== college.inviteCode) {
      await this.collegeRepository.updateById(college.id, { inviteCode });
    }

    const inviteLink = this.buildInviteLink(college.id, inviteCode);
    const inviterUser = await this.userService.getUserByIdRaw(currentUser.id);
    let emailSent = false;
    try {
      await this.emailService.sendCompanyInvite(inviteeEmail, {
        companyName: college.name,
        inviteCode,
        inviteLink,
        inviteeEmail,
        invitedByName: inviterUser.name,
        designation: payload.program
          ? payload.year
            ? `${payload.program} (Year ${payload.year})`
            : payload.program
          : payload.year
            ? `Year ${payload.year}`
            : null,
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }

    return {
      workspace: {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
      },
      inviteeEmail,
      program: payload.program ?? null,
      year: payload.year ?? null,
      inviteCode,
      inviteLink,
      emailSent,
    };
  }

  async getCollegeById(collegeId: string) {
    const college = await this.getCollegeByIdRaw(collegeId);
    return sanitizeDocument(college);
  }

  async getMyCollege(currentUser: TAuthenticatedUser) {
    if (currentUser.role !== UserRole.COLLEGE) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
      });
    }

    const college = await this.collegeRepository.findFirstByCreatedBy(
      currentUser.id,
    );
    if (!college) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.NOT_FOUND,
      });
    }

    return {
      college: sanitizeDocument(college),
    };
  }

  async getCollegeMetrics(currentUser: TAuthenticatedUser, collegeId: string) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCollege(currentUser, collegeId);
    const college = await this.getCollegeByIdRaw(collegeId);
    const studentIds = await this.studentService.listCollegeStudentIds(collegeId);
    const studentCount = studentIds.length;

    const [applicationsCount, statusCounts, collegeJobsResult, leaderboard] =
      await Promise.all([
        this.applicationRepository.countByStudentIds(studentIds),
        this.applicationRepository.getStatusCountsByStudentIds(studentIds),
        this.jobPostingRepository.findAll({
          page: 1,
          size: 500,
          collegeId,
          visibility: JobVisibility.COLLEGE_ONLY,
        }),
        this.applicationRepository.getLeaderboardRows({
          page: 1,
          size: 10,
          studentIds,
        }),
      ]);

    const collegeJobs = collegeJobsResult.jobs;
    const openCollegeJobs = collegeJobs.filter(
      (job) => job.status === JobPostingStatus.OPEN,
    ).length;
    const closedCollegeJobs = collegeJobs.filter(
      (job) => job.status === JobPostingStatus.CLOSED,
    ).length;
    const draftCollegeJobs = collegeJobs.filter(
      (job) => job.status === JobPostingStatus.DRAFT,
    ).length;

    const topStudents = await Promise.all(
      leaderboard.rows.map(async (row, index) => {
        let user: { id: string; name?: string | null; photo?: string | null } | null =
          null;
        try {
          const userRaw = await this.userService.getUserByIdRaw(row.studentId);
          user = {
            id: userRaw.id,
            name: userRaw.name,
            photo: userRaw.photo ?? null,
          };
        } catch {
          user = { id: row.studentId };
        }

        return {
          rank: index + 1,
          score: row.score,
          applications: row.applications,
          interviewScheduled: row.interviewScheduled,
          accepted: row.accepted,
          student: user,
        };
      }),
    );

    return {
      workspace: {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
      },
      summary: {
        students: studentCount,
        applications: applicationsCount,
        interviewScheduled: statusCounts.interviewScheduled,
        accepted: statusCounts.accepted,
        rejected: statusCounts.rejected,
        openCollegeJobs,
        closedCollegeJobs,
        draftCollegeJobs,
      },
      statusBreakdown: statusCounts,
      leaderboard: topStudents,
    };
  }

  async assignStudentToCollegeByAdmin(input: {
    studentId: string;
    collegeId: string;
    program?: string;
    year?: number;
  }) {
    const college = await this.getCollegeByIdRaw(input.collegeId);
    const membership = await this.studentService.assignStudentToCollege({
      studentId: input.studentId,
      collegeId: college.id,
      program: input.program,
      year: input.year,
    });

    return {
      college: sanitizeDocument(college),
      studentProfile: sanitizeDocument(membership),
    };
  }

  async removeStudentFromCollegeByAdmin(input: {
    studentId: string;
    collegeId: string;
  }) {
    const college = await this.getCollegeByIdRaw(input.collegeId);
    const removedMembership = await this.studentService.removeStudentFromCollege({
      studentId: input.studentId,
      collegeId: college.id,
    });

    return {
      college: sanitizeDocument(college),
      studentProfile: sanitizeDocument(removedMembership),
    };
  }

  async removeStudentFromCollege(
    currentUser: TAuthenticatedUser,
    input: {
      studentId: string;
      collegeId: string;
    },
  ) {
    await this.assertCanManageCollege(currentUser, input.collegeId);
    const college = await this.getCollegeByIdRaw(input.collegeId);
    const removedMembership = await this.studentService.removeStudentFromCollege({
      studentId: input.studentId,
      collegeId: college.id,
    });

    return {
      college: sanitizeDocument(college),
      studentProfile: sanitizeDocument(removedMembership),
    };
  }

  async getCollegeByIdRaw(collegeId: string) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    const college = await this.collegeRepository.findById(collegeId);
    if (!college) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.NOT_FOUND,
      });
    }

    return college;
  }

  async assertCanManageCollege(
    currentUser: TAuthenticatedUser,
    collegeId: string,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role !== UserRole.COLLEGE) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
      });
    }

    const college = await this.getCollegeByIdRaw(collegeId);
    const createdBy =
      college.createdBy instanceof Types.ObjectId
        ? college.createdBy.toString()
        : null;

    if (createdBy !== currentUser.id) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
      });
    }
  }

  private buildWorkspaceSwitcherItem(profile: unknown) {
    const membershipData = sanitizeDocument(profile);
    if (!membershipData) {
      return null;
    }

    const collegeRaw = (profile as { collegeId?: unknown }).collegeId;
    const college =
      typeof collegeRaw === 'object' && collegeRaw
        ? sanitizeDocument(collegeRaw)
        : null;

    const collegeId =
      typeof membershipData.collegeId === 'string'
        ? membershipData.collegeId
        : ((membershipData.collegeId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);

    const collegeData =
      college ??
      (collegeId
        ? {
            id: collegeId,
          }
        : null);

    if (!collegeData || typeof collegeData.id !== 'string') {
      return null;
    }

    return {
      college:
        typeof collegeData === 'object'
          ? {
              id:
                typeof collegeData.id === 'string'
                  ? collegeData.id
                  : String(collegeData.id),
              name:
                typeof collegeData.name === 'string' ? collegeData.name : null,
              logo:
                typeof collegeData.logo === 'string' ? collegeData.logo : null,
              inviteCode:
                typeof collegeData.inviteCode === 'string'
                  ? collegeData.inviteCode
                  : null,
            }
          : null,
      membershipId: membershipData.id,
      program:
        typeof membershipData.program === 'string' ? membershipData.program : null,
      year:
        typeof membershipData.year === 'number' ? membershipData.year : null,
      joinedAt:
        membershipData.createdAt instanceof Date ||
        typeof membershipData.createdAt === 'string'
          ? membershipData.createdAt
          : null,
    };
  }

  private buildStudentProfileResponse(profile: unknown) {
    const profileData = sanitizeDocument(profile);
    if (!profileData) return null;

    const studentRaw = (profile as { studentId?: unknown }).studentId;
    const student =
      typeof studentRaw === 'object' && studentRaw
        ? sanitizeDocument(studentRaw)
        : null;

    return {
      ...profileData,
      student:
        student ??
        (typeof profileData.studentId === 'string'
          ? { id: profileData.studentId }
          : null),
    };
  }

  private async generateUniqueInviteCode() {
    const maxAttempts = 10;
    for (let index = 0; index < maxAttempts; index += 1) {
      const code = this.generateInviteCode();
      const existing = await this.collegeRepository.findByInviteCode(code);
      if (!existing) {
        return code;
      }
    }

    throw new ApiError({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unable to generate a unique invite code.',
    });
  }

  private generateInviteCode() {
    const raw = randomBytes(4).toString('hex').toUpperCase();
    return `KC-${raw}`;
  }

  private buildInviteLink(collegeId: string, inviteCode: string) {
    const frontendDomain =
      this.configService.get(CONFIG_KEYS.APP.FRONTEND_DOMAIN, {
        infer: true,
      }) ?? 'http://localhost:3000';
    const cleanBase = frontendDomain.replace(/\/$/, '');
    return `${cleanBase}/college-invites?collegeId=${encodeURIComponent(collegeId)}&inviteCode=${encodeURIComponent(inviteCode)}`;
  }
}
