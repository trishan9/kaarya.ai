import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import {
  COMPANY_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import {
  TCreateJobPostingDTO,
  TJobPostingQueryDTO,
  TUpdateJobPostingDTO,
} from 'src/dtos/jobs/job-posting.dto';
import {
  TCreateJobApplicationDTO,
  TJobApplicationsQueryDTO,
  TMyJobApplicationsQueryDTO,
  TUpdateJobApplicationDTO,
  TUpdateResumeActivityDTO,
} from 'src/dtos/jobs/job-application.dto';
import { ApplicationSchemaClass } from 'src/entities/application.schema';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { UserRole } from 'src/types/user-role.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { CompanyService } from './company.service';
import { EmailService } from './email.service';
import { RecruiterProfileService } from './recruiter-profile.service';

@Injectable()
export class JobPostingService {
  constructor(
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly resumeRepository: ACResumeRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly companyService: CompanyService,
    private readonly recruiterProfileService: RecruiterProfileService,
    private readonly emailService: EmailService,
  ) {}

  async createJobPosting(
    currentUser: TAuthenticatedUser,
    payload: TCreateJobPostingDTO,
  ) {
    const companyId = await this.resolveWritableCompanyId(currentUser, {
      requestedCompanyId: payload.companyId,
    });

    const company = await this.companyService.getCompanyByIdRaw(companyId);
    const createdJob = await this.jobPostingRepository.create({
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(currentUser.id),
      title: payload.title,
      description: payload.description,
      location: payload.location ?? company.location ?? 'Remote',
      employmentType: payload.employmentType ?? 'Full-Time',
      engagementType: payload.engagementType ?? 'Full-Time',
      workMode: payload.workMode ?? JobWorkMode.ONSITE,
      salaryRange: payload.salaryRange ?? 'Compensation not specified',
      requirements: payload.requirements ?? {},
      deadline: payload.deadline,
      status: payload.status ?? JobPostingStatus.OPEN,
    });

    const companyMap = await this.buildCompanyMap([companyId]);
    return this.buildJobResponse(createdJob, companyMap);
  }

  async getJobPostingById(currentUser: TAuthenticatedUser, jobId: string) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const job = await this.jobPostingRepository.findById(jobId);
    if (!job) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    const companyMap = await this.buildCompanyMap([job.companyId.toString()]);
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      [job.id],
    );
    return this.buildJobResponse(job, companyMap, {
      myApplicationByJobId,
    });
  }

  async recordJobView(jobId: string) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const updatedJob = await this.jobPostingRepository.incrementViewsCount(jobId);
    if (!updatedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    return this.buildJobMetricsResponse(updatedJob);
  }

  async getJobPostingMetrics(
    jobId: string,
    options?: { syncApplicationsCount?: boolean },
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    const shouldSyncApplicationsCount =
      options?.syncApplicationsCount === undefined
        ? true
        : options.syncApplicationsCount;

    if (!shouldSyncApplicationsCount) {
      return this.buildJobMetricsResponse(job);
    }

    return await this.syncApplicationsCountForJob(job.id);
  }

  async getAllJobPostings(
    currentUser: TAuthenticatedUser,
    query: TJobPostingQueryDTO,
  ) {
    const feedOptions = await this.resolveFeedOptions(currentUser, query);
    if (feedOptions.forceEmpty) {
      return {
        jobs: [],
        meta: buildPaginationMeta({
          page: query.page,
          size: query.size,
          totalItems: 0,
          search: query.search,
        }),
        activeFeed: query.feed,
      };
    }

    const { jobs, total } = await this.jobPostingRepository.findAll({
      ...query,
      ...feedOptions,
    });
    const companyIds = jobs.map((job) => job.companyId.toString());
    const companyMap = await this.buildCompanyMap(companyIds);
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      jobs.map((job) => job.id),
    );

    return {
      jobs: jobs
        .map((job) =>
          this.buildJobResponse(job, companyMap, {
            myApplicationByJobId,
          }),
        )
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
        search: query.search,
      }),
      activeFeed: query.feed,
    };
  }

  async getJobApplications(
    currentUser: TAuthenticatedUser,
    jobId: string,
    query: TJobApplicationsQueryDTO,
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanManageCompany(currentUser, job.companyId.toString());

    const { applications, total } =
      await this.applicationRepository.findAllByJobId({
        jobId: job.id,
        page: query.page,
        size: query.size,
        status: query.status,
      });

    return {
      applications: applications
        .map((application) => this.buildApplicationResponse(application))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
      jobId: job.id,
    };
  }

  async getMyApplications(
    currentUser: TAuthenticatedUser,
    query: TMyJobApplicationsQueryDTO,
  ) {
    this.assertCandidateRole(currentUser);

    const { applications, total } =
      await this.applicationRepository.findAllByStudentId({
        studentId: currentUser.id,
        page: query.page,
        size: query.size,
        status: query.status,
      });

    const jobIds = applications
      .map((application) => {
        const rawJob = (application as { jobId?: unknown }).jobId;
        if (typeof rawJob === 'object' && rawJob) {
          const sanitizedJob = sanitizeDocument(rawJob);
          if (sanitizedJob?.id && typeof sanitizedJob.id === 'string') {
            return sanitizedJob.id;
          }
        }
        return null;
      })
      .filter(Boolean) as string[];

    const companyIds = applications
      .map((application) => {
        const rawJob = (application as { jobId?: unknown }).jobId;
        if (typeof rawJob !== 'object' || !rawJob) return null;
        const sanitizedJob = sanitizeDocument(rawJob);
        if (!sanitizedJob) return null;
        const companyId =
          typeof sanitizedJob.companyId === 'string'
            ? sanitizedJob.companyId
            : ((sanitizedJob.companyId as { toString?: () => string } | undefined)
                ?.toString?.() ?? null);
        return companyId;
      })
      .filter(Boolean) as string[];

    const companyMap = await this.buildCompanyMap(companyIds);
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      jobIds,
    );

    return {
      applications: applications
        .map((application) =>
          this.buildApplicationResponse(application, {
            companyMap,
            myApplicationByJobId,
          }),
        )
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async getMyApplicationForJob(currentUser: TAuthenticatedUser, jobId: string) {
    this.assertCandidateRole(currentUser);

    const job = await this.getJobPostingByIdRaw(jobId);
    const application =
      await this.applicationRepository.findByJobIdAndStudentIdWithRelations(
        job.id,
        currentUser.id,
      );

    if (!application) {
      return null;
    }

    const companyMap = await this.buildCompanyMap([job.companyId.toString()]);
    return this.buildApplicationResponse(application, { companyMap });
  }

  async createJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    payload: TCreateJobApplicationDTO,
  ) {
    this.assertCandidateRole(currentUser);

    const job = await this.getJobPostingByIdRaw(jobId);
    if (job.status !== JobPostingStatus.OPEN) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Applications are closed for this job.',
      });
    }

    const existingApplication =
      await this.applicationRepository.findByJobIdAndStudentId(
        job.id,
        currentUser.id,
      );
    if (existingApplication) {
      throw new ApiError({
        statusCode: HttpStatus.CONFLICT,
        message: JOB_MESSAGES.APPLICATION_ALREADY_EXISTS,
      });
    }

    const selectedResume =
      payload.resumeId && isValidObjectId(payload.resumeId)
        ? await this.resumeRepository.findByIdAndStudentId(
            payload.resumeId,
            currentUser.id,
          )
        : null;

    if (payload.resumeId && !selectedResume) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Selected resume was not found for this user.',
      });
    }

    const normalizedResumeFileName = this.normalizeResumeFileName(
      payload.resumeFileName ??
        (selectedResume?.fileName as string | undefined),
      payload.resumeMimeType ?? (selectedResume?.mimeType as string | undefined),
    );

    const createdResume =
      !selectedResume && payload.resumeUrl && normalizedResumeFileName
        ? await this.resumeRepository.create({
            studentId: new Types.ObjectId(currentUser.id),
            type: 'job_application',
            fileName: normalizedResumeFileName,
            fileUrl: payload.resumeUrl,
            filePublicId: payload.resumePublicId ?? null,
            mimeType: payload.resumeMimeType ?? null,
            fileSize: payload.resumeFileSize ?? null,
          })
        : null;

    const linkedResume =
      createdResume ??
      (selectedResume
        ? {
            id: selectedResume.id,
            fileName: selectedResume.fileName,
          }
        : null);

    const createdApplication = await this.applicationRepository.create({
      jobId: new Types.ObjectId(job.id),
      studentId: new Types.ObjectId(currentUser.id),
      status: ApplicationStatus.APPLIED,
      resumeId: linkedResume ? new Types.ObjectId(linkedResume.id) : null,
      coverLetter: payload.coverLetter ?? null,
      portfolioLinks: payload.portfolioLinks ?? [],
      resumeFileName:
        normalizedResumeFileName ??
        (linkedResume?.fileName as string | undefined) ??
        null,
      statusHistory: [
        {
          status: ApplicationStatus.APPLIED,
          changedAt: new Date(),
          changedBy: new Types.ObjectId(currentUser.id),
        },
      ],
    });

    await this.syncApplicationsCountForJob(job.id);
    const hydratedApplication = await this.applicationRepository.findByIdForJob(
      job.id,
      createdApplication.id,
    );

    return this.buildApplicationResponse(hydratedApplication ?? createdApplication);
  }

  async updateJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateJobApplicationDTO,
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanManageCompany(currentUser, job.companyId.toString());

    const existingApplication = await this.applicationRepository.findByIdForJob(
      job.id,
      applicationId,
    );
    if (!existingApplication) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.APPLICATION_NOT_FOUND,
      });
    }

    const updatePayload: Partial<ApplicationSchemaClass> = {};
    let nextStatus: ApplicationStatus | undefined;

    if (payload.status) {
      nextStatus = payload.status;
      updatePayload.status = payload.status;
    }

    if (payload.interviewScheduledAt) {
      updatePayload.interviewScheduledAt = payload.interviewScheduledAt;
      updatePayload.invitedAt = new Date();
      if (!payload.status) {
        nextStatus = ApplicationStatus.INTERVIEW_SCHEDULED;
        updatePayload.status = ApplicationStatus.INTERVIEW_SCHEDULED;
      }
    }

    if (payload.interviewNote !== undefined) {
      updatePayload.interviewNote = payload.interviewNote ?? null;
    }

    updatePayload.reviewedBy = new Types.ObjectId(currentUser.id);
    if (nextStatus && nextStatus !== existingApplication.status) {
      const existingHistory = Array.isArray(existingApplication.statusHistory)
        ? existingApplication.statusHistory
        : [];
      updatePayload.statusHistory = [
        ...existingHistory,
        {
          status: nextStatus,
          changedAt: new Date(),
          changedBy: new Types.ObjectId(currentUser.id),
        },
      ];
    }

    const updatedApplication = await this.applicationRepository.updateById(
      existingApplication.id,
      updatePayload,
    );

    if (!updatedApplication) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.APPLICATION_NOT_FOUND,
      });
    }

    await this.notifyCandidateOnApplicationUpdate({
      job,
      existingApplication,
      updatedApplication,
      nextStatus,
    });

    const companyMap = await this.buildCompanyMap([job.companyId.toString()]);
    return this.buildApplicationResponse(updatedApplication, { companyMap });
  }

  async updateApplicationResumeActivity(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateResumeActivityDTO,
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanManageCompany(currentUser, job.companyId.toString());

    const application = await this.applicationRepository.findByIdForJob(
      job.id,
      applicationId,
    );
    if (!application) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.APPLICATION_NOT_FOUND,
      });
    }

    const now = new Date();
    const updatePayload: Partial<ApplicationSchemaClass> = {
      resumeLastActionAt: now,
      resumeLastActionBy: new Types.ObjectId(currentUser.id),
    };

    if (payload.action === 'viewed') {
      updatePayload.resumeViewedAt = now;
      updatePayload.resumeViewCount = (application.resumeViewCount ?? 0) + 1;
    }

    if (payload.action === 'downloaded') {
      updatePayload.resumeDownloadedAt = now;
      updatePayload.resumeDownloadCount =
        (application.resumeDownloadCount ?? 0) + 1;
    }

    const updatedApplication = await this.applicationRepository.updateById(
      application.id,
      updatePayload,
    );
    if (!updatedApplication) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.APPLICATION_NOT_FOUND,
      });
    }

    const companyMap = await this.buildCompanyMap([job.companyId.toString()]);
    return this.buildApplicationResponse(updatedApplication, { companyMap });
  }

  async updateJobPosting(
    currentUser: TAuthenticatedUser,
    jobId: string,
    payload: TUpdateJobPostingDTO,
  ) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const existingJob = await this.jobPostingRepository.findById(jobId);
    if (!existingJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    await this.assertCanManageCompany(
      currentUser,
      existingJob.companyId.toString(),
    );

    const updatedJob = await this.jobPostingRepository.updateById(
      jobId,
      payload,
    );
    if (!updatedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    const companyMap = await this.buildCompanyMap([
      updatedJob.companyId.toString(),
    ]);
    return this.buildJobResponse(updatedJob, companyMap);
  }

  async deleteJobPosting(currentUser: TAuthenticatedUser, jobId: string) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const existingJob = await this.jobPostingRepository.findById(jobId);
    if (!existingJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    await this.assertCanManageCompany(
      currentUser,
      existingJob.companyId.toString(),
    );

    const deletedJob = await this.jobPostingRepository.deleteById(jobId);
    if (!deletedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    const companyMap = await this.buildCompanyMap([
      existingJob.companyId.toString(),
    ]);
    return this.buildJobResponse(deletedJob, companyMap);
  }

  private async resolveWritableCompanyId(
    currentUser: TAuthenticatedUser,
    input: {
      requestedCompanyId?: string;
    },
  ): Promise<string> {
    if (currentUser.role === UserRole.ADMIN) {
      if (
        !input.requestedCompanyId ||
        !isValidObjectId(input.requestedCompanyId)
      ) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: COMPANY_MESSAGES.INVALID_ID,
        });
      }

      return input.requestedCompanyId;
    }

    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    return await this.recruiterProfileService.resolveWritableCompanyIdForRecruiter(
      {
        recruiterId: currentUser.id,
        requestedCompanyId: input.requestedCompanyId,
      },
    );
  }

  private async assertCanManageCompany(
    currentUser: TAuthenticatedUser,
    companyId: string,
  ) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    await this.recruiterProfileService.assertRecruiterMembership({
      recruiterId: currentUser.id,
      companyId,
    });
  }

  private async getJobPostingByIdRaw(jobId: string) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const job = await this.jobPostingRepository.findById(jobId);
    if (!job) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    return job;
  }

  private async syncApplicationsCountForJob(jobId: string) {
    const applicationsCount = await this.applicationRepository.countByJobId(jobId);
    const updatedJob = await this.jobPostingRepository.setApplicationsCount(
      jobId,
      applicationsCount,
    );

    if (!updatedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    return this.buildJobMetricsResponse(updatedJob);
  }

  private async resolveFeedOptions(
    currentUser: TAuthenticatedUser,
    query: TJobPostingQueryDTO,
  ): Promise<{
    sort?: Record<string, 1 | -1>;
    createdFrom?: Date;
    jobIds?: string[];
    remoteOnly?: boolean;
    status?: JobPostingStatus;
    forceEmpty?: boolean;
  }> {
    if (query.feed === JobFeedFilter.ALL) {
      return {};
    }

    if (query.feed === JobFeedFilter.TRENDING) {
      return {
        sort: {
          applicationsCount: -1,
          viewsCount: -1,
          createdAt: -1,
          _id: -1,
        },
      };
    }

    if (query.feed === JobFeedFilter.LAST_WEEK) {
      return {
        createdFrom: this.daysAgo(7),
      };
    }

    if (query.feed === JobFeedFilter.FOR_YOU) {
      return {
        status: query.status ?? JobPostingStatus.OPEN,
        remoteOnly: query.remoteOnly ?? false,
        sort: {
          applicationsCount: -1,
          createdAt: -1,
          _id: -1,
        },
      };
    }

    if (
      query.feed === JobFeedFilter.ACCEPTED ||
      query.feed === JobFeedFilter.REJECTED
    ) {
      if (
        currentUser.role !== UserRole.STUDENT &&
        currentUser.role !== UserRole.USER
      ) {
        return { forceEmpty: true };
      }

      const statuses =
        query.feed === JobFeedFilter.ACCEPTED
          ? [ApplicationStatus.ACCEPTED]
          : [ApplicationStatus.REJECTED];

      const jobIds = await this.applicationRepository.findJobIdsByStudentAndStatuses(
        {
          studentId: currentUser.id,
          statuses,
        },
      );

      if (!jobIds.length) {
        return { forceEmpty: true };
      }

      return { jobIds };
    }

    return {};
  }

  private async buildCompanyMap(companyIds: string[]) {
    const validCompanyIds = companyIds.filter((companyId) =>
      isValidObjectId(companyId),
    );
    if (!validCompanyIds.length) {
      return new Map<string, { id: string; name: string; logo: string | null }>();
    }

    const companies = await this.companyRepository.findByIds(validCompanyIds);
    const companyMap = new Map<
      string,
      { id: string; name: string; logo: string | null }
    >();

    companies.forEach((company) => {
      const companyId = company.id.toString();
      companyMap.set(companyId, {
        id: companyId,
        name: company.name,
        logo: company.logo ?? null,
      });
    });

    return companyMap;
  }

  private buildJobResponse(
    job: unknown,
    companyMap: Map<string, { id: string; name: string; logo: string | null }>,
    options?: {
      myApplicationByJobId?: Map<
        string,
        { applicationId: string; status: ApplicationStatus }
      >;
    },
  ) {
    const jobData = sanitizeDocument(job);
    if (!jobData) return null;

    const companyId =
      typeof jobData.companyId === 'string'
        ? jobData.companyId
        : ((jobData.companyId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);
    const company = companyId ? (companyMap.get(companyId) ?? null) : null;
    const jobId = typeof jobData.id === 'string' ? jobData.id : null;
    const myApplication =
      jobId && options?.myApplicationByJobId
        ? (options.myApplicationByJobId.get(jobId) ?? null)
        : null;

    return {
      ...jobData,
      // Frontend derives UI labels (status tone, apply CTA text, etc.) from domain data.
      company,
      hasApplied: Boolean(myApplication),
      myApplicationId: myApplication?.applicationId ?? null,
      myApplicationStatus: myApplication?.status ?? null,
    };
  }

  private buildJobMetricsResponse(job: {
    id: string;
    viewsCount?: number;
    applicationsCount?: number;
  }) {
    return {
      jobId: job.id,
      viewsCount: job.viewsCount ?? 0,
      applicationsCount: job.applicationsCount ?? 0,
    };
  }

  private buildApplicationResponse(
    application: unknown,
    options?: {
      companyMap?: Map<string, { id: string; name: string; logo: string | null }>;
      myApplicationByJobId?: Map<
        string,
        { applicationId: string; status: ApplicationStatus }
      >;
    },
  ) {
    const applicationData = sanitizeDocument(application);
    if (!applicationData) return null;

    const studentRaw = (application as { studentId?: unknown }).studentId;
    const student =
      typeof studentRaw === 'object' && studentRaw
        ? sanitizeDocument(studentRaw)
        : null;
    const resumeRaw = (application as { resumeId?: unknown }).resumeId;
    const resume =
      typeof resumeRaw === 'object' && resumeRaw
        ? sanitizeDocument(resumeRaw)
        : null;
    const jobRaw = (application as { jobId?: unknown }).jobId;
    const jobData =
      typeof jobRaw === 'object' && jobRaw ? sanitizeDocument(jobRaw) : null;
    const jobId =
      (typeof applicationData.jobId === 'string'
        ? applicationData.jobId
        : ((applicationData.jobId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null)) ??
      (jobData?.id as string | undefined) ??
      null;
    const jobCompanyId =
      (typeof jobData?.companyId === 'string'
        ? jobData.companyId
        : ((jobData?.companyId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null)) ??
      null;
    const company = jobCompanyId
      ? (options?.companyMap?.get(jobCompanyId) ?? null)
      : null;
    const resumeData = this.buildResumeViewModel(
      resume,
      applicationData.resumeFileName as string | undefined,
    );
    const timeline = this.buildApplicationTimeline(applicationData);
    const myApplication =
      jobId && options?.myApplicationByJobId
        ? (options.myApplicationByJobId.get(jobId) ?? null)
        : null;

    return {
      ...applicationData,
      hasApplied:
        typeof applicationData.hasApplied === 'boolean'
          ? applicationData.hasApplied
          : Boolean(myApplication ?? jobId),
      myApplicationId:
        (typeof applicationData.myApplicationId === 'string'
          ? applicationData.myApplicationId
          : null) ??
        myApplication?.applicationId ??
        (typeof applicationData.id === 'string' ? applicationData.id : null),
      myApplicationStatus:
        (typeof applicationData.myApplicationStatus === 'string'
          ? applicationData.myApplicationStatus
          : null) ??
        myApplication?.status ??
        (typeof applicationData.status === 'string'
          ? applicationData.status
          : null),
      candidate: student
        ? {
            id: student.id ?? applicationData.studentId,
            name: student.name ?? null,
            email: student.email ?? null,
            photo: student.photo ?? null,
          }
        : null,
      resume: resumeData,
      resumeActivity: {
        viewedAt: this.toIsoDateString(applicationData.resumeViewedAt),
        downloadedAt: this.toIsoDateString(applicationData.resumeDownloadedAt),
        viewCount:
          typeof applicationData.resumeViewCount === 'number'
            ? applicationData.resumeViewCount
            : 0,
        downloadCount:
          typeof applicationData.resumeDownloadCount === 'number'
            ? applicationData.resumeDownloadCount
            : 0,
      },
      timeline,
      student:
        student ??
        (typeof applicationData.studentId === 'string'
          ? { id: applicationData.studentId }
          : null),
      job:
        jobData && jobId
          ? {
              ...jobData,
              company,
            }
          : typeof applicationData.jobId === 'string'
            ? {
                id: applicationData.jobId,
                company: null,
              }
            : null,
    };
  }

  private buildResumeViewModel(
    resumeData: Record<string, unknown> | null,
    fallbackFileName?: string,
  ) {
    if (!resumeData) {
      return typeof fallbackFileName === 'string'
        ? { fileName: this.normalizeResumeFileName(fallbackFileName) }
        : null;
    }

    const fileUrl =
      typeof resumeData.fileUrl === 'string' ? resumeData.fileUrl : null;
    const mimeType =
      typeof resumeData.mimeType === 'string' ? resumeData.mimeType : null;
    const fileName = this.normalizeResumeFileName(
      typeof resumeData.fileName === 'string'
        ? resumeData.fileName
        : fallbackFileName,
      mimeType ?? undefined,
    );

    return {
      ...resumeData,
      fileName,
      fileUrl,
      previewUrl: this.toPreviewResumeUrl(fileUrl, mimeType),
      downloadUrl: this.toDownloadResumeUrl(fileUrl),
    };
  }

  private toPreviewResumeUrl(fileUrl: string | null, mimeType: string | null) {
    if (!fileUrl) return null;

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    }

    return fileUrl;
  }

  private toDownloadResumeUrl(fileUrl: string | null) {
    if (!fileUrl) return null;
    return fileUrl;
  }

  private normalizeResumeFileName(fileName?: string, mimeType?: string | null) {
    if (!fileName || !fileName.trim()) {
      if (mimeType) {
        const extension = this.extensionFromMimeType(mimeType);
        if (extension) {
          return `resume${extension}`;
        }
      }
      return fileName ?? null;
    }

    const trimmed = fileName.trim();
    if (!/\.[a-z0-9]+$/i.test(trimmed) && mimeType) {
      const extension = this.extensionFromMimeType(mimeType);
      if (extension) {
        return `${trimmed}${extension}`;
      }
    }

    return trimmed;
  }

  private extensionFromMimeType(mimeType: string) {
    if (mimeType === 'application/pdf') {
      return '.pdf';
    }

    if (mimeType === 'application/msword') {
      return '.doc';
    }

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return '.docx';
    }

    return null;
  }

  private buildApplicationTimeline(applicationData: Record<string, unknown>) {
    const stageOrder: Array<{ key: string; label: string; minOrder: number }> = [
      { key: 'submitted', label: 'Application Submitted', minOrder: 1 },
      { key: 'screening', label: 'Application Screening', minOrder: 2 },
      { key: 'hr_interview', label: 'HR Interview', minOrder: 3 },
      { key: 'assessment', label: 'Assessment', minOrder: 4 },
      { key: 'second_interview', label: 'Second Interview', minOrder: 5 },
      { key: 'offering', label: 'Offering', minOrder: 6 },
      { key: 'accepted', label: 'Accepted', minOrder: 7 },
    ];

    const currentStatus =
      typeof applicationData.status === 'string'
        ? (applicationData.status as ApplicationStatus)
        : ApplicationStatus.APPLIED;
    const progressOrderByStatus: Record<ApplicationStatus, number> = {
      [ApplicationStatus.APPLIED]: 1,
      [ApplicationStatus.REVIEWING]: 2,
      [ApplicationStatus.SHORTLISTED]: 3,
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 5,
      [ApplicationStatus.ACCEPTED]: 7,
      [ApplicationStatus.REJECTED]: 1,
      [ApplicationStatus.WITHDRAWN]: 1,
    };
    const currentStageKeyByStatus: Record<ApplicationStatus, string> = {
      [ApplicationStatus.APPLIED]: 'submitted',
      [ApplicationStatus.REVIEWING]: 'screening',
      [ApplicationStatus.SHORTLISTED]: 'hr_interview',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'second_interview',
      [ApplicationStatus.ACCEPTED]: 'accepted',
      [ApplicationStatus.REJECTED]: 'submitted',
      [ApplicationStatus.WITHDRAWN]: 'submitted',
    };
    const currentStage = currentStageKeyByStatus[currentStatus];
    const maxProgress = progressOrderByStatus[currentStatus];
    const statusHistory = Array.isArray(applicationData.statusHistory)
      ? applicationData.statusHistory
      : [];

    return stageOrder.map((stage) => {
      const reached = stage.minOrder <= maxProgress;
      const matchedHistory = statusHistory.find((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        const status =
          typeof (entry as { status?: unknown }).status === 'string'
            ? ((entry as { status: string }).status as ApplicationStatus)
            : null;
        if (!status) return false;
        return progressOrderByStatus[status] >= stage.minOrder;
      });
      const at =
        matchedHistory &&
        this.toIsoDateString((matchedHistory as { changedAt?: unknown }).changedAt)
          ? this.toIsoDateString(
              (matchedHistory as { changedAt?: unknown }).changedAt,
            )
          : stage.key === 'submitted' &&
              this.toIsoDateString(applicationData.createdAt)
            ? this.toIsoDateString(applicationData.createdAt)
            : null;

      return {
        key: stage.key,
        label: stage.label,
        reached,
        at,
        isCurrent: reached && stage.key === currentStage,
      };
    });
  }

  private async notifyCandidateOnApplicationUpdate(input: {
    job: { title: string; companyId: { toString: () => string } };
    existingApplication: ApplicationSchemaClass;
    updatedApplication: ApplicationSchemaClass;
    nextStatus?: ApplicationStatus;
  }) {
    const statusChanged =
      Boolean(input.nextStatus) &&
      input.nextStatus !== input.existingApplication.status;
    const previousInterviewAt = this.toIsoDateString(
      input.existingApplication.interviewScheduledAt,
    );
    const nextInterviewAt = this.toIsoDateString(
      input.updatedApplication.interviewScheduledAt,
    );
    const interviewChanged = previousInterviewAt !== nextInterviewAt;

    if (!statusChanged && !interviewChanged) {
      return;
    }

    const studentRaw =
      (input.updatedApplication as { studentId?: unknown }).studentId ??
      (input.existingApplication as { studentId?: unknown }).studentId;
    if (typeof studentRaw !== 'object' || !studentRaw) {
      return;
    }

    const student = sanitizeDocument(studentRaw);
    const email = typeof student?.email === 'string' ? student.email : null;
    if (!email) {
      return;
    }

    const companyId = input.job.companyId.toString();
    const companyMap = await this.buildCompanyMap([companyId]);
    const companyName = companyMap.get(companyId)?.name ?? 'the company';
    const finalStatus = input.nextStatus ?? input.updatedApplication.status;

    try {
      await this.emailService.sendApplicationStatusUpdate(email, {
        candidateName:
          typeof student?.name === 'string' ? student.name : undefined,
        companyName,
        jobTitle: input.job.title,
        status: finalStatus,
        interviewScheduledAt: nextInterviewAt ?? undefined,
      });
    } catch {
      // Updating the application must not fail when notification email delivery fails.
    }
  }

  private assertCandidateRole(currentUser: TAuthenticatedUser) {
    if (
      currentUser.role !== UserRole.STUDENT &&
      currentUser.role !== UserRole.USER
    ) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: JOB_MESSAGES.APPLICATION_FORBIDDEN,
      });
    }
  }

  private async buildMyApplicationMetaByJobId(
    currentUser: TAuthenticatedUser,
    jobIds: string[],
  ): Promise<Map<string, { applicationId: string; status: ApplicationStatus }>> {
    const map = new Map<string, { applicationId: string; status: ApplicationStatus }>();
    if (
      (currentUser.role !== UserRole.STUDENT && currentUser.role !== UserRole.USER) ||
      !jobIds.length
    ) {
      return map;
    }

    const rows = await this.applicationRepository.findByStudentAndJobIds({
      studentId: currentUser.id,
      jobIds,
    });
    rows.forEach((row) => {
      map.set(row.jobId, {
        applicationId: row.applicationId,
        status: row.status,
      });
    });
    return map;
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private toIsoDateString(value: unknown) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    return null;
  }
}
