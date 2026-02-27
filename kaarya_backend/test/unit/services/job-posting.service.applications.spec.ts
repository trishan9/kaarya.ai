import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { JOB_MESSAGES } from 'src/constants/messages.constants';
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
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('JobPostingService (applications branch coverage)', () => {
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
      findSavedEntityIds: jest.fn().mockResolvedValue(new Set([jobId])),
      upsertByUserAndEntity: jest.fn(),
      deleteByUserAndEntity: jest.fn(),
      findAllByUser: jest.fn(),
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

  it('should cover get-by-id/view/metrics error and no-sync branches', async () => {
    await expectApiError(
      () =>
        service.getJobPostingById(
          { id: recruiterId, role: UserRole.ADMIN } as never,
          'bad-id',
        ),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );

    await expectApiError(
      () =>
        service.getJobPostingById(
          { id: recruiterId, role: UserRole.ADMIN } as never,
          jobId,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );

    jobPostingRepository.incrementViewsCount.mockResolvedValue(null as never);
    await expectApiError(
      () =>
        service.recordJobView(
          { id: studentId, role: UserRole.STUDENT } as never,
          jobId,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );

    jobPostingRepository.incrementViewsCount.mockResolvedValue({
      id: jobId,
      viewsCount: 3,
      applicationsCount: 1,
    } as never);
    const viewed = await service.recordJobView(
      { id: studentId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(viewed).toEqual({ jobId, viewsCount: 3, applicationsCount: 1 });
    expect(gamificationService.awardJobViewed).toHaveBeenCalledWith({
      userId: studentId,
      jobId,
    });

    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      viewsCount: 12,
      applicationsCount: 5,
    } as never);
    const metrics = await service.getJobPostingMetrics(jobId, {
      syncApplicationsCount: false,
    });
    expect(metrics).toEqual({
      jobId,
      viewsCount: 12,
      applicationsCount: 5,
    });
  });

  it('should cover get-by-id success and update/delete terminal branches', async () => {
    const job = {
      id: jobId,
      status: JobPostingStatus.OPEN,
      visibility: JobVisibility.GLOBAL,
      companyId: new Types.ObjectId(companyId),
      collegeId: new Types.ObjectId(collegeId),
    };
    jobPostingRepository.findById.mockResolvedValue(job as never);
    applicationRepository.findByStudentAndJobIds.mockResolvedValue([
      {
        jobId,
        applicationId,
        status: ApplicationStatus.APPLIED,
      },
    ] as never);

    const fetched = await service.getJobPostingById(
      { id: studentId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(fetched).toEqual(expect.objectContaining({ id: jobId }));

    jobPostingRepository.findById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateJobPosting(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
          { title: 'Updated' } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );

    jobPostingRepository.findById.mockResolvedValueOnce(job as never);
    jobPostingRepository.updateById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateJobPosting(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
          { title: 'Updated' } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );

    jobPostingRepository.findById.mockResolvedValueOnce(job as never);
    jobPostingRepository.deleteById.mockResolvedValueOnce({
      ...job,
      id: jobId,
    } as never);
    const deleted = await service.deleteJobPosting(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
    );
    expect(deleted).toEqual(expect.objectContaining({ id: jobId }));

    jobPostingRepository.findById.mockResolvedValueOnce(job as never);
    jobPostingRepository.deleteById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.deleteJobPosting(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.NOT_FOUND,
    );
  });

  it('should list my applications and get my application-for-job', async () => {
    const populatedApplication = {
      id: applicationId,
      status: ApplicationStatus.APPLIED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      studentId: {
        id: studentId,
        name: 'Student',
        email: 'student@example.com',
      },
      resumeId: {
        id: new Types.ObjectId().toString(),
        fileName: 'resume',
        fileUrl: 'https://cdn.example/resume.pdf',
        mimeType: 'application/pdf',
      },
      jobId: {
        id: jobId,
        title: 'Backend Engineer',
        companyId,
        collegeId,
      },
      statusHistory: [{ status: ApplicationStatus.APPLIED, changedAt: new Date() }],
    };

    applicationRepository.findAllByStudentId.mockResolvedValue({
      applications: [
        populatedApplication,
        { id: new Types.ObjectId().toString(), jobId: 'plain-job-id' },
      ],
      total: 2,
    } as never);
    applicationRepository.findByStudentAndJobIds.mockResolvedValue([
      {
        jobId,
        applicationId,
        status: ApplicationStatus.APPLIED,
      },
    ] as never);

    const list = await service.getMyApplications(
      { id: studentId, role: UserRole.STUDENT } as never,
      { page: 1, size: 10 } as never,
    );

    expect(list.applications).toHaveLength(2);
    expect(list.applications[0]).toEqual(
      expect.objectContaining({
        hasApplied: true,
        myApplicationId: applicationId,
      }),
    );
    expect(list.applications[1]).toEqual(
      expect.objectContaining({
        job: { id: 'plain-job-id', company: null },
      }),
    );

    jobPostingRepository.findById.mockResolvedValue({
      id: jobId,
      status: JobPostingStatus.OPEN,
      visibility: JobVisibility.GLOBAL,
      companyId: new Types.ObjectId(companyId),
      collegeId: new Types.ObjectId(collegeId),
    } as never);
    applicationRepository.findByJobIdAndStudentIdWithRelations.mockResolvedValue(
      null as never,
    );
    await expect(
      service.getMyApplicationForJob(
        { id: studentId, role: UserRole.STUDENT } as never,
        jobId,
      ),
    ).resolves.toBeNull();

    applicationRepository.findByJobIdAndStudentIdWithRelations.mockResolvedValue(
      populatedApplication as never,
    );
    const found = await service.getMyApplicationForJob(
      { id: studentId, role: UserRole.STUDENT } as never,
      jobId,
    );
    expect(found).toEqual(
      expect.objectContaining({
        id: applicationId,
      }),
    );
  });

  it('should cover create/update application and resume-activity branches', async () => {
    const openJob = {
      id: jobId,
      title: 'Backend Engineer',
      status: JobPostingStatus.OPEN,
      visibility: JobVisibility.GLOBAL,
      companyId: new Types.ObjectId(companyId),
      collegeId: new Types.ObjectId(collegeId),
    };
    jobPostingRepository.findById.mockResolvedValue(openJob as never);
    applicationRepository.findByJobIdAndStudentId.mockResolvedValue(null as never);
    applicationRepository.create.mockResolvedValue({ id: applicationId } as never);
    applicationRepository.findByIdForJob.mockResolvedValue({
      id: applicationId,
      jobId: openJob,
      studentId: { id: studentId, email: 'student@example.com', name: 'Student' },
      status: ApplicationStatus.APPLIED,
      statusHistory: [],
    } as never);
    resumeRepository.create.mockResolvedValue({
      id: new Types.ObjectId().toString(),
      fileName: 'resume.pdf',
    } as never);
    applicationRepository.countByJobId.mockResolvedValue(1);
    jobPostingRepository.setApplicationsCount.mockResolvedValue({
      id: jobId,
      viewsCount: 0,
      applicationsCount: 1,
    } as never);

    await expect(
      service.createJobApplication(
        { id: studentId, role: UserRole.STUDENT } as never,
        jobId,
        {
          resumeUrl: 'https://cdn.example/resume.pdf',
          resumeFileName: 'resume',
          resumeMimeType: 'application/pdf',
        } as never,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: applicationId }));

    // Closed jobs cannot be applied to.
    jobPostingRepository.findById.mockResolvedValueOnce({
      ...openJob,
      status: JobPostingStatus.CLOSED,
    } as never);
    await expectApiError(
      () =>
        service.createJobApplication(
          { id: studentId, role: UserRole.STUDENT } as never,
          jobId,
          { resumeId: new Types.ObjectId().toString() } as never,
        ),
      HttpStatus.BAD_REQUEST,
      'Applications are closed',
    );

    const existingAppBase = {
      id: applicationId,
      status: ApplicationStatus.APPLIED,
      statusHistory: [],
      interviewScheduledAt: null,
      studentId: { id: studentId, email: 'student@example.com', name: 'Student' },
    };
    applicationRepository.findByIdForJob.mockResolvedValue(existingAppBase as never);
    applicationRepository.updateById.mockResolvedValue({
      ...existingAppBase,
      status: ApplicationStatus.SHORTLISTED,
      interviewScheduledAt: new Date('2026-02-01T00:00:00.000Z'),
    } as never);

    await service.updateJobApplication(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      {
        status: ApplicationStatus.SHORTLISTED,
        interviewScheduledAt: new Date('2026-02-01T00:00:00.000Z'),
        interviewNote: null,
      } as never,
    );
    expect(gamificationService.awardApplicationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'shortlisted' }),
    );

    applicationRepository.updateById.mockResolvedValueOnce({
      ...existingAppBase,
      status: ApplicationStatus.INTERVIEW_SCHEDULED,
      interviewScheduledAt: new Date('2026-02-02T00:00:00.000Z'),
    } as never);
    await service.updateJobApplication(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      {
        interviewScheduledAt: new Date('2026-02-02T00:00:00.000Z'),
      } as never,
    );
    expect(gamificationService.awardApplicationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'interview_scheduled' }),
    );

    applicationRepository.updateById.mockResolvedValueOnce({
      ...existingAppBase,
      status: ApplicationStatus.ACCEPTED,
    } as never);
    await service.updateJobApplication(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      {
        status: ApplicationStatus.ACCEPTED,
      } as never,
    );
    expect(gamificationService.awardApplicationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );

    applicationRepository.updateById.mockResolvedValueOnce({
      ...existingAppBase,
      status: ApplicationStatus.REJECTED,
    } as never);
    await service.updateJobApplication(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      {
        status: ApplicationStatus.REJECTED,
      } as never,
    );
    expect(gamificationService.awardApplicationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected' }),
    );

    applicationRepository.updateById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateJobApplication(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
          applicationId,
          { interviewNote: 'x' } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.APPLICATION_NOT_FOUND,
    );

    applicationRepository.findByIdForJob.mockResolvedValue({
      id: applicationId,
      resumeViewCount: 0,
      resumeDownloadCount: 0,
      jobId: openJob,
      studentId: studentId,
      status: ApplicationStatus.APPLIED,
      statusHistory: [],
    } as never);
    applicationRepository.updateById.mockResolvedValue({
      id: applicationId,
      jobId: openJob,
      studentId: studentId,
      status: ApplicationStatus.APPLIED,
      statusHistory: [],
    } as never);

    await service.updateApplicationResumeActivity(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      { action: 'viewed' } as never,
    );
    await service.updateApplicationResumeActivity(
      { id: recruiterId, role: UserRole.RECRUITER } as never,
      jobId,
      applicationId,
      { action: 'downloaded' } as never,
    );

    applicationRepository.findByIdForJob.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateApplicationResumeActivity(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
          applicationId,
          { action: 'viewed' } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.APPLICATION_NOT_FOUND,
    );

    applicationRepository.findByIdForJob.mockResolvedValue({
      id: applicationId,
      resumeViewCount: 1,
      resumeDownloadCount: 1,
      jobId: openJob,
      status: ApplicationStatus.APPLIED,
      statusHistory: [],
    } as never);
    applicationRepository.updateById.mockResolvedValueOnce(null as never);
    await expectApiError(
      () =>
        service.updateApplicationResumeActivity(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          jobId,
          applicationId,
          { action: 'downloaded' } as never,
        ),
      HttpStatus.NOT_FOUND,
      JOB_MESSAGES.APPLICATION_NOT_FOUND,
    );
  });

  it('should cover helper branches for access/feed/format/timeline/notification', async () => {
    await expectApiError(
      () =>
        service.updateJobPosting(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          'bad-id',
          { title: 'x' } as never,
        ),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );
    await expectApiError(
      () =>
        service.deleteJobPosting(
          { id: recruiterId, role: UserRole.RECRUITER } as never,
          'bad-id',
        ),
      HttpStatus.BAD_REQUEST,
      JOB_MESSAGES.INVALID_ID,
    );

    const internal = service as any;
    await expect(internal.assertCanAccessJob(
      { id: collegeUserId, role: UserRole.COLLEGE },
      {
        visibility: JobVisibility.COLLEGE_ONLY,
        collegeId: new Types.ObjectId(collegeId),
      },
    )).resolves.toBeUndefined();
    await expect(internal.assertCanAccessJob(
      { id: recruiterId, role: UserRole.RECRUITER },
      {
        visibility: JobVisibility.COLLEGE_ONLY,
        collegeId: new Types.ObjectId(collegeId),
      },
    )).rejects.toBeInstanceOf(ApiError);
    await expect(internal.assertCanAccessJob(
      { id: studentId, role: UserRole.STUDENT },
      {
        visibility: JobVisibility.COLLEGE_ONLY,
        collegeId: null,
      },
    )).resolves.toBeUndefined();

    collegeService.getMyCollege.mockResolvedValueOnce({ college: {} } as never);
    const collegeForceEmpty = await internal.resolveWorkspaceFeedOptions(
      { id: collegeUserId, role: UserRole.COLLEGE },
      { page: 1, size: 10 } as never,
    );
    expect(collegeForceEmpty.forceEmpty).toBe(true);

    const collegeScoped = await internal.resolveWorkspaceFeedOptions(
      { id: collegeUserId, role: UserRole.COLLEGE },
      { page: 1, size: 10, collegeId } as never,
    );
    expect(collegeScoped).toEqual(
      expect.objectContaining({ visibility: JobVisibility.COLLEGE_ONLY, collegeId }),
    );

    const unknownFeed = await internal.resolveFeedOptions(
      { id: recruiterId, role: UserRole.ADMIN },
      { page: 1, size: 10, feed: 'unknown' as never },
    );
    expect(unknownFeed).toEqual({});

    const acceptedByRecruiter = await internal.resolveFeedOptions(
      { id: recruiterId, role: UserRole.RECRUITER },
      { page: 1, size: 10, companyId, feed: JobFeedFilter.ACCEPTED },
    );
    expect(acceptedByRecruiter.forceEmpty).toBe(true);

    await expect(
      internal.resolveWritableWorkspace(
        { id: collegeUserId, role: UserRole.COLLEGE },
        { requestedCollegeId: collegeId },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        companyId: null,
        collegeId,
        visibility: JobVisibility.COLLEGE_ONLY,
      }),
    );

    expect(internal.buildJobResponse(null, new Map())).toBeNull();
    expect(internal.buildApplicationResponse(null)).toBeNull();
    expect(internal.toPreviewResumeUrl(null, null)).toBeNull();
    expect(internal.normalizeResumeFileName('', null)).toBe('');
    expect(internal.normalizeResumeFileName(undefined, null)).toBeNull();
    expect(internal.normalizeResumeFileName('resume', 'text/plain')).toBe('resume');
    expect(internal.extensionFromMimeType('text/plain')).toBeNull();

    const timeline = internal.buildApplicationTimeline({
      status: ApplicationStatus.REVIEWING,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      statusHistory: [{ foo: 'x' }, { status: null }, { status: ApplicationStatus.REVIEWING }],
    });
    expect(timeline).toHaveLength(7);

    await expect(
      internal.notifyCandidateOnApplicationUpdate({
        job: { title: 'Role', companyId: new Types.ObjectId(companyId) },
        existingApplication: {
          status: ApplicationStatus.APPLIED,
          interviewScheduledAt: null,
          studentId: { email: 'x@y.com' },
        },
        updatedApplication: {
          status: ApplicationStatus.APPLIED,
          interviewScheduledAt: null,
          studentId: { email: 'x@y.com' },
        },
      }),
    ).resolves.toBeUndefined();

    await expect(
      internal.notifyCandidateOnApplicationUpdate({
        job: { title: 'Role', companyId: new Types.ObjectId(companyId) },
        existingApplication: {
          status: ApplicationStatus.APPLIED,
          interviewScheduledAt: null,
          studentId: 'raw-id',
        },
        updatedApplication: {
          status: ApplicationStatus.REVIEWING,
          interviewScheduledAt: null,
          studentId: 'raw-id',
        },
        nextStatus: ApplicationStatus.REVIEWING,
      }),
    ).resolves.toBeUndefined();

    await expect(
      internal.notifyCandidateOnApplicationUpdate({
        job: { title: 'Role', collegeId: new Types.ObjectId(collegeId) },
        existingApplication: {
          status: ApplicationStatus.APPLIED,
          interviewScheduledAt: null,
          studentId: { name: 'No Email' },
        },
        updatedApplication: {
          status: ApplicationStatus.REVIEWING,
          interviewScheduledAt: new Date('2026-02-01T00:00:00.000Z'),
          studentId: { name: 'No Email' },
        },
      }),
    ).resolves.toBeUndefined();

    const originalFindByStudentAndJobIds =
      applicationRepository.findByStudentAndJobIds;
    (applicationRepository as unknown as { findByStudentAndJobIds?: unknown }).findByStudentAndJobIds =
      undefined;
    const noFinderMap = await internal.buildMyApplicationMetaByJobId(
      { id: studentId, role: UserRole.STUDENT },
      [jobId],
    );
    expect(noFinderMap.size).toBe(0);
    applicationRepository.findByStudentAndJobIds = originalFindByStudentAndJobIds;
  });
});
