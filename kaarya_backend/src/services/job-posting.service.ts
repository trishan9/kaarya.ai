import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import {
  COLLEGE_MESSAGES,
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
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACBookmarkRepository } from 'src/repositories/bookmark.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { CollegeService } from './college.service';
import { CompanyService } from './company.service';
import { EmailService } from './email.service';
import { GamificationService } from './gamification.service';
import { RecruiterProfileService } from './recruiter-profile.service';
import { StudentService } from './student.service';

@Injectable()
export class JobPostingService {
  constructor(
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly bookmarkRepository: ACBookmarkRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly resumeRepository: ACResumeRepository,
    private readonly collegeRepository: ACCollegeRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly collegeService: CollegeService,
    private readonly companyService: CompanyService,
    private readonly studentService: StudentService,
    private readonly recruiterProfileService: RecruiterProfileService,
    private readonly emailService: EmailService,
    private readonly gamificationService: GamificationService,
  ) {}

  async createJobPosting(
    currentUser: TAuthenticatedUser,
    payload: TCreateJobPostingDTO,
  ) {
    const writableWorkspace = await this.resolveWritableWorkspace(currentUser, {
      requestedCompanyId: payload.companyId,
      requestedCollegeId: payload.collegeId,
      requestedVisibility: payload.visibility,
    });

    const company = writableWorkspace.companyId
      ? await this.companyService.getCompanyByIdRaw(writableWorkspace.companyId)
      : null;
    const college = writableWorkspace.collegeId
      ? await this.collegeService.getCollegeByIdRaw(writableWorkspace.collegeId)
      : null;

    const createdJob = await this.jobPostingRepository.create({
      companyId: writableWorkspace.companyId
        ? new Types.ObjectId(writableWorkspace.companyId)
        : null,
      collegeId: writableWorkspace.collegeId
        ? new Types.ObjectId(writableWorkspace.collegeId)
        : null,
      visibility: writableWorkspace.visibility,
      createdBy: new Types.ObjectId(currentUser.id),
      title: payload.title,
      description: payload.description,
      location:
        payload.location ?? company?.location ?? college?.location ?? 'Remote',
      employmentType: payload.employmentType ?? 'Full-Time',
      engagementType: payload.engagementType ?? 'Full-Time',
      workMode: payload.workMode ?? JobWorkMode.ONSITE,
      salaryRange: payload.salaryRange ?? 'Compensation not specified',
      requirements: payload.requirements ?? {},
      deadline: payload.deadline,
      status: payload.status ?? JobPostingStatus.OPEN,
    });
    const companyMap = await this.buildCompanyMap(
      writableWorkspace.companyId ? [writableWorkspace.companyId] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      writableWorkspace.collegeId ? [writableWorkspace.collegeId] : [],
    );
    return this.buildJobResponse(createdJob, companyMap, { collegeMap });
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
    await this.assertCanAccessJob(currentUser, job);

    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      [job.id],
    );
    const savedJobIds = await this.buildSavedJobIdSet(currentUser, [job.id]);
    return this.buildJobResponse(job, companyMap, {
      collegeMap,
      myApplicationByJobId,
      savedJobIds,
    });
  }

  async recordJobView(currentUser: TAuthenticatedUser, jobId: string) {
    if (!jobId || !isValidObjectId(jobId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: JOB_MESSAGES.INVALID_ID,
      });
    }

    const updatedJob =
      await this.jobPostingRepository.incrementViewsCount(jobId);
    if (!updatedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    if (
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT
    ) {
      await this.gamificationService.awardJobViewed({
        userId: currentUser.id,
        jobId,
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
    const companyIds = jobs
      .map((job) => (job.companyId ? job.companyId.toString() : null))
      .filter(Boolean) as string[];
    const collegeIds = jobs
      .map((job) => (job.collegeId ? job.collegeId.toString() : null))
      .filter(Boolean) as string[];
    const companyMap = await this.buildCompanyMap(companyIds);
    const collegeMap = await this.buildCollegeMap(collegeIds);
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      jobs.map((job) => job.id),
    );
    const savedJobIds = await this.buildSavedJobIdSet(
      currentUser,
      jobs.map((job) => job.id),
    );

    return {
      jobs: jobs
        .map((job) =>
          this.buildJobResponse(job, companyMap, {
            collegeMap,
            myApplicationByJobId,
            savedJobIds,
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
    await this.assertCanManageJob(currentUser, job);

    const { applications, total } =
      await this.applicationRepository.findAllByJobId({
        jobId: job.id,
        page: query.page,
        size: query.size,
        status: query.status,
      });

    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );

    return {
      applications: applications
        .map((application) =>
          this.buildApplicationResponse(application, {
            companyMap,
            collegeMap,
          }),
        )
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
            : ((
                sanitizedJob.companyId as
                  | { toString?: () => string }
                  | undefined
              )?.toString?.() ?? null);
        return companyId;
      })
      .filter(Boolean) as string[];

    const collegeIds = applications
      .map((application) => {
        const rawJob = (application as { jobId?: unknown }).jobId;
        if (typeof rawJob !== 'object' || !rawJob) return null;
        const sanitizedJob = sanitizeDocument(rawJob);
        if (!sanitizedJob) return null;
        const collegeId =
          typeof sanitizedJob.collegeId === 'string'
            ? sanitizedJob.collegeId
            : ((
                sanitizedJob.collegeId as
                  | { toString?: () => string }
                  | undefined
              )?.toString?.() ?? null);
        return collegeId;
      })
      .filter(Boolean) as string[];

    const companyMap = await this.buildCompanyMap(companyIds);
    const collegeMap = await this.buildCollegeMap(collegeIds);
    const myApplicationByJobId = await this.buildMyApplicationMetaByJobId(
      currentUser,
      jobIds,
    );

    return {
      applications: applications
        .map((application) =>
          this.buildApplicationResponse(application, {
            companyMap,
            collegeMap,
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
    await this.assertCanAccessJob(currentUser, job);
    const application =
      await this.applicationRepository.findByJobIdAndStudentIdWithRelations(
        job.id,
        currentUser.id,
      );

    if (!application) {
      return null;
    }

    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );
    return this.buildApplicationResponse(application, {
      companyMap,
      collegeMap,
    });
  }

  async createJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    payload: TCreateJobApplicationDTO,
  ) {
    this.assertCandidateRole(currentUser);

    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanAccessJob(currentUser, job);
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
      payload.resumeMimeType ??
        (selectedResume?.mimeType as string | undefined),
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

    await this.gamificationService.awardJobApplicationSubmitted({
      userId: currentUser.id,
      applicationId: createdApplication.id,
      jobId: job.id,
    });

    await this.syncApplicationsCountForJob(job.id);
    const hydratedApplication = await this.applicationRepository.findByIdForJob(
      job.id,
      createdApplication.id,
    );
    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );

    return this.buildApplicationResponse(
      hydratedApplication ?? createdApplication,
      { companyMap, collegeMap },
    );
  }

  async updateJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateJobApplicationDTO,
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanManageJob(currentUser, job);

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

    if (nextStatus && nextStatus !== existingApplication.status) {
      const studentRaw = existingApplication.studentId as unknown;
      const studentId =
        typeof studentRaw === 'string'
          ? studentRaw
          : ((studentRaw as { id?: string }).id ??
            (
              studentRaw as { _id?: { toString?: () => string } }
            )._id?.toString?.() ??
            (studentRaw as { toString?: () => string }).toString?.() ??
            null);
      if (studentId && nextStatus === ApplicationStatus.SHORTLISTED) {
        await this.gamificationService.awardApplicationStatus({
          userId: studentId,
          applicationId: existingApplication.id,
          status: 'shortlisted',
        });
      } else if (
        studentId &&
        nextStatus === ApplicationStatus.INTERVIEW_SCHEDULED
      ) {
        await this.gamificationService.awardApplicationStatus({
          userId: studentId,
          applicationId: existingApplication.id,
          status: 'interview_scheduled',
        });
      } else if (studentId && nextStatus === ApplicationStatus.ACCEPTED) {
        await this.gamificationService.awardApplicationStatus({
          userId: studentId,
          applicationId: existingApplication.id,
          status: 'accepted',
        });
      } else if (studentId && nextStatus === ApplicationStatus.REJECTED) {
        await this.gamificationService.awardApplicationStatus({
          userId: studentId,
          applicationId: existingApplication.id,
          status: 'rejected',
        });
      }
    }

    await this.notifyCandidateOnApplicationUpdate({
      job,
      existingApplication,
      updatedApplication,
      nextStatus,
    });

    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );
    return this.buildApplicationResponse(updatedApplication, {
      companyMap,
      collegeMap,
    });
  }

  async updateApplicationResumeActivity(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateResumeActivityDTO,
  ) {
    const job = await this.getJobPostingByIdRaw(jobId);
    await this.assertCanManageJob(currentUser, job);

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

    const companyMap = await this.buildCompanyMap(
      job.companyId ? [job.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      job.collegeId ? [job.collegeId.toString()] : [],
    );
    return this.buildApplicationResponse(updatedApplication, {
      companyMap,
      collegeMap,
    });
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

    await this.assertCanManageJob(currentUser, existingJob);

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

    const companyMap = await this.buildCompanyMap(
      updatedJob.companyId ? [updatedJob.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      updatedJob.collegeId ? [updatedJob.collegeId.toString()] : [],
    );
    return this.buildJobResponse(updatedJob, companyMap, { collegeMap });
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

    await this.assertCanManageJob(currentUser, existingJob);

    const deletedJob = await this.jobPostingRepository.deleteById(jobId);
    if (!deletedJob) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: JOB_MESSAGES.NOT_FOUND,
      });
    }

    const companyMap = await this.buildCompanyMap(
      existingJob.companyId ? [existingJob.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      existingJob.collegeId ? [existingJob.collegeId.toString()] : [],
    );
    return this.buildJobResponse(deletedJob, companyMap, { collegeMap });
  }

  private async resolveWritableWorkspace(
    currentUser: TAuthenticatedUser,
    input: {
      requestedCompanyId?: string;
      requestedCollegeId?: string;
      requestedVisibility?: JobVisibility;
    },
  ): Promise<{
    companyId: string | null;
    collegeId: string | null;
    visibility: JobVisibility;
  }> {
    if (currentUser.role === UserRole.ADMIN) {
      if (input.requestedCollegeId) {
        if (!isValidObjectId(input.requestedCollegeId)) {
          throw new ApiError({
            statusCode: HttpStatus.BAD_REQUEST,
            message: COLLEGE_MESSAGES.INVALID_ID,
          });
        }

        return {
          companyId: null,
          collegeId: input.requestedCollegeId,
          visibility: input.requestedVisibility ?? JobVisibility.COLLEGE_ONLY,
        };
      }

      if (
        !input.requestedCompanyId ||
        !isValidObjectId(input.requestedCompanyId)
      ) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: COMPANY_MESSAGES.INVALID_ID,
        });
      }

      return {
        companyId: input.requestedCompanyId,
        collegeId: null,
        visibility: input.requestedVisibility ?? JobVisibility.GLOBAL,
      };
    }

    if (currentUser.role === UserRole.RECRUITER) {
      const companyId =
        await this.recruiterProfileService.resolveWritableCompanyIdForRecruiter(
          {
            recruiterId: currentUser.id,
            requestedCompanyId: input.requestedCompanyId,
          },
        );

      return {
        companyId,
        collegeId: null,
        visibility: JobVisibility.GLOBAL,
      };
    }

    if (currentUser.role === UserRole.COLLEGE) {
      let collegeId = input.requestedCollegeId;
      if (collegeId) {
        await this.collegeService.assertCanManageCollege(
          currentUser,
          collegeId,
        );
      } else {
        const myCollege = await this.collegeService.getMyCollege(currentUser);
        collegeId = (myCollege.college as { id?: string } | undefined)?.id;
      }

      if (!collegeId) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: COLLEGE_MESSAGES.COLLEGE_CONTEXT_REQUIRED,
        });
      }

      return {
        companyId: null,
        collegeId,
        visibility: JobVisibility.COLLEGE_ONLY,
      };
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    });
  }

  private async assertCanManageJob(
    currentUser: TAuthenticatedUser,
    job: {
      companyId?: { toString: () => string } | null;
      collegeId?: { toString: () => string } | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    const companyId = job.companyId ? job.companyId.toString() : null;
    const collegeId = job.collegeId ? job.collegeId.toString() : null;

    if (companyId && currentUser.role === UserRole.RECRUITER) {
      await this.recruiterProfileService.assertRecruiterMembership({
        recruiterId: currentUser.id,
        companyId,
      });
      return;
    }

    if (collegeId && currentUser.role === UserRole.COLLEGE) {
      await this.collegeService.assertCanManageCollege(currentUser, collegeId);
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: JOB_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    });
  }

  private async assertCanAccessJob(
    currentUser: TAuthenticatedUser,
    job: {
      visibility?: JobVisibility;
      collegeId?: { toString: () => string } | null;
    },
  ) {
    if (job.visibility !== JobVisibility.COLLEGE_ONLY) {
      return;
    }

    const collegeId = job.collegeId ? job.collegeId.toString() : null;
    if (!collegeId) {
      return;
    }

    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.COLLEGE) {
      await this.collegeService.assertCanManageCollege(currentUser, collegeId);
      return;
    }

    if (
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT
    ) {
      await this.studentService.assertStudentMembership({
        studentId: currentUser.id,
        collegeId,
      });
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: JOB_MESSAGES.APPLICATION_FORBIDDEN,
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
    const applicationsCount =
      await this.applicationRepository.countByJobId(jobId);
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
    visibility?: JobVisibility;
    companyId?: string;
    collegeId?: string;
    accessibleCollegeIds?: string[];
    forceEmpty?: boolean;
  }> {
    const workspaceOptions = await this.resolveWorkspaceFeedOptions(
      currentUser,
      query,
    );
    if (workspaceOptions.forceEmpty) {
      return workspaceOptions;
    }

    if (query.feed === JobFeedFilter.ALL) {
      return workspaceOptions;
    }

    if (query.feed === JobFeedFilter.TRENDING) {
      return {
        ...workspaceOptions,
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
        ...workspaceOptions,
        createdFrom: this.daysAgo(7),
      };
    }

    if (query.feed === JobFeedFilter.FOR_YOU) {
      return {
        ...workspaceOptions,
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
        return { ...workspaceOptions, forceEmpty: true };
      }

      const statuses =
        query.feed === JobFeedFilter.ACCEPTED
          ? [ApplicationStatus.ACCEPTED]
          : [ApplicationStatus.REJECTED];

      const jobIds =
        await this.applicationRepository.findJobIdsByStudentAndStatuses({
          studentId: currentUser.id,
          statuses,
        });

      if (!jobIds.length) {
        return { ...workspaceOptions, forceEmpty: true };
      }

      return { ...workspaceOptions, jobIds };
    }

    return workspaceOptions;
  }

  private async resolveWorkspaceFeedOptions(
    currentUser: TAuthenticatedUser,
    query: TJobPostingQueryDTO,
  ): Promise<{
    visibility?: JobVisibility;
    companyId?: string;
    collegeId?: string;
    accessibleCollegeIds?: string[];
    forceEmpty?: boolean;
  }> {
    if (currentUser.role === UserRole.RECRUITER) {
      if (!query.companyId) {
        return { forceEmpty: true };
      }

      const companyId =
        await this.recruiterProfileService.resolveWritableCompanyIdForRecruiter(
          {
            recruiterId: currentUser.id,
            requestedCompanyId: query.companyId,
          },
        );

      return {
        visibility: query.visibility ?? JobVisibility.GLOBAL,
        companyId,
      };
    }

    if (currentUser.role === UserRole.COLLEGE) {
      let collegeId = query.collegeId;
      if (collegeId) {
        await this.collegeService.assertCanManageCollege(
          currentUser,
          collegeId,
        );
      } else {
        try {
          const myCollege = await this.collegeService.getMyCollege(currentUser);
          collegeId = (myCollege.college as { id?: string } | undefined)?.id;
        } catch {
          return { forceEmpty: true };
        }
      }

      if (!collegeId) {
        return { forceEmpty: true };
      }

      return {
        visibility: JobVisibility.COLLEGE_ONLY,
        collegeId,
      };
    }

    if (
      currentUser.role === UserRole.USER ||
      currentUser.role === UserRole.STUDENT
    ) {
      const membershipCollegeIds =
        await this.studentService.listStudentCollegeIds(currentUser.id);
      const accessibleCollegeIds = query.collegeId
        ? membershipCollegeIds.includes(query.collegeId)
          ? [query.collegeId]
          : []
        : membershipCollegeIds;

      return {
        visibility: query.visibility,
        companyId: query.companyId,
        accessibleCollegeIds,
      };
    }

    return {
      visibility: query.visibility,
      companyId: query.companyId,
      collegeId: query.collegeId,
    };
  }

  private async buildCompanyMap(companyIds: string[]) {
    const validCompanyIds = companyIds.filter((companyId) =>
      isValidObjectId(companyId),
    );
    if (!validCompanyIds.length) {
      return new Map<
        string,
        { id: string; name: string; logo: string | null }
      >();
    }

    const companiesRaw =
      await this.companyRepository.findByIds(validCompanyIds);
    const companies = Array.isArray(companiesRaw) ? companiesRaw : [];
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

  private async buildCollegeMap(collegeIds: string[]) {
    const validCollegeIds = collegeIds.filter((collegeId) =>
      isValidObjectId(collegeId),
    );
    if (!validCollegeIds.length) {
      return new Map<
        string,
        { id: string; name: string; logo: string | null }
      >();
    }

    const collegesRaw = await this.collegeRepository.findByIds(validCollegeIds);
    const colleges = Array.isArray(collegesRaw) ? collegesRaw : [];
    const collegeMap = new Map<
      string,
      { id: string; name: string; logo: string | null }
    >();

    colleges.forEach((college) => {
      const collegeId = college.id.toString();
      collegeMap.set(collegeId, {
        id: collegeId,
        name: college.name,
        logo: college.logo ?? null,
      });
    });

    return collegeMap;
  }

  private buildJobResponse(
    job: unknown,
    companyMap: Map<string, { id: string; name: string; logo: string | null }>,
    options?: {
      collegeMap?: Map<
        string,
        { id: string; name: string; logo: string | null }
      >;
      myApplicationByJobId?: Map<
        string,
        { applicationId: string; status: ApplicationStatus }
      >;
      savedJobIds?: Set<string>;
    },
  ) {
    const jobData = sanitizeDocument(job);
    if (!jobData) return null;

    const companyId =
      typeof jobData.companyId === 'string'
        ? jobData.companyId
        : ((
            jobData.companyId as { toString?: () => string } | undefined
          )?.toString?.() ?? null);
    const collegeId =
      typeof jobData.collegeId === 'string'
        ? jobData.collegeId
        : ((
            jobData.collegeId as { toString?: () => string } | undefined
          )?.toString?.() ?? null);
    const company = companyId ? (companyMap.get(companyId) ?? null) : null;
    const college =
      collegeId && options?.collegeMap
        ? (options.collegeMap.get(collegeId) ?? null)
        : null;
    const jobId = typeof jobData.id === 'string' ? jobData.id : null;
    const myApplication =
      jobId && options?.myApplicationByJobId
        ? (options.myApplicationByJobId.get(jobId) ?? null)
        : null;
    const isSaved =
      jobId && options?.savedJobIds ? options.savedJobIds.has(jobId) : false;

    return {
      ...jobData,
      // Frontend derives UI labels (status tone, apply CTA text, etc.) from domain data.
      company: company ?? college,
      college,
      workspaceType: college ? 'college' : 'company',
      isSaved,
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
      companyMap?: Map<
        string,
        { id: string; name: string; logo: string | null }
      >;
      collegeMap?: Map<
        string,
        { id: string; name: string; logo: string | null }
      >;
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
        : ((
            applicationData.jobId as { toString?: () => string } | undefined
          )?.toString?.() ?? null)) ??
      (jobData?.id as string | undefined) ??
      null;
    const jobCompanyId =
      (typeof jobData?.companyId === 'string'
        ? jobData.companyId
        : ((
            jobData?.companyId as { toString?: () => string } | undefined
          )?.toString?.() ?? null)) ?? null;
    const jobCollegeId =
      (typeof jobData?.collegeId === 'string'
        ? jobData.collegeId
        : ((
            jobData?.collegeId as { toString?: () => string } | undefined
          )?.toString?.() ?? null)) ?? null;
    const company = jobCompanyId
      ? (options?.companyMap?.get(jobCompanyId) ?? null)
      : null;
    const college = jobCollegeId
      ? (options?.collegeMap?.get(jobCollegeId) ?? null)
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
            candidateProfile:
              typeof student.candidateProfile === 'object' &&
              student.candidateProfile
                ? student.candidateProfile
                : null,
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
              company: company ?? college,
              college,
              workspaceType: college ? 'college' : 'company',
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
    const stageOrder: Array<{ key: string; label: string; minOrder: number }> =
      [
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
        this.toIsoDateString(
          (matchedHistory as { changedAt?: unknown }).changedAt,
        )
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
    job: {
      title: string;
      companyId?: { toString: () => string } | null;
      collegeId?: { toString: () => string } | null;
    };
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

    const companyId = input.job.companyId
      ? input.job.companyId.toString()
      : null;
    const collegeId = input.job.collegeId
      ? input.job.collegeId.toString()
      : null;
    const [companyMap, collegeMap] = await Promise.all([
      this.buildCompanyMap(companyId ? [companyId] : []),
      this.buildCollegeMap(collegeId ? [collegeId] : []),
    ]);
    const sourceName =
      (companyId ? companyMap.get(companyId)?.name : null) ??
      (collegeId ? collegeMap.get(collegeId)?.name : null) ??
      'the organization';
    const finalStatus = input.nextStatus ?? input.updatedApplication.status;

    try {
      await this.emailService.sendApplicationStatusUpdate(email, {
        candidateName:
          typeof student?.name === 'string' ? student.name : undefined,
        companyName: sourceName,
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
  ): Promise<
    Map<string, { applicationId: string; status: ApplicationStatus }>
  > {
    const map = new Map<
      string,
      { applicationId: string; status: ApplicationStatus }
    >();
    if (
      (currentUser.role !== UserRole.STUDENT &&
        currentUser.role !== UserRole.USER) ||
      !jobIds.length
    ) {
      return map;
    }

    if (
      typeof this.applicationRepository.findByStudentAndJobIds !== 'function'
    ) {
      return map;
    }

    const rows = await this.applicationRepository.findByStudentAndJobIds({
      studentId: currentUser.id,
      jobIds,
    });
    if (!Array.isArray(rows)) {
      return map;
    }
    rows.forEach((row) => {
      map.set(row.jobId, {
        applicationId: row.applicationId,
        status: row.status,
      });
    });
    return map;
  }

  private async buildSavedJobIdSet(
    currentUser: TAuthenticatedUser,
    jobIds: string[],
  ): Promise<Set<string>> {
    if (
      (currentUser.role !== UserRole.STUDENT &&
        currentUser.role !== UserRole.USER) ||
      !jobIds.length
    ) {
      return new Set<string>();
    }

    return await this.bookmarkRepository.findSavedEntityIds({
      userId: currentUser.id,
      entityType: BookmarkEntityType.JOB,
      entityIds: jobIds,
    });
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
