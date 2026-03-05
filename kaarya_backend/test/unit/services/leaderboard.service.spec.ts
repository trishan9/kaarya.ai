import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { LEADERBOARD_MESSAGES } from 'src/constants/messages.constants';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACGamificationEventRepository } from 'src/repositories/gamification-event.repository';
import { ACGamificationProfileRepository } from 'src/repositories/gamification-profile.repository';
import { ACUserRepository } from 'src/repositories/user.repository';
import { LeaderboardService } from 'src/services/leaderboard.service';
import { CollegeService } from 'src/services/college.service';
import { StudentService } from 'src/services/student.service';
import { UserRole } from 'src/types/user-role.enum';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let userRepository: jest.Mocked<ACUserRepository>;
  let gamificationEventRepository: jest.Mocked<ACGamificationEventRepository>;
  let gamificationProfileRepository: jest.Mocked<ACGamificationProfileRepository>;
  let collegeService: jest.Mocked<CollegeService>;
  let studentService: jest.Mocked<StudentService>;

  beforeEach(() => {
    applicationRepository = {
      getLeaderboardStatsByStudentIds: jest.fn(),
    } as unknown as jest.Mocked<ACApplicationRepository>;

    userRepository = {
      findCandidateLeaderboardRows: jest.fn(),
      findById: jest.fn(),
      countCandidatesAheadOfUser: jest.fn(),
    } as unknown as jest.Mocked<ACUserRepository>;

    gamificationEventRepository = {
      getActivityStatsByUserIds: jest.fn(),
    } as unknown as jest.Mocked<ACGamificationEventRepository>;

    gamificationProfileRepository = {
      findByUserIds: jest.fn(),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<ACGamificationProfileRepository>;

    collegeService = {
      getCollegeByIdRaw: jest.fn(),
      assertCanManageCollege: jest.fn(),
      getMyCollege: jest.fn(),
    } as unknown as jest.Mocked<CollegeService>;

    studentService = {
      listCollegeStudentIds: jest.fn(),
      assertStudentMembership: jest.fn(),
    } as unknown as jest.Mocked<StudentService>;

    service = new LeaderboardService(
      applicationRepository,
      userRepository,
      gamificationEventRepository,
      gamificationProfileRepository,
      collegeService,
      studentService,
    );
  });

  const setupLeaderboardData = () => {
    userRepository.findCandidateLeaderboardRows.mockResolvedValue({
      users: [
        {
          id: 's1',
          name: 'Student One',
          photo: null,
          email: 's1@example.com',
        },
      ],
      total: 1,
    } as never);
    applicationRepository.getLeaderboardStatsByStudentIds.mockResolvedValue(
      new Map([
        [
          's1',
          {
            applications: 5,
            interviewScheduled: 2,
            accepted: 1,
            shortlisted: 1,
            rejected: 1,
          },
        ],
      ]) as never,
    );
    gamificationEventRepository.getActivityStatsByUserIds.mockResolvedValue(
      new Map([
        [
          's1',
          {
            profileUpdates: 1,
            jobViews: 2,
            jobsSaved: 3,
            interviewsSaved: 1,
            applicationsSubmitted: 2,
            interviewsTaken: 2,
            interviewsCompleted: 1,
            resumesCreated: 1,
            resumesSaved: 1,
            atsScans: 1,
            bestInterviewScore: 88,
            averageInterviewScore: 81.5,
            interviewScoreEntries: 2,
            bestAtsScore: 79,
            averageAtsScore: 73.4,
            atsScoreEntries: 2,
          },
        ],
      ]) as never,
    );
    gamificationProfileRepository.findByUserIds.mockResolvedValue(
      new Map([
        [
          's1',
          {
            xp: 600,
            score: 90,
            level: 3,
          },
        ],
      ]) as never,
    );
  };

  it('should reject recruiter college scope', async () => {
    await expectApiError(
      () =>
        service.getLeaderboard(
          { id: 'r1', role: UserRole.RECRUITER } as never,
          { scope: 'college', page: 1, size: 20 } as never,
        ),
      HttpStatus.FORBIDDEN,
      LEADERBOARD_MESSAGES.FORBIDDEN,
    );
  });

  it('should return global leaderboard with current user summary', async () => {
    setupLeaderboardData();
    userRepository.findById.mockResolvedValue({
      id: 's1',
      name: 'Student One',
      email: 's1@example.com',
      photo: null,
    } as never);
    gamificationProfileRepository.findByUserId.mockResolvedValue({
      xp: 600,
      score: 90,
      level: 3,
    } as never);
    userRepository.countCandidatesAheadOfUser.mockResolvedValue(0);

    const result = await service.getLeaderboard(
      { id: 's1', role: UserRole.STUDENT } as never,
      { scope: 'global', page: 1, size: 20 } as never,
    );

    expect(result.scope).toBe('global');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        xp: 600,
        score: 90,
        student: expect.objectContaining({ id: 's1' }),
      }),
    );
    expect(result.me).toEqual(
      expect.objectContaining({
        rank: 1,
        xp: 600,
        score: 90,
        student: expect.objectContaining({ id: 's1' }),
      }),
    );
  });

  it('should return college leaderboard for college role', async () => {
    setupLeaderboardData();
    collegeService.getMyCollege.mockResolvedValue({
      college: { id: 'c1' },
    } as never);
    studentService.listCollegeStudentIds.mockResolvedValue(['s1']);
    collegeService.getCollegeByIdRaw.mockResolvedValue({
      id: 'c1',
      name: 'College One',
      logo: null,
    } as never);

    const result = await service.getLeaderboard(
      { id: 'college-user', role: UserRole.COLLEGE } as never,
      { scope: 'global', page: 1, size: 20 } as never,
    );

    expect(result.scope).toBe('college');
    expect(result.workspace).toEqual({
      id: 'c1',
      name: 'College One',
      logo: null,
    });
    expect(result.me).toBeNull();
  });

  it('should resolve college scope for admin and student users', async () => {
    setupLeaderboardData();
    studentService.listCollegeStudentIds.mockResolvedValue(['s1']);
    collegeService.getCollegeByIdRaw.mockResolvedValue({
      id: 'c1',
      name: 'College One',
      logo: 'logo',
    } as never);
    userRepository.findById.mockResolvedValue({
      id: 's1',
      name: 'Student One',
      email: 's1@example.com',
      photo: null,
    } as never);
    gamificationProfileRepository.findByUserId.mockResolvedValue({
      xp: 100,
      score: 10,
      level: 1,
    } as never);
    userRepository.countCandidatesAheadOfUser.mockResolvedValue(5);

    const adminResult = await service.getLeaderboard(
      { id: 'admin', role: UserRole.ADMIN } as never,
      { scope: 'college', collegeId: 'c1', page: 1, size: 20 } as never,
    );
    expect(adminResult.scope).toBe('college');

    const studentResult = await service.getLeaderboard(
      { id: 's1', role: UserRole.STUDENT } as never,
      { scope: 'college', collegeId: 'c1', page: 1, size: 20 } as never,
    );
    expect(studentService.assertStudentMembership).toHaveBeenCalledWith({
      studentId: 's1',
      collegeId: 'c1',
    });
    expect(studentResult.me).toEqual(expect.objectContaining({ rank: 6 }));
  });

  it('should throw when college scope cannot be resolved', async () => {
    await expectApiError(
      () =>
        service.getLeaderboard(
          { id: 'u1', role: UserRole.USER } as never,
          { scope: 'college', page: 1, size: 20 } as never,
        ),
      HttpStatus.BAD_REQUEST,
    );

    collegeService.getMyCollege.mockResolvedValue({
      college: null,
    } as never);
    await expectApiError(
      () =>
        service.getLeaderboard(
          { id: 'c1', role: UserRole.COLLEGE } as never,
          { scope: 'global', page: 1, size: 20 } as never,
        ),
      HttpStatus.NOT_FOUND,
    );
  });

  it('should return null current-user summary for non candidates or missing users', async () => {
    setupLeaderboardData();
    const internal = service as any;

    await expect(
      internal.buildCurrentUserSummary({ id: 'a1', role: UserRole.ADMIN }),
    ).resolves.toBeNull();

    userRepository.findById.mockResolvedValueOnce(null as never);
    await expect(
      internal.buildCurrentUserSummary({ id: 's1', role: UserRole.STUDENT }),
    ).resolves.toBeNull();

    userRepository.findById.mockResolvedValue({
      id: 's1',
      name: 'Student One',
      email: 's1@example.com',
      photo: null,
    } as never);
    gamificationProfileRepository.findByUserId.mockResolvedValue({
      xp: 10,
      score: 1,
      level: 1,
    } as never);
    await expect(
      internal.buildCurrentUserSummary(
        { id: 's1', role: UserRole.STUDENT },
        { candidateIds: ['x'] },
      ),
    ).resolves.toBeNull();
    await expect(
      internal.buildCurrentUserSummary(
        { id: 's1', role: UserRole.STUDENT },
        { candidateIds: [] },
      ),
    ).resolves.toBeNull();
  });

  it('should ignore invalid gamification stats and fallback to defaults', async () => {
    userRepository.findCandidateLeaderboardRows.mockResolvedValue({
      users: [{ id: 's1', name: null, photo: null, email: null }],
      total: 1,
    } as never);
    applicationRepository.getLeaderboardStatsByStudentIds.mockResolvedValue(
      new Map() as never,
    );
    gamificationEventRepository.getActivityStatsByUserIds.mockResolvedValue(
      new Map() as never,
    );
    gamificationProfileRepository.findByUserIds.mockResolvedValue(
      new Map([['s1', { xp: Number.NaN, score: Number.NaN, level: Number.NaN }]]) as never,
    );
    userRepository.findById.mockResolvedValue({
      id: 's1',
      name: null,
      email: null,
      photo: null,
    } as never);
    gamificationProfileRepository.findByUserId.mockResolvedValue({
      xp: Number.NaN,
      score: Number.NaN,
      level: Number.NaN,
    } as never);
    userRepository.countCandidatesAheadOfUser.mockResolvedValue(0);

    const result = await service.getLeaderboard(
      { id: 's1', role: UserRole.STUDENT } as never,
      { scope: 'global', page: 1, size: 20 } as never,
    );

    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        xp: 0,
        score: 0,
        level: 1,
      }),
    );
    expect(result.me).toEqual(
      expect.objectContaining({
        xp: 0,
        score: 0,
        level: 1,
      }),
    );
  });
});

async function expectApiError(
  fn: () => Promise<unknown>,
  status: number,
  message?: string,
) {
  try {
    await fn();
  } catch (error) {
    const apiError = error as ApiError;
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.getStatus()).toBe(status);
    if (message) {
      expect(apiError.getResponse()).toEqual(
        expect.objectContaining({ message }),
      );
    }
    return;
  }

  throw new Error('Expected ApiError');
}
