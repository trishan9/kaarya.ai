import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { COLLEGE_MESSAGES, COMPANY_MESSAGES, JOB_MESSAGES } from 'src/constants/messages.constants';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACBookmarkRepository } from 'src/repositories/bookmark.repository';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { CollegeService } from 'src/services/college.service';
import { CompanyService } from 'src/services/company.service';
import { EmailService } from 'src/services/email.service';
import { GamificationService } from 'src/services/gamification.service';
import { JobMatchService } from 'src/services/job-match.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { StudentService } from 'src/services/student.service';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('JobPostingService (extra)', () => {
  let service: JobPostingService;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let bookmarkRepository: jest.Mocked<ACBookmarkRepository>;
  let applicationRepository: jest.Mocked<ACApplicationRepository>;
  let resumeRepository: jest.Mocked<ACResumeRepository>;
  let collegeRepository: jest.Mocked<ACCollegeRepository>;
  let companyRepository: jest.Mocked<ACCompanyRepository>;
  let collegeService: jest.Mocked<CollegeService>;
  let companyService: jest.Mocked<CompanyService>;
  let studentService: jest.Mocked<StudentService>;
  let recruiterProfileService: jest.Mocked<RecruiterProfileService>;
  let emailService: jest.Mocked<EmailService>;
  let gamificationService: jest.Mocked<GamificationService>;

  const recruiterId = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();
  const collegeUserId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const applicationId = new Types.ObjectId().toString();

  beforeEach(() => {
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
    } as never;

    bookmarkRepository = {
      upsertByUserAndEntity: jest.fn(),
      deleteByUserAndEntity: jest.fn(),
      findAllByUser: jest.fn(),
      findSavedEntityIds: jest.fn().mockResolvedValue(new Set([jobId])),
    } as never;

    applicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByJobIdAndStudentId: jest.fn(),
      findByJobIdAndStudentIdWithRelations: jest.fn(),
      findByIdForJob: jest.fn(),
      findByStudentAndJobIds: jest.fn().mockResolvedValue([]),
      findAllByStudentId: jest.fn(),
      countByStudentWithFilters: jest.fn(),
      getStatusCountsByStudentWithFilters: jest.fn(),
      getDailyCountsByStudentWithFilters: jest.fn(),
      getJobCountsByStudentWithFilters: jest.fn(),
      updateById: jest.fn(),
      findJobIdsByStudentAndStatuses: jest.fn(),
      countByJobId: jest.fn().mockResolvedValue(2),
      countByStudentIds: jest.fn(),
      findAllByJobId: jest.fn(),
      findDistinctStudentIdsByJobIds: jest.fn(),
      countByStudentAndResumeId: jest.fn(),
      getStatusCountsByStudentIds: jest.fn(),
      getLeaderboardStatsByStudentIds: jest.fn(),
      getLeaderboardRows: jest.fn(),
    } as never;

    resumeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndStudentId: jest.fn(),
      findAllByStudentId: jest.fn(),
      countByStudentAndType: jest.fn(),
      updateByIdAndStudentId: jest.fn(),
      deleteByIdAndStudentId: jest.fn(),
      deleteManyByStudentId: jest.fn(),
    } as never;

    collegeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([{ id: collegeId, name: 'College', logo: null }]),
      findFirstByCreatedBy: jest.fn(),
      findByCreatedBy: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as never;

    companyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([{ id: companyId, name: 'Company', logo: null }]),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
      findByCreatedBy: jest.fn(),
      findFirstByCreatedBy: jest.fn(),
    } as never;

    collegeService = {
      getCollegeByIdRaw: jest.fn(),
      assertCanManageCollege: jest.fn(),
      getMyCollege: jest.fn().mockResolvedValue({ college: { id: collegeId } }),
      listStudentWorkspaces: jest.fn(),
      listColleges: jest.fn(),
      listCollegeStudents: jest.fn(),
      joinCollegeByInviteCode: jest.fn(),
      resetCollegeInviteCode: jest.fn(),
      inviteStudentToCollege: jest.fn(),
      createCollege: jest.fn(),
      updateCollege: jest.fn(),
      deleteCollege: jest.fn(),
      getCollegeById: jest.fn(),
      getCollegeMetrics: jest.fn(),
      removeStudentFromCollege: jest.fn(),
      removeStudentFromCollegeByAdmin: jest.fn(),
      assignStudentToCollegeByAdmin: jest.fn(),
      getMyCollegeRaw: jest.fn(),
      getCollegeByIdRawOrThrow: jest.fn(),
    } as never;

    companyService = {
      getCompanyByIdRaw: jest.fn(),
    } as never;

    studentService = {
      assertStudentMembership: jest.fn(),
      listStudentCollegeIds: jest.fn().mockResolvedValue([collegeId]),
      listCollegeStudentIds: jest.fn(),
      listStudentMemberships: jest.fn(),
      getMembershipByStudentAndCollege: jest.fn(),
      getMembershipByStudentAndCollegeOrThrow: jest.fn(),
      assignStudentToCollege: jest.fn(),
      removeStudentFromCollege: jest.fn(),
      removeAllByCollegeId: jest.fn(),
      assertStudentProfile: jest.fn(),
      listStudentCollegeMemberships: jest.fn(),
    } as never;

    recruiterProfileService = {
      resolveWritableCompanyIdForRecruiter: jest.fn().mockResolvedValue(companyId),
      assertRecruiterMembership: jest.fn(),
      listRecruiterMemberships: jest.fn(),
    } as never;

    emailService = {
      sendApplicationStatusUpdate: jest.fn(),
    } as never;

    gamificationService = {
      awardJobViewed: jest.fn(),
      awardJobApplicationSubmitted: jest.fn(),
      awardApplicationStatus: jest.fn(),
      awardInterviewStarted: jest.fn(),
      awardInterviewCompleted: jest.fn(),
      awardProfileUpdated: jest.fn(),
      awardResumeBuilderCreated: jest.fn(),
      awardResumeBuilderSaved: jest.fn(),
      awardAtsScanCompleted: jest.fn(),
      awardAtsScore: jest.fn(),
      awardInterviewScore: jest.fn(),
      awardJobSaved: jest.fn(),
      awardInterviewSaved: jest.fn(),
    } as never;

    const jobMatchService = {
      processNewJobPosting: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<JobMatchService>;

    service = new JobPostingService(
      jobPostingRepository,
      bookmarkRepository,
      applicationRepository,
      resumeRepository,
      collegeRepository,
      companyRepository,
      collegeService,
      companyService,
      studentService,
      recruiterProfileService,
      emailService,
      gamificationService,
      jobMatchService,
    );
  });

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

  it('should resolve writable workspace for admin/recruiter/college and reject others', async () => {
    await expectApiError(
      () =>
        (service as any).resolveWritableWorkspace(
          { id: recruiterId, role: UserRole.ADMIN },
          { requestedCollegeId: 'bad' },
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    await expect(
      (service as any).resolveWritableWorkspace(
        { id: recruiterId, role: UserRole.ADMIN },
        { requestedCollegeId: collegeId },
      ),
    ).resolves.toEqual({
      companyId: null,
      collegeId,
      visibility: JobVisibility.COLLEGE_ONLY,
    });

    await expectApiError(
      () =>
        (service as any).resolveWritableWorkspace(
          { id: recruiterId, role: UserRole.ADMIN },
          {},
        ),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.INVALID_ID,
    );

    await expect(
      (service as any).resolveWritableWorkspace(
        { id: recruiterId, role: UserRole.ADMIN },
        { requestedCompanyId: companyId },
      ),
    ).resolves.toEqual({
      companyId,
      collegeId: null,
      visibility: JobVisibility.GLOBAL,
    });

    await expect(
      (service as any).resolveWritableWorkspace(
        { id: recruiterId, role: UserRole.RECRUITER },
        { requestedCompanyId: companyId },
      ),
    ).resolves.toEqual({
      companyId,
      collegeId: null,
      visibility: JobVisibility.GLOBAL,
    });

    await expect(
      (service as any).resolveWritableWorkspace(
        { id: collegeUserId, role: UserRole.COLLEGE },
        {},
      ),
    ).resolves.toEqual({
      companyId: null,
      collegeId,
      visibility: JobVisibility.COLLEGE_ONLY,
    });

    collegeService.getMyCollege.mockResolvedValueOnce({ college: {} } as never);
    await expectApiError(
      () =>
        (service as any).resolveWritableWorkspace(
          { id: collegeUserId, role: UserRole.COLLEGE },
          {},
        ),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.COLLEGE_CONTEXT_REQUIRED,
    );

    await expectApiError(
      () =>
        (service as any).resolveWritableWorkspace(
          { id: studentId, role: UserRole.STUDENT },
          {},
        ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should validate manage/access guards for job resources', async () => {
    const companyJob = { companyId: new Types.ObjectId(companyId) };
    await expect(
      (service as any).assertCanManageJob(
        { id: recruiterId, role: UserRole.ADMIN },
        companyJob,
      ),
    ).resolves.toBeUndefined();

    await expect(
      (service as any).assertCanManageJob(
        { id: recruiterId, role: UserRole.RECRUITER },
        companyJob,
      ),
    ).resolves.toBeUndefined();

    const collegeJob = { collegeId: new Types.ObjectId(collegeId) };
    await expect(
      (service as any).assertCanManageJob(
        { id: collegeUserId, role: UserRole.COLLEGE },
        collegeJob,
      ),
    ).resolves.toBeUndefined();

    await expectApiError(
      () =>
        (service as any).assertCanManageJob(
          { id: studentId, role: UserRole.STUDENT },
          companyJob,
        ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );

    const restrictedJob = {
      visibility: JobVisibility.COLLEGE_ONLY,
      collegeId: new Types.ObjectId(collegeId),
    };
    await expect(
      (service as any).assertCanAccessJob(
        { id: recruiterId, role: UserRole.ADMIN },
        restrictedJob,
      ),
    ).resolves.toBeUndefined();
    await expect(
      (service as any).assertCanAccessJob(
        { id: studentId, role: UserRole.STUDENT },
        restrictedJob,
      ),
    ).resolves.toBeUndefined();

    await expectApiError(
      () =>
        (service as any).assertCanAccessJob(
          { id: recruiterId, role: UserRole.RECRUITER },
          restrictedJob,
        ),
      HttpStatus.FORBIDDEN,
      JOB_MESSAGES.APPLICATION_FORBIDDEN,
    );
  });

  it('should validate raw job id fetch and sync metrics', async () => {
    await expectApiError(
      () => (service as any).getJobPostingByIdRaw('bad'),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );

    jobPostingRepository.findById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () => (service as any).getJobPostingByIdRaw(jobId),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );

    jobPostingRepository.setApplicationsCount.mockResolvedValueOnce(null as never);
    await expectApiError(
      () => (service as any).syncApplicationsCountForJob(jobId),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );
  });

  it('should resolve feed options for trending, weekly, for-you, and accepted/rejected', async () => {
    const admin = { id: recruiterId, role: UserRole.ADMIN };
    const baseQuery = { page: 1, size: 10 };

    await expect(
      (service as any).resolveFeedOptions(admin, { ...baseQuery, feed: JobFeedFilter.ALL }),
    ).resolves.toEqual(expect.any(Object));

    const trending = await (service as any).resolveFeedOptions(admin, {
      ...baseQuery,
      feed: JobFeedFilter.TRENDING,
    });
    expect(trending.sort).toEqual(
      expect.objectContaining({ applicationsCount: -1, viewsCount: -1 }),
    );

    const lastWeek = await (service as any).resolveFeedOptions(admin, {
      ...baseQuery,
      feed: JobFeedFilter.LAST_WEEK,
    });
    expect(lastWeek.createdFrom).toBeInstanceOf(Date);

    const forYou = await (service as any).resolveFeedOptions(
      { id: studentId, role: UserRole.STUDENT },
      { ...baseQuery, feed: JobFeedFilter.FOR_YOU },
    );
    expect(forYou).toEqual(
      expect.objectContaining({
        status: JobPostingStatus.OPEN,
        remoteOnly: false,
      }),
    );

    const rejectedForRecruiter = await (service as any).resolveFeedOptions(
      { id: recruiterId, role: UserRole.RECRUITER },
      { ...baseQuery, feed: JobFeedFilter.REJECTED },
    );
    expect(rejectedForRecruiter.forceEmpty).toBe(true);

    applicationRepository.findJobIdsByStudentAndStatuses.mockResolvedValueOnce([]);
    const acceptedEmpty = await (service as any).resolveFeedOptions(
      { id: studentId, role: UserRole.STUDENT },
      { ...baseQuery, feed: JobFeedFilter.ACCEPTED },
    );
    expect(acceptedEmpty.forceEmpty).toBe(true);

    applicationRepository.findJobIdsByStudentAndStatuses.mockResolvedValueOnce([jobId]);
    const accepted = await (service as any).resolveFeedOptions(
      { id: studentId, role: UserRole.STUDENT },
      { ...baseQuery, feed: JobFeedFilter.ACCEPTED },
    );
    expect(accepted.jobIds).toEqual([jobId]);
  });

  it('should resolve workspace feed options across role types', async () => {
    const recruiterNoCompany = await (service as any).resolveWorkspaceFeedOptions(
      { id: recruiterId, role: UserRole.RECRUITER },
      { page: 1, size: 10 } as never,
    );
    expect(recruiterNoCompany.forceEmpty).toBe(true);

    const recruiterScoped = await (service as any).resolveWorkspaceFeedOptions(
      { id: recruiterId, role: UserRole.RECRUITER },
      { page: 1, size: 10, companyId } as never,
    );
    expect(recruiterScoped).toEqual(
      expect.objectContaining({ companyId, visibility: JobVisibility.GLOBAL }),
    );

    collegeService.getMyCollege.mockRejectedValueOnce(new Error('no workspace'));
    const collegeEmpty = await (service as any).resolveWorkspaceFeedOptions(
      { id: collegeUserId, role: UserRole.COLLEGE },
      { page: 1, size: 10 } as never,
    );
    expect(collegeEmpty.forceEmpty).toBe(true);

    const studentScoped = await (service as any).resolveWorkspaceFeedOptions(
      { id: studentId, role: UserRole.STUDENT },
      { page: 1, size: 10, collegeId } as never,
    );
    expect(studentScoped.accessibleCollegeIds).toEqual([collegeId]);

    studentService.listStudentCollegeIds.mockResolvedValueOnce([]);
    const studentNoMembership = await (service as any).resolveWorkspaceFeedOptions(
      { id: studentId, role: UserRole.STUDENT },
      { page: 1, size: 10, collegeId } as never,
    );
    expect(studentNoMembership.accessibleCollegeIds).toEqual([]);
  });

  it('should build map and view-model helpers', async () => {
    const emptyCompanyMap = await (service as any).buildCompanyMap(['bad-id']);
    expect(emptyCompanyMap.size).toBe(0);

    companyRepository.findByIds.mockResolvedValueOnce({} as never);
    const fallbackCompanyMap = await (service as any).buildCompanyMap([companyId]);
    expect(fallbackCompanyMap.size).toBe(0);

    const collegeMap = await (service as any).buildCollegeMap([collegeId]);
    expect(collegeMap.get(collegeId)?.name).toBe('College');

    const jobResponse = (service as any).buildJobResponse(
      {
        id: jobId,
        companyId,
        collegeId,
      },
      new Map([[companyId, { id: companyId, name: 'Company', logo: null }]]),
      {
        collegeMap: new Map([[collegeId, { id: collegeId, name: 'College', logo: null }]]),
        myApplicationByJobId: new Map([[jobId, { applicationId, status: ApplicationStatus.APPLIED }]]),
        savedJobIds: new Set([jobId]),
      },
    );
    expect(jobResponse).toEqual(
      expect.objectContaining({
        workspaceType: 'college',
        hasApplied: true,
        isSaved: true,
      }),
    );

    expect((service as any).buildJobMetricsResponse({ id: jobId })).toEqual({
      jobId,
      viewsCount: 0,
      applicationsCount: 0,
    });
  });

  it('should build application response with resume/timeline helpers', () => {
    const application = {
      id: applicationId,
      jobId: {
        id: jobId,
        companyId,
        collegeId,
      },
      studentId: { id: studentId, name: 'Student', email: 'student@example.com' },
      resumeId: {
        id: 'resume-1',
        fileName: 'resume',
        fileUrl: 'https://cdn.example/resume.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      status: ApplicationStatus.INTERVIEW_SCHEDULED,
      statusHistory: [
        { status: ApplicationStatus.APPLIED, changedAt: new Date('2026-01-01') },
        { status: ApplicationStatus.INTERVIEW_SCHEDULED, changedAt: new Date('2026-01-03') },
      ],
      createdAt: new Date('2026-01-01'),
    };

    const response = (service as any).buildApplicationResponse(application, {
      companyMap: new Map([[companyId, { id: companyId, name: 'Company', logo: null }]]),
      collegeMap: new Map([[collegeId, { id: collegeId, name: 'College', logo: null }]]),
      myApplicationByJobId: new Map([[jobId, { applicationId, status: ApplicationStatus.INTERVIEW_SCHEDULED }]]),
    });

    expect(response.resume.previewUrl).toContain('view.officeapps.live.com');
    expect(response.timeline).toHaveLength(7);
    expect(response.myApplicationStatus).toBe(ApplicationStatus.INTERVIEW_SCHEDULED);

    expect((service as any).normalizeResumeFileName(undefined, 'application/pdf')).toBe(
      'resume.pdf',
    );
    expect((service as any).extensionFromMimeType('application/msword')).toBe('.doc');
    expect((service as any).toDownloadResumeUrl(null)).toBeNull();
    expect((service as any).toPreviewResumeUrl('https://cdn/resume.pdf', 'application/pdf')).toBe(
      'https://cdn/resume.pdf',
    );
  });

  it('should notify candidate on status change and ignore notification failures', async () => {
    const existing = {
      status: ApplicationStatus.APPLIED,
      interviewScheduledAt: null,
      studentId: { id: studentId, email: 'student@example.com', name: 'Student' },
    };
    const updated = {
      status: ApplicationStatus.SHORTLISTED,
      interviewScheduledAt: null,
      studentId: { id: studentId, email: 'student@example.com', name: 'Student' },
    };

    await (service as any).notifyCandidateOnApplicationUpdate({
      job: { title: 'Backend Role', companyId: new Types.ObjectId(companyId) },
      existingApplication: existing,
      updatedApplication: updated,
      nextStatus: ApplicationStatus.SHORTLISTED,
    });
    expect(emailService.sendApplicationStatusUpdate).toHaveBeenCalled();

    emailService.sendApplicationStatusUpdate.mockRejectedValueOnce(new Error('smtp'));
    await expect(
      (service as any).notifyCandidateOnApplicationUpdate({
        job: { title: 'Backend Role', collegeId: new Types.ObjectId(collegeId) },
        existingApplication: existing as never,
        updatedApplication: {
          ...updated,
          interviewScheduledAt: new Date('2026-02-01'),
        } as never,
      }),
    ).resolves.toBeUndefined();
  });

  it('should enforce candidate-only operations and utility methods', async () => {
    expect(() =>
      (service as any).assertCandidateRole({ id: recruiterId, role: UserRole.RECRUITER }),
    ).toThrow(ApiError);

    const noRows = await (service as any).buildMyApplicationMetaByJobId(
      { id: recruiterId, role: UserRole.RECRUITER },
      [jobId],
    );
    expect(noRows.size).toBe(0);

    applicationRepository.findByStudentAndJobIds.mockResolvedValueOnce({} as never);
    const invalidRows = await (service as any).buildMyApplicationMetaByJobId(
      { id: studentId, role: UserRole.STUDENT },
      [jobId],
    );
    expect(invalidRows.size).toBe(0);

    applicationRepository.findByStudentAndJobIds.mockResolvedValueOnce([
      { jobId, applicationId, status: ApplicationStatus.APPLIED },
    ] as never);
    const rows = await (service as any).buildMyApplicationMetaByJobId(
      { id: studentId, role: UserRole.STUDENT },
      [jobId],
    );
    expect(rows.get(jobId)?.applicationId).toBe(applicationId);

    const emptySaved = await (service as any).buildSavedJobIdSet(
      { id: recruiterId, role: UserRole.RECRUITER },
      [jobId],
    );
    expect(emptySaved.size).toBe(0);

    const saved = await (service as any).buildSavedJobIdSet(
      { id: studentId, role: UserRole.STUDENT },
      [jobId],
    );
    expect(saved.has(jobId)).toBe(true);

    const ago = (service as any).daysAgo(5) as Date;
    expect(ago).toBeInstanceOf(Date);
    expect((service as any).toIsoDateString(new Date('2026-01-01'))).toContain(
      '2026-01-01',
    );
    expect((service as any).toIsoDateString(123)).toBeNull();
  });

  it('should cover create/update application edge paths', async () => {
    jest.spyOn(service as any, 'assertCandidateRole').mockImplementation(() => undefined);
    jest.spyOn(service as any, 'assertCanAccessJob').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'syncApplicationsCountForJob').mockResolvedValue({
      jobId,
      viewsCount: 0,
      applicationsCount: 1,
    });
    jest.spyOn(service as any, 'buildApplicationResponse').mockReturnValue({ id: applicationId });

    const openJob = {
      id: jobId,
      status: JobPostingStatus.OPEN,
      companyId: new Types.ObjectId(companyId),
      collegeId: null,
    };
    jest.spyOn(service as any, 'getJobPostingByIdRaw').mockResolvedValue(openJob as never);

    applicationRepository.findByJobIdAndStudentId.mockResolvedValueOnce({
      id: 'exists',
    } as never);
    await expectApiError(
      () =>
        service.createJobApplication(
          { id: studentId, role: UserRole.STUDENT },
          jobId,
          {} as never,
        ),
      HttpStatus.CONFLICT,
      JOB_MESSAGES.APPLICATION_ALREADY_EXISTS,
    );

    applicationRepository.findByJobIdAndStudentId.mockResolvedValueOnce(null as never);
    resumeRepository.findByIdAndStudentId.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.createJobApplication(
          { id: studentId, role: UserRole.STUDENT },
          jobId,
          { resumeId: new Types.ObjectId().toString() } as never,
        ),
      HttpStatus.BAD_REQUEST,
      'Selected resume was not found',
    );

    applicationRepository.findByJobIdAndStudentId.mockResolvedValueOnce(null as never);
    resumeRepository.create.mockResolvedValueOnce({
      id: new Types.ObjectId().toString(),
      fileName: 'resume.pdf',
    } as never);
    applicationRepository.create.mockResolvedValueOnce({ id: applicationId } as never);
    applicationRepository.findByIdForJob.mockResolvedValueOnce(null as never);

    const created = await service.createJobApplication(
      { id: studentId, role: UserRole.STUDENT },
      jobId,
      {
        resumeUrl: 'https://cdn.example/resume.pdf',
        resumeFileName: 'resume',
        resumeMimeType: 'application/pdf',
      } as never,
    );
    expect(created).toEqual(expect.objectContaining({ id: applicationId }));

    jest.spyOn(service as any, 'assertCanManageJob').mockResolvedValue(undefined);
    applicationRepository.findByIdForJob.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateJobApplication(
          { id: recruiterId, role: UserRole.RECRUITER },
          jobId,
          applicationId,
          { status: ApplicationStatus.SHORTLISTED } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.APPLICATION_NOT_FOUND,
    );
  });
});
