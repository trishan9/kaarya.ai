import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import {
  COMPANY_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { JobPostingService } from 'src/services/job-posting.service';
import { CompanyService } from 'src/services/company.service';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { EmailService } from 'src/services/email.service';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('JobPostingService', () => {
  let service: JobPostingService;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let resumeRepository: jest.Mocked<ACResumeRepository>;
  let companyRepository: jest.Mocked<ACCompanyRepository>;
  let companyService: jest.Mocked<CompanyService>;
  let recruiterProfileService: jest.Mocked<RecruiterProfileService>;
  let emailService: jest.Mocked<EmailService>;

  const recruiterId = '507f191e810c19729de860ea';
  const studentId = '507f191e810c19729de860eb';
  const companyId = '507f191e810c19729de860ec';
  const jobId = '507f191e810c19729de860ed';

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

  beforeEach(() => {
    jobPostingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      incrementViewsCount: jest.fn(),
      setApplicationsCount: jest.fn(),
    } as unknown as jest.Mocked<ACJobPostingRepository>;

    applicationRepository = {
      create: jest.fn(),
      findJobIdsByStudentAndStatuses: jest.fn(),
      countByJobId: jest.fn(),
      findAllByJobId: jest.fn(),
    } as unknown as jest.Mocked<ACApplicationRepository>;

    resumeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndStudentId: jest.fn(),
      findAllByStudentId: jest.fn(),
    } as unknown as jest.Mocked<ACResumeRepository>;

    companyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCompanyRepository>;

    companyService = {
      getCompanyByIdRaw: jest.fn(),
    } as unknown as jest.Mocked<CompanyService>;

    recruiterProfileService = {
      resolveWritableCompanyIdForRecruiter: jest.fn(),
      assertRecruiterMembership: jest.fn(),
    } as unknown as jest.Mocked<RecruiterProfileService>;

    emailService = {
      sendApplicationStatusUpdate: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    service = new JobPostingService(
      jobPostingRepository,
      applicationRepository,
      resumeRepository,
      companyRepository,
      companyService,
      recruiterProfileService,
      emailService,
    );
  });

  it('should create job with normalized defaults for recruiter workspace', async () => {
    recruiterProfileService.resolveWritableCompanyIdForRecruiter.mockResolvedValue(
      companyId,
    );
    companyService.getCompanyByIdRaw.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      location: 'Kathmandu',
    } as never);
    jobPostingRepository.create.mockResolvedValue({
      id: jobId,
      companyId,
      createdBy: recruiterId,
      title: 'Backend Engineer',
      description: 'Scale APIs safely across environments.',
      location: 'Kathmandu',
      employmentType: 'Full-Time',
      engagementType: 'Full-Time',
      workMode: JobWorkMode.ONSITE,
      salaryRange: 'Compensation not specified',
      requirements: {},
      deadline: new Date('2030-01-01T00:00:00.000Z'),
      status: JobPostingStatus.OPEN,
    } as never);
    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: 'https://img/logo.png' },
    ] as never);

    const result = await service.createJobPosting(
      { id: recruiterId, role: UserRole.RECRUITER },
      {
        companyId,
        title: 'Backend Engineer',
        description: 'Scale APIs safely across environments.',
        deadline: new Date('2030-01-01T00:00:00.000Z'),
        requirements: {},
      },
    );

    expect(jobPostingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: expect.anything(),
        location: 'Kathmandu',
        employmentType: 'Full-Time',
        engagementType: 'Full-Time',
        workMode: JobWorkMode.ONSITE,
        salaryRange: 'Compensation not specified',
        status: JobPostingStatus.OPEN,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: jobId,
        company: expect.objectContaining({ id: companyId }),
      }),
    );
  });

  it('should reject create job for unauthorized roles', async () => {
    await expectApiError(
      service.createJobPosting(
        { id: studentId, role: UserRole.STUDENT },
        {
          title: 'Blocked',
          description: 'Students should not create jobs here.',
          deadline: new Date('2030-01-01T00:00:00.000Z'),
          requirements: {},
        },
      ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should return empty feed for accepted jobs when requester is not student/user', async () => {
    const result = await service.getAllJobPostings(
      { id: recruiterId, role: UserRole.RECRUITER },
      {
        page: 1,
        size: 10,
        feed: JobFeedFilter.ACCEPTED,
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        jobs: [],
        activeFeed: JobFeedFilter.ACCEPTED,
      }),
    );
    expect(jobPostingRepository.findAll).not.toHaveBeenCalled();
  });

  it('should resolve accepted feed using student applications', async () => {
    applicationRepository.findJobIdsByStudentAndStatuses.mockResolvedValue([jobId]);
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [
        {
          id: jobId,
          companyId,
          title: 'Accepted job',
          description: 'Accepted',
          deadline: new Date('2030-01-01T00:00:00.000Z'),
          status: JobPostingStatus.OPEN,
        },
      ],
      total: 1,
    } as never);
    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: null },
    ] as never);

    const result = await service.getAllJobPostings(
      { id: studentId, role: UserRole.STUDENT },
      {
        page: 1,
        size: 10,
        feed: JobFeedFilter.ACCEPTED,
      },
    );

    expect(applicationRepository.findJobIdsByStudentAndStatuses).toHaveBeenCalledWith(
      {
        studentId,
        statuses: [ApplicationStatus.ACCEPTED],
      },
    );
    expect(jobPostingRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        jobIds: [jobId],
      }),
    );
    expect(result.jobs).toHaveLength(1);
  });

  it('should pass trending sort order to repository', async () => {
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [],
      total: 0,
    });

    await service.getAllJobPostings(
      { id: studentId, role: UserRole.STUDENT },
      {
        page: 1,
        size: 10,
        feed: JobFeedFilter.TRENDING,
      },
    );

    expect(jobPostingRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: {
          applicationsCount: -1,
          viewsCount: -1,
          createdAt: -1,
          _id: -1,
        },
      }),
    );
  });

  it('should pass for_you defaults for status and remoteOnly', async () => {
    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [],
      total: 0,
    });

    await service.getAllJobPostings(
      { id: studentId, role: UserRole.STUDENT },
      {
        page: 1,
        size: 10,
        feed: JobFeedFilter.FOR_YOU,
      },
    );

    expect(jobPostingRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        status: JobPostingStatus.OPEN,
        remoteOnly: false,
      }),
    );
  });

  it('should block non-recruiter/admin from reading job applications', async () => {
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId,
    } as never);

    await expectApiError(
      service.getJobApplications(
        { id: studentId, role: UserRole.STUDENT },
        jobId,
        { page: 1, size: 10 },
      ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should return paginated job applications for recruiter workspace member', async () => {
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId,
    } as never);
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    applicationRepository.findAllByJobId.mockResolvedValue({
      applications: [
        {
          id: 'app-1',
          jobId,
          studentId: { id: studentId, name: 'Student One' },
          status: ApplicationStatus.APPLIED,
        },
      ],
      total: 1,
    } as never);

    const result = await service.getJobApplications(
      { id: recruiterId, role: UserRole.RECRUITER },
      jobId,
      { page: 1, size: 10 },
    );

    expect(result).toEqual(
      expect.objectContaining({
        jobId,
      }),
    );
    expect(result.applications).toHaveLength(1);
  });

  it('should reject record view for invalid id', async () => {
    await expectApiError(
      service.recordJobView('invalid'),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );
  });

  it('should sync applications count when fetching metrics', async () => {
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId,
      applicationsCount: 0,
      viewsCount: 8,
    } as never);
    applicationRepository.countByJobId.mockResolvedValue(4);
    jobPostingRepository.setApplicationsCount.mockResolvedValue({
      id: jobId,
      viewsCount: 8,
      applicationsCount: 4,
    } as never);

    const result = await service.getJobPostingMetrics(jobId, {
      syncApplicationsCount: true,
    });

    expect(applicationRepository.countByJobId).toHaveBeenCalledWith(jobId);
    expect(jobPostingRepository.setApplicationsCount).toHaveBeenCalledWith(
      jobId,
      4,
    );
    expect(result).toEqual({
      jobId,
      viewsCount: 8,
      applicationsCount: 4,
    });
  });

  it('should update job posting for workspace recruiter', async () => {
    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      companyId,
      status: JobPostingStatus.OPEN,
    } as never);
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    jobPostingRepository.updateById.mockResolvedValue({
      id: jobId,
      companyId,
      status: JobPostingStatus.CLOSED,
    } as never);
    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: null },
    ] as never);

    const result = await service.updateJobPosting(
      { id: recruiterId, role: UserRole.RECRUITER },
      jobId,
      { status: JobPostingStatus.CLOSED },
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: jobId,
        status: JobPostingStatus.CLOSED,
      }),
    );
  });

  it('should throw if deleting unknown job', async () => {
    jobPostingRepository.findById.mockResolvedValue(null);

    await expectApiError(
      service.deleteJobPosting({ id: recruiterId, role: UserRole.ADMIN }, jobId),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );
  });

  it('should reject admin create without companyId', async () => {
    await expectApiError(
      service.createJobPosting(
        { id: recruiterId, role: UserRole.ADMIN },
        {
          title: 'No company',
          description: 'Admin omitted company id.',
          deadline: new Date('2030-01-01T00:00:00.000Z'),
          requirements: {},
        },
      ),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.INVALID_ID,
    );
  });
});
