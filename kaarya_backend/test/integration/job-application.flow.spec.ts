import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import {
  COLLEGE_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { CollegeService } from 'src/services/college.service';
import { JobApplicationService } from 'src/services/job-application.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import {
  clearDatabase,
  startInMemoryMongo,
  stopInMemoryMongo,
  TestMongo,
} from '../helpers/mongo';

describe('Job Application flow (integration)', () => {
  let module: TestingModule | undefined;
  let mongo: TestMongo | undefined;
  let userService: UserService;
  let collegeService: CollegeService;
  let jobPostingService: JobPostingService;
  let jobApplicationService: JobApplicationService;

  const toAuthUser = (
    user: { id: string; email: string | null },
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
    collegeService = module.get(CollegeService);
    jobPostingService = module.get(JobPostingService);
    jobApplicationService = module.get(JobApplicationService);
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

  it('should complete resume + application + status + activity lifecycle', async () => {
    const collegeOwner = await userService.createUser({
      name: 'Lifecycle College Owner',
      email: 'lifecycle.college.owner@example.com',
      role: UserRole.COLLEGE,
    });
    const student = await userService.createUser({
      name: 'Lifecycle Student',
      email: 'lifecycle.student@example.com',
      role: UserRole.STUDENT,
    });

    const collegeOwnerAuth = toAuthUser(collegeOwner, UserRole.COLLEGE);
    const studentAuth = toAuthUser(student, UserRole.STUDENT);

    const college = await collegeService.createCollege(collegeOwnerAuth, {
      name: 'Lifecycle College Workspace',
      institutionType: 'Engineering College',
      location: 'Kathmandu',
    });
    if (!college) {
      throw new Error('Expected college workspace');
    }

    await collegeService.joinCollegeByInviteCode(studentAuth, {
      inviteCode: college.inviteCode as string,
      program: 'BSc CSIT',
      year: 4,
    });

    const job = await jobPostingService.createJobPosting(collegeOwnerAuth, {
      title: 'Lifecycle Campus Role',
      description:
        'Hands-on backend role focused on API design and production reliability.',
      deadline: new Date('2032-01-01T00:00:00.000Z'),
      requirements: { skills: ['Node.js', 'NestJS'] },
    });
    const jobId = (job as { id?: string }).id;
    if (!jobId) {
      throw new Error('Expected job id');
    }

    const resume = await jobApplicationService.uploadMyResume(studentAuth, {
      resumeFileName: 'resume.pdf',
      resumeUrl: 'https://files.test/resume.pdf',
      resumePublicId: 'resumes/public-id',
      resumeMimeType: 'application/pdf',
      resumeFileSize: 2048,
    });
    const uploadedResumeId = (resume as { id?: string }).id;
    if (!uploadedResumeId) {
      throw new Error('Expected resume id');
    }

    const createdApplication = await jobApplicationService.createJobApplication(
      studentAuth,
      jobId,
      {
        resumeId: uploadedResumeId,
        coverLetter: 'I am excited to contribute to backend platform work.',
        portfolioLinks: ['https://portfolio.example.com'],
      },
    );

    expect(createdApplication).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: 'applied',
      }),
    );

    const applicationId = (createdApplication as { id?: string }).id;
    if (!applicationId) {
      throw new Error('Expected application id');
    }

    const myResumes = await jobApplicationService.listMyResumes(studentAuth, {
      page: 1,
      size: 10,
    });
    expect(myResumes.meta.totalItems).toBeGreaterThanOrEqual(1);

    const byJob = await jobApplicationService.getMyApplicationForJob(
      studentAuth,
      jobId,
    );
    expect(byJob).toEqual(
      expect.objectContaining({
        id: applicationId,
      }),
    );

    const myApplications = await jobApplicationService.getMyApplications(
      studentAuth,
      {
        page: 1,
        size: 10,
        status: 'applied',
      } as never,
    );
    expect(myApplications.meta.totalItems).toBeGreaterThanOrEqual(1);

    const summary = await jobApplicationService.getMyApplicationsSummary(
      studentAuth,
      {
        month: '2026-02',
        statuses: ['applied'],
      } as never,
    );
    expect(summary.summary.total).toBeGreaterThanOrEqual(1);

    const jobApplications = await jobApplicationService.getJobApplications(
      collegeOwnerAuth,
      jobId,
      { page: 1, size: 10 } as never,
    );
    expect(jobApplications.meta.totalItems).toBeGreaterThanOrEqual(1);

    const updatedApplication = await jobApplicationService.updateJobApplication(
      collegeOwnerAuth,
      jobId,
      applicationId,
      {
        interviewScheduledAt: new Date('2032-01-05T00:00:00.000Z'),
        interviewNote: 'Be ready for API design questions.',
      } as never,
    );
    expect(updatedApplication).toEqual(
      expect.objectContaining({
        id: applicationId,
        status: 'interview_scheduled',
      }),
    );

    const viewed = await jobApplicationService.updateApplicationResumeActivity(
      collegeOwnerAuth,
      jobId,
      applicationId,
      { action: 'viewed' },
    );
    expect(viewed).toEqual(
      expect.objectContaining({
        id: applicationId,
      }),
    );

    const downloaded =
      await jobApplicationService.updateApplicationResumeActivity(
        collegeOwnerAuth,
        jobId,
        applicationId,
        { action: 'downloaded' },
      );
    expect(downloaded).toEqual(
      expect.objectContaining({
        id: applicationId,
      }),
    );

    await expectApiError(
      jobApplicationService.deleteMyResume(studentAuth, uploadedResumeId),
      HttpStatus.BAD_REQUEST,
      'This resume is already used in one or more job applications and cannot be deleted.',
    );
  });

  it('should forbid outsider students from applying to college-only jobs', async () => {
    const collegeOwner = await userService.createUser({
      name: 'Access College Owner',
      email: 'access.college.owner@example.com',
      role: UserRole.COLLEGE,
    });
    const insider = await userService.createUser({
      name: 'Insider Student',
      email: 'insider.student@example.com',
      role: UserRole.STUDENT,
    });
    const outsider = await userService.createUser({
      name: 'Outsider Student',
      email: 'outsider.student@example.com',
      role: UserRole.STUDENT,
    });

    const collegeOwnerAuth = toAuthUser(collegeOwner, UserRole.COLLEGE);
    const insiderAuth = toAuthUser(insider, UserRole.STUDENT);
    const outsiderAuth = toAuthUser(outsider, UserRole.STUDENT);

    const college = await collegeService.createCollege(collegeOwnerAuth, {
      name: 'Access College Workspace',
    });
    if (!college) {
      throw new Error('Expected college workspace');
    }

    await collegeService.joinCollegeByInviteCode(insiderAuth, {
      inviteCode: college.inviteCode as string,
      program: 'BIT',
      year: 2,
    });

    const job = await jobPostingService.createJobPosting(collegeOwnerAuth, {
      title: 'College-only QA Role',
      description: 'Role available only for students in the joined workspace.',
      deadline: new Date('2033-01-01T00:00:00.000Z'),
      requirements: { skills: ['Testing'] },
    });

    const jobId = (job as { id?: string }).id;
    if (!jobId) {
      throw new Error('Expected job id');
    }

    await expectApiError(
      jobApplicationService.createJobApplication(outsiderAuth, jobId, {
        resumeUrl: 'https://files.test/outsider.pdf',
        resumeFileName: 'outsider.pdf',
        resumeMimeType: 'application/pdf',
      }),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );

    await expectApiError(
      jobApplicationService.getMyApplicationForJob(insiderAuth, 'invalid-id'),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );
  });
});
