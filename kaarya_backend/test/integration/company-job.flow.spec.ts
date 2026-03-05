import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import {
  COMPANY_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { CompanyService } from 'src/services/company.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('Company + Job flow (integration)', () => {
  let module: TestingModule | undefined;
  let userService: UserService;
  let companyService: CompanyService;
  let jobPostingService: JobPostingService;
  let mongo: TestMongo | undefined;

  const toAuthUser = (user: { id: string; email: string | null }, role: UserRole) => ({
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

  it('should support recruiter company creation, invite by code, and workspace listing', async () => {
    const recruiterOwner = await userService.createUser({
      name: 'Owner Recruiter',
      email: 'owner.recruiter@example.com',
      role: UserRole.RECRUITER,
    });
    const recruiterJoiner = await userService.createUser({
      name: 'Joiner Recruiter',
      email: 'joiner.recruiter@example.com',
      role: UserRole.RECRUITER,
    });

    const createdCompany = await companyService.createCompany(
      toAuthUser(recruiterOwner, UserRole.RECRUITER),
      {
        name: 'Integration Workspace',
        industry: 'Tech',
      },
    );
    if (!createdCompany) {
      throw new Error('Expected created company');
    }

    expect(createdCompany).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Integration Workspace',
        inviteCode: expect.stringMatching(/^KR-/),
      }),
    );

    const joinResult = await companyService.joinCompanyByInviteCode(
      toAuthUser(recruiterJoiner, UserRole.RECRUITER),
      {
        inviteCode: createdCompany.inviteCode as string,
      },
    );
    expect(joinResult.workspace.id).toBe(createdCompany.id);

    const ownerWorkspaces = await companyService.listRecruiterWorkspaces(
      toAuthUser(recruiterOwner, UserRole.RECRUITER),
      { page: 1, size: 10 },
    );
    expect(ownerWorkspaces.workspaces.length).toBeGreaterThanOrEqual(1);

    const members = await companyService.listCompanyRecruiters(
      toAuthUser(recruiterOwner, UserRole.RECRUITER),
      createdCompany.id as string,
      { page: 1, size: 10 },
    );
    expect(members.members.length).toBeGreaterThanOrEqual(2);
  });

  it('should build invite email payload with inviteCode and join link', async () => {
    const recruiterOwner = await userService.createUser({
      name: 'Owner Two',
      email: 'owner.two@example.com',
      role: UserRole.RECRUITER,
    });

    const createdCompany = await companyService.createCompany(
      toAuthUser(recruiterOwner, UserRole.RECRUITER),
      {
        name: 'Invite Workspace',
      },
    );
    if (!createdCompany) {
      throw new Error('Expected created company');
    }

    const invite = await companyService.inviteRecruiterToCompany(
      toAuthUser(recruiterOwner, UserRole.RECRUITER),
      createdCompany.id as string,
      {
        email: 'future.recruiter@example.com',
        designation: 'Talent Partner',
      },
    );

    expect(invite).toEqual(
      expect.objectContaining({
        inviteeEmail: 'future.recruiter@example.com',
        inviteCode: expect.stringMatching(/^KR-/),
        inviteLink: expect.stringContaining('company-invites?companyId='),
        emailSent: expect.any(Boolean),
      }),
    );
  });

  it('should enforce workspace-based authorization for job creation and listing', async () => {
    const owner = await userService.createUser({
      name: 'Owner',
      email: 'owner.jobs@example.com',
      role: UserRole.RECRUITER,
    });
    const outsiderRecruiter = await userService.createUser({
      name: 'Outsider',
      email: 'outsider.jobs@example.com',
      role: UserRole.RECRUITER,
    });
    const student = await userService.createUser({
      name: 'Student',
      email: 'student.jobs@example.com',
      role: UserRole.STUDENT,
    });

    const company = await companyService.createCompany(
      toAuthUser(owner, UserRole.RECRUITER),
      {
        name: 'Jobs Workspace',
      },
    );
    if (!company) {
      throw new Error('Expected created company');
    }

    const createdJob = await jobPostingService.createJobPosting(
      toAuthUser(owner, UserRole.RECRUITER),
      {
        companyId: company.id as string,
        title: 'Integration Backend Engineer',
        description: 'Build robust APIs and maintain production services.',
        deadline: new Date('2031-01-01T00:00:00.000Z'),
        requirements: { skills: ['NestJS'] },
      },
    );
    expect(createdJob).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        companyId: company.id,
      }),
    );

    await expectApiError(
      jobPostingService.createJobPosting(
        toAuthUser(outsiderRecruiter, UserRole.RECRUITER),
        {
          companyId: company.id as string,
          title: 'Unauthorized Job',
          description: 'Should fail because recruiter is not in workspace.',
          deadline: new Date('2031-01-02T00:00:00.000Z'),
          requirements: {},
        },
      ),
      HttpStatus.FORBIDDEN,
      COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );

    const studentJobs = await jobPostingService.getAllJobPostings(
      toAuthUser(student, UserRole.STUDENT),
      { page: 1, size: 10, feed: JobFeedFilter.FOR_YOU },
    );
    expect(studentJobs.activeFeed).toBe(JobFeedFilter.FOR_YOU);
    expect(Array.isArray(studentJobs.jobs)).toBe(true);
  });

  it('should block join-by-code for non recruiter role', async () => {
    const owner = await userService.createUser({
      name: 'Owner Three',
      email: 'owner.three@example.com',
      role: UserRole.RECRUITER,
    });
    const student = await userService.createUser({
      name: 'Student Three',
      email: 'student.three@example.com',
      role: UserRole.STUDENT,
    });

    const company = await companyService.createCompany(
      toAuthUser(owner, UserRole.RECRUITER),
      { name: 'Strict Workspace' },
    );
    if (!company) {
      throw new Error('Expected created company');
    }

    await expectApiError(
      companyService.joinCompanyByInviteCode(
        toAuthUser(student, UserRole.STUDENT),
        {
          inviteCode: company.inviteCode as string,
        },
      ),
      HttpStatus.FORBIDDEN,
      COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should cover company management lifecycle methods', async () => {
    const owner = await userService.createUser({
      name: 'Lifecycle Owner',
      email: 'lifecycle.owner@example.com',
      role: UserRole.RECRUITER,
    });
    const admin = await userService.createUser({
      name: 'Lifecycle Admin',
      email: 'lifecycle.admin@example.com',
      role: UserRole.ADMIN,
    });

    const ownerAuth = toAuthUser(owner, UserRole.RECRUITER);
    const adminAuth = toAuthUser(admin, UserRole.ADMIN);

    const createdCompany = await companyService.createCompany(ownerAuth, {
      name: 'Lifecycle Workspace',
      industry: 'Software',
    });
    if (!createdCompany) {
      throw new Error('Expected created company');
    }

    const companyId = createdCompany.id as string;
    expect(companyId).toBeTruthy();

    const me = await companyService.getMyCompany(ownerAuth);
    expect(me.company).toEqual(
      expect.objectContaining({
        id: companyId,
      }),
    );

    const byId = await companyService.getCompanyById(companyId);
    expect(byId?.id).toBe(companyId);

    const updated = await companyService.updateCompany(ownerAuth, companyId, {
      location: 'Remote',
    });
    expect(updated).toEqual(
      expect.objectContaining({
        id: companyId,
        location: 'Remote',
      }),
    );

    const resetInviteCode = await companyService.resetCompanyInviteCode(
      ownerAuth,
      companyId,
    );
    expect(resetInviteCode.inviteCode).toMatch(/^KR-/);

    const listed = await companyService.listCompanies({
      page: 1,
      size: 10,
      search: 'Lifecycle Workspace',
    });
    const listedIds = listed.companies.map((company) => String(company.id));
    expect(listedIds).toContain(companyId);

    const deleted = await companyService.deleteCompany(adminAuth, companyId);
    expect(deleted?.id).toBe(companyId);

    await expectApiError(
      companyService.getCompanyById(companyId),
      HttpStatus.NOT_FOUND,
      COMPANY_MESSAGES.NOT_FOUND,
    );
  });

  it('should reject metrics and job lookup for invalid ids', async () => {
    await expectApiError(
      jobPostingService.getJobPostingById(
        {
          id: '507f191e810c19729de860ef',
          role: UserRole.STUDENT,
        },
        'invalid',
      ),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );
    await expectApiError(
      jobPostingService.getJobPostingMetrics('invalid'),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );
  });
});

