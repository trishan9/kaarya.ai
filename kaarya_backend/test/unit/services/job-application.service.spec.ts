import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { JobApplicationService } from 'src/services/job-application.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('JobApplicationService', () => {
  let service: JobApplicationService;
  let jobPostingService: jest.Mocked<JobPostingService>;
  let resumeRepository: jest.Mocked<ACResumeRepository>;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let companyRepository: jest.Mocked<ACCompanyRepository>;
  let collegeRepository: jest.Mocked<ACCollegeRepository>;

  const user = { id: new Types.ObjectId().toString(), role: UserRole.STUDENT };
  const resumeId = new Types.ObjectId().toString();

  beforeEach(() => {
    jobPostingService = {
      getJobApplications: jest.fn(),
      getMyApplications: jest.fn(),
      getMyApplicationForJob: jest.fn(),
      createJobApplication: jest.fn(),
      updateJobApplication: jest.fn(),
      updateApplicationResumeActivity: jest.fn(),
    } as unknown as jest.Mocked<JobPostingService>;

    resumeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndStudentId: jest.fn(),
      findAllByStudentId: jest.fn(),
      deleteByIdAndStudentId: jest.fn(),
    } as unknown as jest.Mocked<ACResumeRepository>;

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
      countByStudentIds: jest.fn(),
      findAllByJobId: jest.fn(),
      findDistinctStudentIdsByJobIds: jest.fn(),
      countByStudentAndResumeId: jest.fn(),
      getStatusCountsByStudentIds: jest.fn(),
      getLeaderboardStatsByStudentIds: jest.fn(),
      getLeaderboardRows: jest.fn(),
    } as unknown as jest.Mocked<ACApplicationRepository>;

    jobPostingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      deleteManyByCollegeId: jest.fn(),
      incrementViewsCount: jest.fn(),
      setApplicationsCount: jest.fn(),
    } as unknown as jest.Mocked<ACJobPostingRepository>;

    companyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCompanyRepository>;

    collegeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      findFirstByCreatedBy: jest.fn(),
      findByCreatedBy: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCollegeRepository>;

    service = new JobApplicationService(
      jobPostingService,
      resumeRepository,
      applicationRepository,
      jobPostingRepository,
      companyRepository,
      collegeRepository,
    );
  });

  it('should proxy job application methods to JobPostingService', async () => {
    jobPostingService.getJobApplications.mockResolvedValue({ ok: 1 } as never);
    jobPostingService.getMyApplications.mockResolvedValue({ ok: 2 } as never);
    jobPostingService.getMyApplicationForJob.mockResolvedValue({ ok: 3 } as never);
    jobPostingService.createJobApplication.mockResolvedValue({ ok: 4 } as never);
    jobPostingService.updateJobApplication.mockResolvedValue({ ok: 5 } as never);
    jobPostingService.updateApplicationResumeActivity.mockResolvedValue(
      { ok: 6 } as never,
    );

    await expect(
      service.getJobApplications(user as never, 'job', { page: 1, size: 5 } as never),
    ).resolves.toEqual({ ok: 1 });
    await expect(
      service.getMyApplications(user as never, { page: 1, size: 5 } as never),
    ).resolves.toEqual({ ok: 2 });
    await expect(
      service.getMyApplicationForJob(user as never, 'job'),
    ).resolves.toEqual({ ok: 3 });
    await expect(
      service.createJobApplication(user as never, 'job', {} as never),
    ).resolves.toEqual({ ok: 4 });
    await expect(
      service.updateJobApplication(user as never, 'job', 'app', {} as never),
    ).resolves.toEqual({ ok: 5 });
    await expect(
      service.updateApplicationResumeActivity(
        user as never,
        'job',
        'app',
        { action: 'view' } as never,
      ),
    ).resolves.toEqual({ ok: 6 });
  });

  it('should compute my applications summary analytics', async () => {
    applicationRepository.countByStudentWithFilters
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2);

    applicationRepository.getStatusCountsByStudentWithFilters
      .mockResolvedValueOnce({
        applied: 4,
        reviewing: 2,
        shortlisted: 1,
        interviewScheduled: 2,
        accepted: 2,
        rejected: 1,
        withdrawn: 0,
      })
      .mockResolvedValueOnce({
        applied: 3,
        reviewing: 1,
        shortlisted: 1,
        interviewScheduled: 1,
        accepted: 1,
        rejected: 2,
        withdrawn: 0,
      });

    const job1 = new Types.ObjectId().toString();
    const job2 = new Types.ObjectId().toString();
    const companyId = new Types.ObjectId().toString();
    const collegeId = new Types.ObjectId().toString();

    applicationRepository.getJobCountsByStudentWithFilters.mockResolvedValue([
      {
        jobId: job1,
        count: 2,
        latestAppliedAt: '2026-02-10T00:00:00.000Z',
      },
      {
        jobId: job2,
        count: 1,
        latestAppliedAt: '2026-02-12T00:00:00.000Z',
      },
    ]);

    applicationRepository.getDailyCountsByStudentWithFilters
      .mockResolvedValueOnce([
        { date: '2026-02-10', count: 2 },
        { date: '2026-02-11', count: 1 },
      ])
      .mockResolvedValueOnce([{ date: '2026-02-10', count: 1 }]);

    jobPostingRepository.findAll.mockResolvedValue({
      jobs: [
        { id: job1, companyId: new Types.ObjectId(companyId) },
        { id: job2, collegeId: new Types.ObjectId(collegeId) },
      ],
      total: 2,
    } as never);
    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: null },
    ] as never);
    collegeRepository.findByIds.mockResolvedValue([
      { id: collegeId, name: 'Campus', logo: null },
    ] as never);

    const result = await service.getMyApplicationsSummary(user as never, {
      month: '2026-02',
      statuses: [ApplicationStatus.APPLIED, ApplicationStatus.APPLIED],
    } as never);

    expect(result.summary.total).toBe(12);
    expect(result.summary.delta).toBe(2);
    expect(result.analytics.pipeline).toHaveLength(4);
    expect(result.analytics.summary.interviewConversion).toBeGreaterThanOrEqual(0);
    expect(result.recentCompanies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workspaceType: 'company', name: 'Acme' }),
        expect.objectContaining({ workspaceType: 'college', name: 'Campus' }),
      ]),
    );
  });

  it('should list resumes with preview/download URLs', async () => {
    resumeRepository.findAllByStudentId.mockResolvedValue({
      resumes: [
        {
          id: resumeId,
          fileName: 'Resume',
          fileUrl: 'https://cdn.test/resume.docx',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
      total: 1,
    } as never);

    const result = await service.listMyResumes(user as never, {
      page: 1,
      size: 10,
    } as never);

    expect(result.meta.totalItems).toBe(1);
    expect(result.resumes[0]).toEqual(
      expect.objectContaining({
        previewUrl: expect.stringContaining('view.officeapps.live.com'),
        downloadUrl: 'https://cdn.test/resume.docx',
      }),
    );
  });

  it('should upload a resume and reject missing URL', async () => {
    try {
      await service.uploadMyResume(user as never, {} as never);
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }

    resumeRepository.create.mockResolvedValue({
      id: resumeId,
      fileName: 'resume.pdf',
      fileUrl: 'https://cdn.test/resume.pdf',
      mimeType: 'application/pdf',
    } as never);

    const result = await service.uploadMyResume(user as never, {
      resumeUrl: 'https://cdn.test/resume.pdf',
      resumeFileName: 'resume.pdf',
      resumeMimeType: 'application/pdf',
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        fileName: 'resume.pdf',
        previewUrl: 'https://cdn.test/resume.pdf',
      }),
    );
  });

  it('should enforce delete resume constraints and support success path', async () => {
    resumeRepository.findByIdAndStudentId.mockResolvedValue(null);
    await expect(
      service.deleteMyResume(user as never, resumeId),
    ).rejects.toBeInstanceOf(ApiError);

    resumeRepository.findByIdAndStudentId.mockResolvedValue({
      id: resumeId,
    } as never);
    applicationRepository.countByStudentAndResumeId.mockResolvedValue(2);
    try {
      await service.deleteMyResume(user as never, resumeId);
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }

    applicationRepository.countByStudentAndResumeId.mockResolvedValue(0);
    resumeRepository.deleteByIdAndStudentId.mockResolvedValue(false);
    try {
      await service.deleteMyResume(user as never, resumeId);
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.NOT_FOUND);
    }

    resumeRepository.deleteByIdAndStudentId.mockResolvedValue(true);
    await expect(
      service.deleteMyResume(user as never, resumeId),
    ).resolves.toEqual({ deleted: true });
  });

  it('should cover private helper branches', async () => {
    const internal = service as any;
    expect(internal.toPreviewResumeUrl(null, null)).toBeNull();
    expect(
      internal.toPreviewResumeUrl(
        'https://cdn.test/file.doc',
        'application/msword',
      ),
    ).toContain('view.officeapps.live.com');
    expect(internal.toDownloadResumeUrl(null)).toBeNull();
    expect(internal.normalizeStatuses(undefined)).toEqual([]);
    expect(
      internal.normalizeStatuses([
        ApplicationStatus.APPLIED,
        ApplicationStatus.APPLIED,
      ]),
    ).toEqual([ApplicationStatus.APPLIED]);

    const parsed = internal.parseMonthKey('invalid-value', new Date('2026-02-01'));
    expect(parsed).toEqual([2026, 2]);
    expect(internal.toMonthKey(2026, 3)).toBe('2026-03');
    expect(internal.formatMonthLabel(new Date('2026-03-01T00:00:00.000Z'))).toBe(
      'March 2026',
    );

    const [todayFrom, todayTo] = internal.resolveTodayWindowWithinMonth(
      new Date('1999-01-01T00:00:00.000Z'),
      new Date('1999-01-02T00:00:00.000Z'),
    );
    expect(todayFrom).toBeNull();
    expect(todayTo).toBeNull();

    const momentum = internal.buildMomentumSeries(
      {
        fromDate: new Date('2026-02-01T00:00:00.000Z'),
        toDate: new Date('2026-02-12T00:00:00.000Z'),
      },
      [{ date: '2026-02-10', count: 2 }],
      [{ date: '2026-02-11', count: 1 }],
    );
    expect(momentum).toHaveLength(7);

    expect(
      internal.maxIsoDate('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z'),
    ).toBe('2026-01-02T00:00:00.000Z');
    expect(internal.maxIsoDate('bad', '2026-01-02T00:00:00.000Z')).toBe(
      '2026-01-02T00:00:00.000Z',
    );
    expect(internal.maxIsoDate('2026-01-02T00:00:00.000Z', 'bad')).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('should return empty recent companies for empty input', async () => {
    const result = await (service as any).buildRecentCompanies([]);
    expect(result).toEqual([]);
  });
});
