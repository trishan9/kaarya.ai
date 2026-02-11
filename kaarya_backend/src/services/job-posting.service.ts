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
  TJobApplicationsQueryDTO,
  TJobPostingQueryDTO,
  TUpdateJobPostingDTO,
} from 'src/dtos/jobs/job-posting.dto';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { UserRole } from 'src/types/user-role.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { CompanyService } from './company.service';
import { RecruiterProfileService } from './recruiter-profile.service';

@Injectable()
export class JobPostingService {
  constructor(
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly companyService: CompanyService,
    private readonly recruiterProfileService: RecruiterProfileService,
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

  async getJobPostingById(jobId: string) {
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
    return this.buildJobResponse(job, companyMap);
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

    return {
      jobs: jobs
        .map((job) => this.buildJobResponse(job, companyMap))
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
  ) {
    const jobData = sanitizeDocument(job);
    if (!jobData) return null;

    const companyId =
      typeof jobData.companyId === 'string'
        ? jobData.companyId
        : ((jobData.companyId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);
    const company = companyId ? (companyMap.get(companyId) ?? null) : null;

    return {
      ...jobData,
      // Frontend derives UI labels (status tone, apply CTA text, etc.) from domain data.
      company,
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

  private buildApplicationResponse(application: unknown) {
    const applicationData = sanitizeDocument(application);
    if (!applicationData) return null;

    const studentRaw = (application as { studentId?: unknown }).studentId;
    const student =
      typeof studentRaw === 'object' && studentRaw
        ? sanitizeDocument(studentRaw)
        : null;

    return {
      ...applicationData,
      student:
        student ??
        (typeof applicationData.studentId === 'string'
          ? { id: applicationData.studentId }
          : null),
    };
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}
