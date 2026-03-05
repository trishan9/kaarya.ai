import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import {
  BOOKMARK_MESSAGES,
  COMPANY_MESSAGES,
  INTERVIEW_MESSAGES,
} from 'src/constants/messages.constants';
import { BookmarkService } from 'src/services/bookmark.service';
import { CompanyService } from 'src/services/company.service';
import { InterviewService } from 'src/services/interview.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { UserService } from 'src/services/user.service';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('Interview + Bookmark flow (integration)', () => {
  let module: TestingModule | undefined;
  let mongo: TestMongo | undefined;
  let userService: UserService;
  let companyService: CompanyService;
  let jobPostingService: JobPostingService;
  let interviewService: InterviewService;
  let bookmarkService: BookmarkService;

  const toAuthUser = (
    user: { id: string; email?: string | null },
    role: UserRole,
  ) => ({
    id: user.id,
    role,
    email: user.email ?? undefined,
  });

  const expectApiError = async (
    promise: Promise<unknown>,
    status: HttpStatus,
    message: string,
  ) => {
    try {
      await promise;
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(status);
      expect(apiError.getResponse()).toMatchObject({ message });
    }
  };

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userService = module.get(UserService);
    companyService = module.get(CompanyService);
    jobPostingService = module.get(JobPostingService);
    interviewService = module.get(InterviewService);
    bookmarkService = module.get(BookmarkService);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
  });

  it('should complete bookmark + interview session flow through service layer', async () => {
    const recruiter = await userService.createUser({
      name: 'Integration Recruiter',
      email: 'integration.recruiter.bookmark@example.com',
      role: UserRole.RECRUITER,
    });
    const student = await userService.createUser({
      name: 'Integration Student',
      email: 'integration.student.bookmark@example.com',
      role: UserRole.STUDENT,
    });

    const recruiterAuth = toAuthUser(recruiter, UserRole.RECRUITER);
    const studentAuth = toAuthUser(student, UserRole.STUDENT);

    const workspace = await companyService.createCompany(recruiterAuth, {
      name: 'Interview Bookmark Workspace',
      industry: 'Technology',
    });
    if (!workspace) {
      throw new Error('Expected company workspace');
    }

    const job = await jobPostingService.createJobPosting(recruiterAuth, {
      companyId: workspace.id as string,
      title: 'Integration Platform Engineer',
      description: 'Own platform reliability and backend scalability.',
      deadline: new Date('2032-01-01T00:00:00.000Z'),
      requirements: { skills: ['Node.js', 'NestJS'] },
      workMode: JobWorkMode.REMOTE,
    });
    if (!job) {
      throw new Error('Expected job posting');
    }
    const jobId = (job as { id?: string }).id;
    if (!jobId) {
      throw new Error('Expected job id');
    }

    const interview = await interviewService.createInterview(recruiterAuth, {
      title: 'Platform Engineer Interview',
      interviewType: InterviewType.TECHNICAL,
      role: 'Platform Engineer',
      companyId: workspace.id as string,
      visibility: InterviewVisibility.PUBLIC,
      status: InterviewStatus.PUBLISHED,
      questionCount: 3,
      durationMinutes: 20,
      generateQuestions: false,
      questions: [
        'Describe a complex distributed-system incident you handled.',
        'How would you tune an API service for high throughput?',
        'Explain your approach to observability in production systems.',
      ],
      techStack: ['Node.js', 'NestJS'],
      tags: ['backend', 'platform'],
    });
    if (!interview) {
      throw new Error('Expected interview');
    }
    const interviewId = (interview as { id?: string }).id;
    if (!interviewId) {
      throw new Error('Expected interview id');
    }

    const savedJob = await bookmarkService.saveJob(studentAuth, jobId);
    expect(savedJob).toEqual(
      expect.objectContaining({
        entityType: 'job',
        entityId: jobId,
      }),
    );

    const savedInterview = await bookmarkService.saveInterview(
      studentAuth,
      interviewId,
    );
    expect(savedInterview).toEqual(
      expect.objectContaining({
        entityType: 'interview',
        entityId: interviewId,
      }),
    );

    const allBookmarks = await bookmarkService.listMyBookmarks(studentAuth, {
      type: 'all',
      sortBy: 'saved_at_desc',
    } as never);
    expect(allBookmarks.counts.total).toBe(2);
    expect(allBookmarks.counts.jobs).toBe(1);
    expect(allBookmarks.counts.interviews).toBe(1);

    const jobBookmarks = await bookmarkService.listMyBookmarks(studentAuth, {
      type: 'jobs',
      search: 'platform engineer',
      sortBy: 'saved_at_asc',
    } as never);
    expect(jobBookmarks.counts.jobs).toBe(1);
    expect(jobBookmarks.counts.interviews).toBe(0);

    const sessionStart = await interviewService.startInterviewSession(
      studentAuth,
      interviewId,
      {
        mode: 'web',
        metadata: { source: 'integration' },
      } as never,
    );
    if (!sessionStart.session?.id) {
      throw new Error('Expected session id');
    }
    const sessionId = String(sessionStart.session.id);
    expect(sessionStart.session).toEqual(
      expect.objectContaining({ status: 'in_progress' }),
    );

    const completed = await interviewService.completeInterviewSession(
      studentAuth,
      interviewId,
      sessionId,
      {
        status: 'completed',
        generateEvaluation: false,
        transcript: [
          { role: 'assistant', content: 'Tell me about your last project.' },
          { role: 'user', content: 'I led a service reliability migration.' },
        ],
      } as never,
    );
    expect(completed.session).toEqual(
      expect.objectContaining({ status: 'completed' }),
    );
    expect(completed.evaluation).toBeNull();

    const sessions = await interviewService.listMyInterviewSessions(
      studentAuth,
      interviewId,
      { page: 1, size: 10 },
    );
    expect(sessions.sessions.length).toBeGreaterThanOrEqual(1);

    const analytics = await interviewService.getInterviewAnalytics(
      recruiterAuth,
      interviewId,
      { page: 1, size: 10 },
    );
    expect(analytics.summary.totalSessions).toBeGreaterThanOrEqual(1);

    await expectApiError(
      interviewService.getSessionFeedback(studentAuth, sessionId),
      HttpStatus.NOT_FOUND,
      INTERVIEW_MESSAGES.EVALUATION_NOT_FOUND,
    );

    const removedJob = await bookmarkService.removeSavedJob(
      studentAuth,
      jobId,
    );
    expect(removedJob).toEqual(
      expect.objectContaining({ removed: true, entityType: 'job' }),
    );

    const removedInterview = await bookmarkService.removeSavedInterview(
      studentAuth,
      interviewId,
    );
    expect(removedInterview).toEqual(
      expect.objectContaining({ removed: true, entityType: 'interview' }),
    );
  });

  it('should reject bookmark operations for non-candidate roles', async () => {
    const recruiter = await userService.createUser({
      name: 'Bookmark Forbidden Recruiter',
      email: 'bookmark.forbidden.recruiter@example.com',
      role: UserRole.RECRUITER,
    });

    await expectApiError(
      bookmarkService.listMyBookmarks(toAuthUser(recruiter, UserRole.RECRUITER), {
        type: 'all',
      } as never),
      HttpStatus.FORBIDDEN,
      BOOKMARK_MESSAGES.FORBIDDEN,
    );
  });

  it('should enforce interview update/delete management lifecycle', async () => {
    const ownerRecruiter = await userService.createUser({
      name: 'Interview Owner Recruiter',
      email: 'interview.owner.recruiter@example.com',
      role: UserRole.RECRUITER,
    });
    const teammateRecruiter = await userService.createUser({
      name: 'Interview Teammate Recruiter',
      email: 'interview.teammate.recruiter@example.com',
      role: UserRole.RECRUITER,
    });
    const outsiderRecruiter = await userService.createUser({
      name: 'Interview Outsider Recruiter',
      email: 'interview.outsider.recruiter@example.com',
      role: UserRole.RECRUITER,
    });
    const admin = await userService.createUser({
      name: 'Interview Admin',
      email: 'interview.admin@example.com',
      role: UserRole.ADMIN,
    });

    const ownerAuth = toAuthUser(ownerRecruiter, UserRole.RECRUITER);
    const teammateAuth = toAuthUser(teammateRecruiter, UserRole.RECRUITER);
    const outsiderAuth = toAuthUser(outsiderRecruiter, UserRole.RECRUITER);
    const adminAuth = toAuthUser(admin, UserRole.ADMIN);

    const workspace = await companyService.createCompany(ownerAuth, {
      name: 'Interview Management Workspace',
      industry: 'Technology',
    });
    if (!workspace) {
      throw new Error('Expected workspace');
    }

    await companyService.joinCompanyByInviteCode(teammateAuth, {
      inviteCode: workspace.inviteCode as string,
    });

    const createdInterview = await interviewService.createInterview(ownerAuth, {
      title: 'Interview Management Flow',
      interviewType: InterviewType.TECHNICAL,
      role: 'Backend Engineer',
      techStack: ['Node.js', 'NestJS'],
      companyId: workspace.id as string,
      visibility: InterviewVisibility.PUBLIC,
      status: InterviewStatus.PUBLISHED,
      questionCount: 2,
      durationMinutes: 15,
      tags: ['management'],
      generateQuestions: false,
      questions: [
        'How do you debug production API latency?',
        'How do you design safe database migrations?',
      ],
    });
    const interviewId = (createdInterview as { id?: string }).id;
    if (!interviewId) {
      throw new Error('Expected interview id');
    }

    await expectApiError(
      interviewService.updateInterview(outsiderAuth, interviewId, {
        title: 'Outsider should not update',
      } as never),
      HttpStatus.FORBIDDEN,
      COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );

    const updatedByTeammate = await interviewService.updateInterview(
      teammateAuth,
      interviewId,
      {
        title: 'Updated by Workspace Teammate',
        durationMinutes: 25,
      } as never,
    );
    expect(updatedByTeammate).toEqual(
      expect.objectContaining({
        id: interviewId,
        title: 'Updated by Workspace Teammate',
        durationMinutes: 25,
      }),
    );

    const deletedByAdmin = await interviewService.deleteInterview(
      adminAuth,
      interviewId,
    );
    expect(deletedByAdmin).toEqual(
      expect.objectContaining({
        id: interviewId,
      }),
    );

    await expectApiError(
      interviewService.getInterviewById(ownerAuth, interviewId),
      HttpStatus.NOT_FOUND,
      INTERVIEW_MESSAGES.NOT_FOUND,
    );
  });
});
