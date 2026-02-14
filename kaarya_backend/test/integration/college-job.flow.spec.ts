import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import {
  COLLEGE_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { CollegeService } from 'src/services/college.service';
import { CompanyService } from 'src/services/company.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { UserService } from 'src/services/user.service';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import {
  clearDatabase,
  startInMemoryMongo,
  stopInMemoryMongo,
  TestMongo,
} from '../helpers/mongo';

describe('College + Student + Job flow (integration)', () => {
  let module: TestingModule | undefined;
  let userService: UserService;
  let collegeService: CollegeService;
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
    collegeService = module.get(CollegeService);
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

  it('should support college workspace join and member listing', async () => {
    const collegeOwner = await userService.createUser({
      name: 'College Owner',
      email: 'college.owner@example.com',
      role: UserRole.COLLEGE,
    });
    const student = await userService.createUser({
      name: 'College Student',
      email: 'college.student@example.com',
      role: UserRole.USER,
    });

    const college = await collegeService.createCollege(
      toAuthUser(collegeOwner, UserRole.COLLEGE),
      {
        name: 'Integration College',
        institutionType: 'Engineering College',
        location: 'Kathmandu',
      },
    );
    if (!college) {
      throw new Error('Expected college workspace');
    }

    const joinResult = await collegeService.joinCollegeByInviteCode(
      toAuthUser(student, UserRole.USER),
      {
        inviteCode: college.inviteCode as string,
        program: 'BSc CSIT',
        year: 3,
      },
    );
    expect(joinResult.workspace.id).toBe(college.id);

    const members = await collegeService.listCollegeStudents(
      toAuthUser(collegeOwner, UserRole.COLLEGE),
      college.id as string,
      { page: 1, size: 20 },
    );
    expect(members.workspace.id).toBe(college.id);
    expect(members.members.length).toBe(1);
    const firstMember = members.members[0] as {
      program?: string;
      year?: number;
      student?: { id?: string };
      studentId?: string | { id?: string };
    };
    const memberStudentId =
      typeof firstMember.studentId === 'string'
        ? firstMember.studentId
        : firstMember.student?.id ?? firstMember.studentId?.id;
    expect(memberStudentId).toBe(student.id);
    expect(firstMember.program).toBe('BSc CSIT');
    expect(firstMember.year).toBe(3);
  });

  it('should expose global + joined-college jobs to members only', async () => {
    const collegeOwner = await userService.createUser({
      name: 'College Owner',
      email: 'college.owner.jobs@example.com',
      role: UserRole.COLLEGE,
    });
    const collegeMember = await userService.createUser({
      name: 'College Member',
      email: 'college.member.jobs@example.com',
      role: UserRole.USER,
    });
    const outsider = await userService.createUser({
      name: 'Outsider Candidate',
      email: 'outsider.candidate.jobs@example.com',
      role: UserRole.USER,
    });
    const recruiter = await userService.createUser({
      name: 'Recruiter One',
      email: 'recruiter.one.jobs@example.com',
      role: UserRole.RECRUITER,
    });

    const college = await collegeService.createCollege(
      toAuthUser(collegeOwner, UserRole.COLLEGE),
      {
        name: 'Placement College',
        institutionType: 'Private',
      },
    );
    const company = await companyService.createCompany(
      toAuthUser(recruiter, UserRole.RECRUITER),
      {
        name: 'Global Hiring Co',
      },
    );
    if (!college || !company) {
      throw new Error('Expected college and company workspaces');
    }

    await collegeService.joinCollegeByInviteCode(
      toAuthUser(collegeMember, UserRole.USER),
      {
        inviteCode: college.inviteCode as string,
        program: 'BCA',
        year: 2,
      },
    );

    const collegeJob = await jobPostingService.createJobPosting(
      toAuthUser(collegeOwner, UserRole.COLLEGE),
      {
        title: 'Campus Placement Role',
        description: 'Exclusive role for students in this college workspace.',
        deadline: new Date('2031-03-01T00:00:00.000Z'),
        requirements: { skills: ['Communication'] },
      },
    );

    const globalJob = await jobPostingService.createJobPosting(
      toAuthUser(recruiter, UserRole.RECRUITER),
      {
        companyId: company.id as string,
        title: 'Global Backend Role',
        description: 'Role visible to all candidates across the platform.',
        deadline: new Date('2031-04-01T00:00:00.000Z'),
        requirements: { skills: ['Node.js'] },
      },
    );

    expect(collegeJob).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        visibility: JobVisibility.COLLEGE_ONLY,
      }),
    );
    expect(globalJob).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        visibility: JobVisibility.GLOBAL,
      }),
    );
    const collegeJobId = (collegeJob as { id?: string }).id;
    const globalJobId = (globalJob as { id?: string }).id;
    if (!collegeJobId || !globalJobId) {
      throw new Error('Expected created jobs');
    }

    const memberFeed = await jobPostingService.getAllJobPostings(
      toAuthUser(collegeMember, UserRole.USER),
      { page: 1, size: 20, feed: JobFeedFilter.ALL },
    );
    const memberJobIds = memberFeed.jobs.map((job) => String(job.id));
    expect(memberJobIds).toContain(collegeJobId);
    expect(memberJobIds).toContain(globalJobId);

    const outsiderFeed = await jobPostingService.getAllJobPostings(
      toAuthUser(outsider, UserRole.USER),
      { page: 1, size: 20, feed: JobFeedFilter.ALL },
    );
    const outsiderJobIds = outsiderFeed.jobs.map((job) => String(job.id));
    expect(outsiderJobIds).not.toContain(collegeJobId);
    expect(outsiderJobIds).toContain(globalJobId);

    await expectApiError(
      jobPostingService.getJobPostingById(
        toAuthUser(outsider, UserRole.USER),
        collegeJobId,
      ),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );

    await expectApiError(
      jobPostingService.createJobPosting(
        toAuthUser(collegeMember, UserRole.USER),
        {
          title: 'Unauthorized Post',
          description: 'Candidates must not create jobs.',
          deadline: new Date('2031-05-01T00:00:00.000Z'),
          requirements: {},
        },
      ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });
});
