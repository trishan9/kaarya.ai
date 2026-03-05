import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { COLLEGE_MESSAGES } from 'src/constants/messages.constants';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACGamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { ACGamificationProfileRepository } from 'src/repositories/gamification-profile.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { CollegeService } from 'src/services/college.service';
import { EmailService } from 'src/services/email.service';
import { StudentService } from 'src/services/student.service';
import { UserService } from 'src/services/user.service';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('CollegeService', () => {
  let service: CollegeService;
  let configService: jest.Mocked<ConfigService>;
  let collegeRepository: jest.Mocked<ACCollegeRepository>;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let userRepository: jest.Mocked<ACUserRepository>;
  let gamificationEventRepository: jest.Mocked<ACGamificationEventRepository>;
  let gamificationProfileRepository: jest.Mocked<ACGamificationProfileRepository>;
  let studentRepository: jest.Mocked<ACStudentRepository>;
  let studentService: jest.Mocked<StudentService>;
  let userService: jest.Mocked<UserService>;
  let emailService: jest.Mocked<EmailService>;

  const collegeId = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const collegeDoc = {
    id: collegeId,
    name: 'Tech College',
    inviteCode: 'KC-ABCD',
    logo: null,
    createdBy: new Types.ObjectId(userId),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const expectApiError = async (
    fn: () => Promise<unknown>,
    status: number,
    message?: string,
  ) => {
    try {
      await fn();
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.getStatus()).toBe(status);
      if (message) {
        expect(JSON.stringify(apiError.getResponse())).toContain(message);
      }
    }
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === CONFIG_KEYS.APP.FRONTEND_DOMAIN) {
          return 'https://app.example.com';
        }
        return undefined;
      }),
    } as never;

    collegeRepository = {
      create: jest.fn().mockResolvedValue(collegeDoc as never),
      findById: jest.fn().mockResolvedValue(collegeDoc as never),
      findByInviteCode: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn(),
      findFirstByCreatedBy: jest.fn().mockResolvedValue(collegeDoc as never),
      findByCreatedBy: jest.fn(),
      updateById: jest.fn().mockResolvedValue(collegeDoc as never),
      deleteById: jest.fn().mockResolvedValue(collegeDoc as never),
      findAll: jest.fn().mockResolvedValue({
        colleges: [collegeDoc],
        total: 1,
      }),
    } as never;

    jobPostingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue({
        jobs: [
          { status: JobPostingStatus.OPEN },
          { status: JobPostingStatus.CLOSED },
          { status: JobPostingStatus.DRAFT },
        ],
        total: 3,
      }),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      deleteManyByCollegeId: jest.fn().mockResolvedValue(2),
      incrementViewsCount: jest.fn(),
      setApplicationsCount: jest.fn(),
    } as never;

    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByJobIdAndStudentId: jest.fn(),
      findByJobIdAndStudentIdWithRelations: jest.fn(),
      findByIdForJob: jest.fn(),
      findByStudentAndJobIds: jest.fn(),
      findAllByStudentId: jest.fn(),
      countByStudentWithFilters: jest.fn(),
      getStatusCountsByStudentWithFilters: jest.fn(),
      getDailyCountsByStudentWithFilters: jest.fn(),
      getJobCountsByStudentWithFilters: jest.fn(),
      updateById: jest.fn(),
      findJobIdsByStudentAndStatuses: jest.fn(),
      countByJobId: jest.fn(),
      countByStudentIds: jest.fn().mockResolvedValue(5),
      findAllByJobId: jest.fn(),
      findDistinctStudentIdsByJobIds: jest.fn(),
      countByStudentAndResumeId: jest.fn(),
      getStatusCountsByStudentIds: jest.fn().mockResolvedValue({
        applied: 1,
        reviewing: 1,
        shortlisted: 1,
        interviewScheduled: 1,
        accepted: 1,
        rejected: 0,
        withdrawn: 0,
      }),
      getLeaderboardStatsByStudentIds: jest
        .fn()
        .mockResolvedValue(
          new Map([[studentId, { applications: 3, interviewScheduled: 1, accepted: 1, shortlisted: 1, rejected: 0 }]]),
        ),
      getLeaderboardRows: jest.fn(),
    } as never;

    userRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      getAnalytics: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
      findByProviderSocialId: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findCandidateLeaderboardRows: jest.fn().mockResolvedValue({
        users: [{ id: studentId, name: 'Student One', photo: null }],
        total: 1,
      }),
      countCandidatesAheadOfUser: jest.fn(),
    } as never;

    gamificationEventRepository = {
      createUnique: jest.fn(),
      getActivityStatsByUserIds: jest
        .fn()
        .mockResolvedValue(
          new Map([
            [
              studentId,
              {
                profileUpdates: 0,
                jobViews: 0,
                jobsSaved: 0,
                interviewsSaved: 0,
                applicationsSubmitted: 2,
                interviewsTaken: 2,
                interviewsCompleted: 1,
                resumesCreated: 1,
                resumesSaved: 1,
                atsScans: 1,
                bestInterviewScore: 90,
                averageInterviewScore: 85,
                interviewScoreEntries: 2,
                bestAtsScore: 88,
                averageAtsScore: 84,
                atsScoreEntries: 2,
              },
            ],
          ]),
        ),
    } as never;

    gamificationProfileRepository = {
      findByUserId: jest.fn(),
      findByUserIds: jest
        .fn()
        .mockResolvedValue(new Map([[studentId, { score: 120, xp: 300, level: 3 }]])),
      applyDelta: jest.fn(),
    } as never;

    studentRepository = {
      create: jest.fn(),
      findByStudentAndCollege: jest.fn(),
      upsertByStudentAndCollege: jest.fn(),
      findAllByStudentId: jest.fn(),
      findAllByCollegeId: jest.fn().mockResolvedValue({
        students: [
          {
            id: 'membership-1',
            studentId: { id: studentId, name: 'Student One', email: 's1@example.com' },
            program: 'BCA',
            year: 2,
          },
        ],
        total: 1,
      }),
      findStudentIdsByCollegeId: jest.fn(),
      findCollegeIdsByStudentId: jest.fn(),
      deleteByStudentAndCollege: jest.fn(),
      deleteManyByCollegeId: jest.fn(),
    } as never;

    studentService = {
      getMembershipByStudentAndCollege: jest.fn(),
      getMembershipByStudentAndCollegeOrThrow: jest.fn(),
      assertStudentMembership: jest.fn(),
      listStudentMemberships: jest.fn().mockResolvedValue({
        students: [
          {
            id: 'membership-1',
            collegeId: {
              id: collegeId,
              name: 'Tech College',
              logo: null,
              inviteCode: 'KC-ABCD',
            },
            program: 'BCA',
            year: 2,
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ],
        total: 1,
      }),
      listCollegeStudentIds: jest.fn().mockResolvedValue([studentId]),
      listStudentCollegeIds: jest.fn(),
      assignStudentToCollege: jest.fn().mockResolvedValue({ id: 'membership-1' } as never),
      removeStudentFromCollege: jest.fn().mockResolvedValue({ id: 'membership-1' } as never),
      removeAllByCollegeId: jest.fn().mockResolvedValue(3),
    } as never;

    userService = {
      getUserByIdRaw: jest.fn().mockResolvedValue({
        id: userId,
        name: 'College Owner',
        email: 'owner@example.com',
      } as never),
      getUserByEmail: jest.fn().mockResolvedValue(null),
    } as never;

    emailService = {
      sendCompanyInvite: jest.fn().mockResolvedValue(undefined),
    } as never;

    service = new CollegeService(
      configService,
      collegeRepository,
      jobPostingRepository,
      applicationRepository,
      userRepository,
      gamificationEventRepository,
      gamificationProfileRepository,
      studentRepository,
      studentService,
      userService,
      emailService,
    );
  });

  it('should create college and enforce role constraints', async () => {
    jest
      .spyOn(service as any, 'generateUniqueInviteCode')
      .mockResolvedValue('KC-UNIQUE');

    const created = await service.createCollege(
      { id: userId, role: UserRole.ADMIN },
      {
        name: 'Tech College',
      } as never,
    );
    expect(created).toEqual(expect.objectContaining({ id: collegeId }));

    await expectApiError(
      () =>
        service.createCollege(
          { id: userId, role: UserRole.USER },
          { name: 'Tech College' } as never,
        ),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.COLLEGE_ROLE_REQUIRED,
    );

    collegeRepository.findFirstByCreatedBy.mockResolvedValueOnce(collegeDoc as never);
    await expectApiError(
      () =>
        service.createCollege(
          { id: userId, role: UserRole.COLLEGE },
          { name: 'Tech College' } as never,
        ),
      HttpStatus.CONFLICT,
      'already has a college workspace',
    );
  });

  it('should update and delete college with validation', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);

    await expectApiError(
      () =>
        service.updateCollege(
          { id: userId, role: UserRole.COLLEGE },
          'bad-id',
          { name: 'Updated' } as never,
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    collegeRepository.updateById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateCollege(
          { id: userId, role: UserRole.COLLEGE },
          collegeId,
          { name: 'Updated' } as never,
        ),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.NOT_FOUND,
    );

    const updated = await service.updateCollege(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
      { name: 'Updated' } as never,
    );
    expect(updated).toEqual(expect.objectContaining({ id: collegeId }));

    await expectApiError(
      () => service.deleteCollege({ id: userId, role: UserRole.COLLEGE }, 'bad-id'),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    collegeRepository.deleteById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () => service.deleteCollege({ id: userId, role: UserRole.COLLEGE }, collegeId),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.NOT_FOUND,
    );
  });

  it('should list colleges and workspaces for different roles', async () => {
    const colleges = await service.listColleges({
      page: 1,
      size: 10,
    } as never);
    expect(colleges.colleges).toHaveLength(1);

    const collegeWorkspaces = await service.listStudentWorkspaces(
      { id: userId, role: UserRole.COLLEGE },
      { page: 1, size: 10 } as never,
    );
    expect(collegeWorkspaces.workspaces).toHaveLength(1);

    const studentWorkspaces = await service.listStudentWorkspaces(
      { id: studentId, role: UserRole.STUDENT },
      { page: 1, size: 10 } as never,
    );
    expect(studentWorkspaces.workspaces).toHaveLength(1);

    await expectApiError(
      () =>
        service.listStudentWorkspaces(
          { id: userId, role: UserRole.RECRUITER },
          { page: 1, size: 10 } as never,
        ),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );
  });

  it('should list college students and join by invite code', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);

    await expectApiError(
      () =>
        service.listCollegeStudents(
          { id: userId, role: UserRole.COLLEGE },
          'bad-id',
          { page: 1, size: 10 } as never,
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    const listed = await service.listCollegeStudents(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
      { page: 1, size: 10 } as never,
    );
    expect(listed.members).toHaveLength(1);

    await expectApiError(
      () =>
        service.joinCollegeByInviteCode(
          { id: userId, role: UserRole.COLLEGE },
          { inviteCode: 'KC-ABCD' } as never,
        ),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
    );

    collegeRepository.findByInviteCode.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.joinCollegeByInviteCode(
          { id: studentId, role: UserRole.STUDENT },
          { inviteCode: 'KC-ABCD' } as never,
        ),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.INVITE_CODE_INVALID,
    );

    collegeRepository.findByInviteCode.mockResolvedValueOnce(collegeDoc as never);
    const joined = await service.joinCollegeByInviteCode(
      { id: studentId, role: UserRole.STUDENT },
      { inviteCode: 'KC-ABCD', program: 'BCA', year: 2 } as never,
    );
    expect(joined.workspace.id).toBe(collegeId);
  });

  it('should reset invite code and invite students with membership checks', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'generateUniqueInviteCode')
      .mockResolvedValue('KC-RESET');

    const reset = await service.resetCollegeInviteCode(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
    );
    expect(reset.inviteCode).toBe('KC-ABCD');

    await expectApiError(
      () =>
        service.resetCollegeInviteCode(
          { id: userId, role: UserRole.COLLEGE },
          'bad-id',
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    userService.getUserByEmail.mockResolvedValueOnce({
      id: studentId,
      role: UserRole.RECRUITER,
    } as never);
    await expectApiError(
      () =>
        service.inviteStudentToCollege(
          { id: userId, role: UserRole.COLLEGE },
          collegeId,
          { email: 'recruiter@example.com' } as never,
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
    );

    userService.getUserByEmail.mockResolvedValueOnce({
      id: studentId,
      role: UserRole.USER,
    } as never);
    studentService.getMembershipByStudentAndCollege.mockResolvedValueOnce({
      id: 'membership-1',
    } as never);
    await expectApiError(
      () =>
        service.inviteStudentToCollege(
          { id: userId, role: UserRole.COLLEGE },
          collegeId,
          { email: 'student@example.com' } as never,
        ),
      HttpStatus.CONFLICT,
      COLLEGE_MESSAGES.INVITEE_ALREADY_IN_COLLEGE,
    );
  });

  it('should invite student and continue when email sending fails', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);
    collegeRepository.findById.mockResolvedValueOnce({
      ...collegeDoc,
      inviteCode: null,
    } as never);
    jest
      .spyOn(service as any, 'generateUniqueInviteCode')
      .mockResolvedValue('KC-NEWCODE');
    userService.getUserByEmail.mockResolvedValueOnce(null as never);
    emailService.sendCompanyInvite.mockRejectedValueOnce(new Error('smtp down'));

    const invited = await service.inviteStudentToCollege(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
      { email: 'student@example.com', program: 'BCA', year: 2 } as never,
    );

    expect(invited.emailSent).toBe(false);
    expect(invited.inviteCode).toBe('KC-NEWCODE');
    expect(invited.inviteLink).toContain('https://app.example.com/college-invites');
  });

  it('should fetch college by id, my college, and metrics', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);

    await expectApiError(
      () => service.getCollegeMetrics({ id: userId, role: UserRole.COLLEGE }, 'bad-id'),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    const metrics = await service.getCollegeMetrics(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
    );
    expect(metrics.summary.openCollegeJobs).toBe(1);
    expect(metrics.leaderboard).toHaveLength(1);

    const college = await service.getCollegeById(collegeId);
    expect(college).toEqual(expect.objectContaining({ id: collegeId }));

    const myCollege = await service.getMyCollege({ id: userId, role: UserRole.COLLEGE });
    expect(myCollege.college).toEqual(expect.objectContaining({ id: collegeId }));

    await expectApiError(
      () => service.getMyCollege({ id: userId, role: UserRole.USER }),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );

    collegeRepository.findFirstByCreatedBy.mockResolvedValueOnce(null as never);
    await expectApiError(
      () => service.getMyCollege({ id: userId, role: UserRole.COLLEGE }),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.NOT_FOUND,
    );
  });

  it('should support admin assign/remove student helpers', async () => {
    const assigned = await service.assignStudentToCollegeByAdmin({
      studentId,
      collegeId,
      program: 'BCA',
      year: 2,
    });
    expect(assigned.college).toEqual(expect.objectContaining({ id: collegeId }));

    const removed = await service.removeStudentFromCollegeByAdmin({
      studentId,
      collegeId,
    });
    expect(removed.studentProfile).toEqual(expect.objectContaining({ id: 'membership-1' }));

    const removedByCollege = await service.removeStudentFromCollege(
      { id: userId, role: UserRole.COLLEGE },
      { studentId, collegeId },
    );
    expect(removedByCollege.studentProfile).toEqual(
      expect.objectContaining({ id: 'membership-1' }),
    );
  });

  it('should validate getCollegeByIdRaw and manage-college authorization', async () => {
    await expectApiError(
      () => service.getCollegeByIdRaw('bad-id'),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    collegeRepository.findById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () => service.getCollegeByIdRaw(collegeId),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.NOT_FOUND,
    );

    await expect(service.assertCanManageCollege({ id: userId, role: UserRole.ADMIN }, collegeId)).resolves.toBeUndefined();

    await expectApiError(
      () => service.assertCanManageCollege({ id: userId, role: UserRole.USER }, collegeId),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );

    collegeRepository.findById.mockResolvedValueOnce({
      ...collegeDoc,
      createdBy: new Types.ObjectId(new Types.ObjectId().toString()),
    } as never);
    await expectApiError(
      () =>
        service.assertCanManageCollege(
          { id: userId, role: UserRole.COLLEGE },
          collegeId,
        ),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );
  });

  it('should cover private helpers for workspace/profile and invite generation', async () => {
    expect((service as any).buildWorkspaceSwitcherItem(null)).toBeNull();
    expect(
      (service as any).buildWorkspaceSwitcherItem({
        id: 'membership-1',
        collegeId: collegeId,
      }),
    ).toEqual(
      expect.objectContaining({
        college: expect.objectContaining({ id: collegeId }),
      }),
    );

    expect((service as any).buildStudentProfileResponse(null)).toBeNull();
    expect(
      (service as any).buildStudentProfileResponse({
        id: 'membership-1',
        studentId: studentId,
      }),
    ).toEqual(
      expect.objectContaining({
        student: expect.objectContaining({ id: studentId }),
      }),
    );

    const generateInviteCodeSpy = jest
      .spyOn(service as any, 'generateInviteCode')
      .mockReturnValue('KC-COLLIDE');
    collegeRepository.findByInviteCode
      .mockResolvedValueOnce({ id: 'exists' } as never)
      .mockResolvedValueOnce(null as never);
    await expect((service as any).generateUniqueInviteCode()).resolves.toBe(
      'KC-COLLIDE',
    );

    collegeRepository.findByInviteCode.mockResolvedValue({ id: 'exists' } as never);
    await expect((service as any).generateUniqueInviteCode()).rejects.toBeInstanceOf(
      ApiError,
    );

    generateInviteCodeSpy.mockRestore();
    const generated = (service as any).generateInviteCode();
    expect(generated).toMatch(/^KC-[A-F0-9]{8}$/);

    const inviteLink = (service as any).buildInviteLink(collegeId, 'KC-AB CD');
    expect(inviteLink).toContain('collegeId=');
    expect(inviteLink).toContain('inviteCode=KC-AB%20CD');
  });

  it('should build college workspaces fallback when college owner has none', async () => {
    collegeRepository.findFirstByCreatedBy.mockResolvedValueOnce(null as never);
    const workspaces = await service.listStudentWorkspaces(
      { id: userId, role: UserRole.COLLEGE },
      { page: 1, size: 10 } as never,
    );
    expect(workspaces.workspaces).toEqual([]);
  });

  it('should pass correct college-only visibility filter to jobs query in metrics', async () => {
    jest.spyOn(service, 'assertCanManageCollege').mockResolvedValue(undefined);
    await service.getCollegeMetrics(
      { id: userId, role: UserRole.COLLEGE },
      collegeId,
    );
    expect(jobPostingRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        collegeId,
        visibility: JobVisibility.COLLEGE_ONLY,
      }),
    );
  });
});
