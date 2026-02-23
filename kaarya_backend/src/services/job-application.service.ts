import { HttpStatus, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import {
  TCreateJobApplicationDTO,
  TJobApplicationsQueryDTO,
  TMyJobApplicationsQueryDTO,
  TMyApplicationsSummaryQueryDTO,
  TMyResumesQueryDTO,
  TUploadMyResumeDTO,
  TUpdateJobApplicationDTO,
  TUpdateResumeActivityDTO,
} from 'src/dtos/jobs/job-application.dto';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { JobPostingService } from './job-posting.service';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly jobPostingService: JobPostingService,
    private readonly resumeRepository: ACResumeRepository,
    private readonly applicationRepository: ACApplicationRepository,
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly collegeRepository: ACCollegeRepository,
  ) {}

  async getJobApplications(
    currentUser: TAuthenticatedUser,
    jobId: string,
    query: TJobApplicationsQueryDTO,
  ) {
    return await this.jobPostingService.getJobApplications(
      currentUser,
      jobId,
      query,
    );
  }

  async getMyApplications(
    currentUser: TAuthenticatedUser,
    query: TMyJobApplicationsQueryDTO,
  ) {
    return await this.jobPostingService.getMyApplications(currentUser, query);
  }

  async getMyApplicationForJob(currentUser: TAuthenticatedUser, jobId: string) {
    return await this.jobPostingService.getMyApplicationForJob(
      currentUser,
      jobId,
    );
  }

  async getMyApplicationsSummary(
    currentUser: TAuthenticatedUser,
    query: TMyApplicationsSummaryQueryDTO,
  ) {
    const monthRange = this.resolveMonthRange(query.month);
    const statuses = this.normalizeStatuses(query.statuses);
    const [todayFromDate, todayToDate] = this.resolveTodayWindowWithinMonth(
      monthRange.fromDate,
      monthRange.toDate,
    );
    const trendWindow = this.resolveTrendWindow(
      monthRange.fromDate,
      monthRange.toDate,
    );
    const interviewTrendStatuses = statuses.length
      ? statuses.includes(ApplicationStatus.INTERVIEW_SCHEDULED)
        ? [ApplicationStatus.INTERVIEW_SCHEDULED]
        : []
      : [ApplicationStatus.INTERVIEW_SCHEDULED];

    const [
      filteredTotal,
      previousFilteredTotal,
      filteredTodayCount,
      statusCounts,
      previousStatusCounts,
      groupedJobCounts,
      dailyRows,
      interviewDailyRows,
    ] = await Promise.all([
      this.applicationRepository.countByStudentWithFilters({
        studentId: currentUser.id,
        statuses: statuses.length ? statuses : undefined,
        fromDate: monthRange.fromDate,
        toDate: monthRange.toDate,
      }),
      this.applicationRepository.countByStudentWithFilters({
        studentId: currentUser.id,
        statuses: statuses.length ? statuses : undefined,
        fromDate: monthRange.previousFromDate,
        toDate: monthRange.previousToDate,
      }),
      todayFromDate && todayToDate
        ? this.applicationRepository.countByStudentWithFilters({
            studentId: currentUser.id,
            statuses: statuses.length ? statuses : undefined,
            fromDate: todayFromDate,
            toDate: todayToDate,
          })
        : Promise.resolve(0),
      this.applicationRepository.getStatusCountsByStudentWithFilters({
        studentId: currentUser.id,
        fromDate: monthRange.fromDate,
        toDate: monthRange.toDate,
      }),
      this.applicationRepository.getStatusCountsByStudentWithFilters({
        studentId: currentUser.id,
        fromDate: monthRange.previousFromDate,
        toDate: monthRange.previousToDate,
      }),
      this.applicationRepository.getJobCountsByStudentWithFilters({
        studentId: currentUser.id,
        statuses: statuses.length ? statuses : undefined,
        fromDate: monthRange.fromDate,
        toDate: monthRange.toDate,
        limit: 60,
      }),
      this.applicationRepository.getDailyCountsByStudentWithFilters({
        studentId: currentUser.id,
        statuses: statuses.length ? statuses : undefined,
        fromDate: trendWindow.fromDate,
        toDate: trendWindow.toDate,
      }),
      interviewTrendStatuses.length
        ? this.applicationRepository.getDailyCountsByStudentWithFilters({
            studentId: currentUser.id,
            statuses: interviewTrendStatuses,
            fromDate: trendWindow.fromDate,
            toDate: trendWindow.toDate,
          })
        : Promise.resolve([]),
    ]);

    const momentum = this.buildMomentumSeries(
      trendWindow,
      dailyRows,
      interviewDailyRows,
    );
    const applicationsThisWeek = momentum.reduce(
      (sum, point) => sum + point.applications,
      0,
    );
    const interviewsThisWeek = momentum.reduce(
      (sum, point) => sum + point.interviews,
      0,
    );
    const interviewConversion =
      applicationsThisWeek > 0
        ? Number(((interviewsThisWeek / applicationsThisWeek) * 100).toFixed(1))
        : 0;

    const recentCompanies = await this.buildRecentCompanies(groupedJobCounts);
    const pendingInvitations =
      statusCounts.interviewScheduled +
      statusCounts.reviewing +
      statusCounts.shortlisted;

    return {
      filters: {
        month: monthRange.monthKey,
        statuses,
      },
      month: {
        key: monthRange.monthKey,
        label: monthRange.monthLabel,
        previousKey: monthRange.previousMonthKey,
        previousLabel: monthRange.previousMonthLabel,
      },
      summary: {
        total: filteredTotal,
        delta: filteredTotal - previousFilteredTotal,
        todayCount: filteredTodayCount,
      },
      statusCounts,
      recentCompanies,
      analytics: {
        summary: {
          applicationsThisWeek,
          interviewConversion,
        },
        momentum,
        pipeline: [
          {
            stage: 'Applied',
            thisWeek: statusCounts.applied,
            lastWeek: previousStatusCounts.applied,
          },
          {
            stage: 'Screening',
            thisWeek: statusCounts.reviewing + statusCounts.shortlisted,
            lastWeek:
              previousStatusCounts.reviewing + previousStatusCounts.shortlisted,
          },
          {
            stage: 'Interview',
            thisWeek: statusCounts.interviewScheduled,
            lastWeek: previousStatusCounts.interviewScheduled,
          },
          {
            stage: 'Offer',
            thisWeek: statusCounts.accepted,
            lastWeek: previousStatusCounts.accepted,
          },
        ],
        invitationMix: [
          { name: 'Accepted', value: statusCounts.accepted, fill: '#10b981' },
          { name: 'Pending', value: pendingInvitations, fill: '#f59e0b' },
          {
            name: 'Declined',
            value: statusCounts.rejected + statusCounts.withdrawn,
            fill: '#ef4444',
          },
        ],
      },
    };
  }

  async listMyResumes(
    currentUser: TAuthenticatedUser,
    query: TMyResumesQueryDTO,
  ) {
    const { resumes, total } = await this.resumeRepository.findAllByStudentId({
      studentId: currentUser.id,
      page: query.page,
      size: query.size,
    });

    return {
      resumes: resumes
        .map((resume) => this.buildResumeResponse(resume))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async createJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    payload: TCreateJobApplicationDTO,
  ) {
    return await this.jobPostingService.createJobApplication(
      currentUser,
      jobId,
      payload,
    );
  }

  async updateJobApplication(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateJobApplicationDTO,
  ) {
    return await this.jobPostingService.updateJobApplication(
      currentUser,
      jobId,
      applicationId,
      payload,
    );
  }

  async updateApplicationResumeActivity(
    currentUser: TAuthenticatedUser,
    jobId: string,
    applicationId: string,
    payload: TUpdateResumeActivityDTO,
  ) {
    return await this.jobPostingService.updateApplicationResumeActivity(
      currentUser,
      jobId,
      applicationId,
      payload,
    );
  }

  async uploadMyResume(
    currentUser: TAuthenticatedUser,
    payload: TUploadMyResumeDTO,
  ) {
    if (!payload.resumeUrl) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Resume URL is required.',
      });
    }

    const createdResume = await this.resumeRepository.create({
      studentId: new Types.ObjectId(currentUser.id),
      type: 'uploaded_resume',
      fileName: payload.resumeFileName ?? 'resume.pdf',
      fileUrl: payload.resumeUrl,
      filePublicId: payload.resumePublicId ?? null,
      mimeType: payload.resumeMimeType ?? null,
      fileSize: payload.resumeFileSize ?? null,
    });

    return this.buildResumeResponse(createdResume);
  }

  async deleteMyResume(currentUser: TAuthenticatedUser, resumeId: string) {
    const existing = await this.resumeRepository.findByIdAndStudentId(
      resumeId,
      currentUser.id,
    );
    if (!existing) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resume not found.',
      });
    }

    const linkedApplications =
      await this.applicationRepository.countByStudentAndResumeId({
        studentId: currentUser.id,
        resumeId,
      });

    if (linkedApplications > 0) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'This resume is already used in one or more job applications and cannot be deleted.',
      });
    }

    const deleted = await this.resumeRepository.deleteByIdAndStudentId(
      resumeId,
      currentUser.id,
    );
    if (!deleted) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resume not found.',
      });
    }

    return { deleted: true };
  }

  private buildResumeResponse(resume: unknown) {
    const resumeData = sanitizeDocument(resume);
    if (!resumeData) return null;

    const fileUrl =
      typeof resumeData.fileUrl === 'string' ? resumeData.fileUrl : null;
    const mimeType =
      typeof resumeData.mimeType === 'string' ? resumeData.mimeType : null;
    const fileName =
      typeof resumeData.fileName === 'string'
        ? resumeData.fileName
        : 'resume.pdf';

    return {
      ...resumeData,
      fileName,
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
    return fileUrl;
  }

  private normalizeStatuses(statuses?: ApplicationStatus[]) {
    if (!Array.isArray(statuses)) return [];
    return Array.from(new Set(statuses));
  }

  private resolveMonthRange(monthKey?: string) {
    const now = new Date();
    const [year, month] = this.parseMonthKey(monthKey, now);

    const fromDate = new Date(Date.UTC(year, month - 1, 1));
    const toDate = new Date(Date.UTC(year, month, 1));
    const previousFromDate = new Date(Date.UTC(year, month - 2, 1));
    const previousToDate = fromDate;

    return {
      monthKey: this.toMonthKey(year, month),
      monthLabel: this.formatMonthLabel(fromDate),
      previousMonthKey: this.toMonthKey(
        previousFromDate.getUTCFullYear(),
        previousFromDate.getUTCMonth() + 1,
      ),
      previousMonthLabel: this.formatMonthLabel(previousFromDate),
      fromDate,
      toDate,
      previousFromDate,
      previousToDate,
    };
  }

  private parseMonthKey(monthKey: string | undefined, now: Date) {
    if (!monthKey) {
      return [now.getUTCFullYear(), now.getUTCMonth() + 1] as const;
    }

    const [yearRaw, monthRaw] = monthKey.split('-');
    const year = Number.parseInt(yearRaw ?? '', 10);
    const month = Number.parseInt(monthRaw ?? '', 10);

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      month < 1 ||
      month > 12
    ) {
      return [now.getUTCFullYear(), now.getUTCMonth() + 1] as const;
    }

    return [year, month] as const;
  }

  private toMonthKey(year: number, month: number) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private formatMonthLabel(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  private resolveTodayWindowWithinMonth(fromDate: Date, toDate: Date) {
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const startTs = Math.max(todayStart.getTime(), fromDate.getTime());
    const endTs = Math.min(todayEnd.getTime(), toDate.getTime());

    if (startTs >= endTs) {
      return [null, null] as const;
    }

    return [new Date(startTs), new Date(endTs)] as const;
  }

  private resolveTrendWindow(fromDate: Date, toDate: Date) {
    const now = new Date();
    const currentDayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const currentDayEnd = new Date(currentDayStart);
    currentDayEnd.setUTCDate(currentDayEnd.getUTCDate() + 1);

    const monthIsCurrent =
      fromDate.getTime() <= now.getTime() && now.getTime() < toDate.getTime();
    const trendToDate = monthIsCurrent ? currentDayEnd : toDate;
    const trendToDateSafe =
      trendToDate.getTime() > fromDate.getTime() ? trendToDate : toDate;
    const trendFromDate = new Date(trendToDateSafe);
    trendFromDate.setUTCDate(trendFromDate.getUTCDate() - 7);

    return {
      fromDate: trendFromDate,
      toDate: trendToDateSafe,
    };
  }

  private buildMomentumSeries(
    window: { fromDate: Date; toDate: Date },
    applicationRows: Array<{ date: string; count: number }>,
    interviewRows: Array<{ date: string; count: number }>,
  ) {
    const applicationsByDate = new Map(
      applicationRows.map((row) => [row.date, row.count]),
    );
    const interviewsByDate = new Map(
      interviewRows.map((row) => [row.date, row.count]),
    );
    const points: Array<{
      label: string;
      applications: number;
      interviews: number;
    }> = [];

    const cursor = new Date(window.fromDate);
    while (cursor.getTime() < window.toDate.getTime()) {
      const dateKey = cursor.toISOString().slice(0, 10);
      points.push({
        label: cursor.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'UTC',
        }),
        applications: applicationsByDate.get(dateKey) ?? 0,
        interviews: interviewsByDate.get(dateKey) ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (points.length <= 7) {
      return points;
    }

    return points.slice(points.length - 7);
  }

  private async buildRecentCompanies(
    groupedJobCounts: Array<{
      jobId: string;
      count: number;
      latestAppliedAt: string;
    }>,
  ) {
    if (!groupedJobCounts.length) {
      return [] as Array<{
        workspaceId: string;
        workspaceType: 'company' | 'college';
        name: string;
        logo: string | null;
        applicationsCount: number;
        latestAppliedAt: string;
      }>;
    }

    const jobIds = groupedJobCounts.map((item) => item.jobId);
    const { jobs } = await this.jobPostingRepository.findAll({
      page: 1,
      size: Math.max(jobIds.length, 1),
      jobIds,
    });
    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const companyIds = jobs
      .map((job) => job.companyId?.toString())
      .filter(Boolean) as string[];
    const collegeIds = jobs
      .map((job) => job.collegeId?.toString())
      .filter(Boolean) as string[];

    const [companies, colleges] = await Promise.all([
      this.companyRepository.findByIds(companyIds),
      this.collegeRepository.findByIds(collegeIds),
    ]);
    const companyMap = new Map(
      companies.map((company) => [
        company.id,
        {
          name: company.name,
          logo: company.logo ?? null,
        },
      ]),
    );
    const collegeMap = new Map(
      colleges.map((college) => [
        college.id,
        {
          name: college.name,
          logo: college.logo ?? null,
        },
      ]),
    );

    const workspaceMap = new Map<
      string,
      {
        workspaceId: string;
        workspaceType: 'company' | 'college';
        name: string;
        logo: string | null;
        applicationsCount: number;
        latestAppliedAt: string;
      }
    >();

    groupedJobCounts.forEach((item) => {
      const job = jobsById.get(item.jobId);
      if (!job) return;

      const collegeId = job.collegeId?.toString() ?? null;
      const companyId = job.companyId?.toString() ?? null;
      const workspaceType = collegeId ? 'college' : 'company';
      const workspaceId = collegeId ?? companyId;
      if (!workspaceId) return;

      const source =
        workspaceType === 'college'
          ? collegeMap.get(workspaceId)
          : companyMap.get(workspaceId);
      const existing = workspaceMap.get(workspaceId);

      const applicationsCount = (existing?.applicationsCount ?? 0) + item.count;
      const latestAppliedAt = existing
        ? this.maxIsoDate(existing.latestAppliedAt, item.latestAppliedAt)
        : item.latestAppliedAt;

      workspaceMap.set(workspaceId, {
        workspaceId,
        workspaceType,
        name:
          source?.name ?? (workspaceType === 'college' ? 'College' : 'Company'),
        logo: source?.logo ?? null,
        applicationsCount,
        latestAppliedAt,
      });
    });

    return Array.from(workspaceMap.values())
      .sort((left, right) => {
        const rightTs = new Date(right.latestAppliedAt).getTime();
        const leftTs = new Date(left.latestAppliedAt).getTime();
        if (rightTs !== leftTs) return rightTs - leftTs;
        return right.applicationsCount - left.applicationsCount;
      })
      .slice(0, 5);
  }

  private maxIsoDate(leftIso: string, rightIso: string) {
    const leftTs = new Date(leftIso).getTime();
    const rightTs = new Date(rightIso).getTime();
    if (Number.isNaN(leftTs)) return rightIso;
    if (Number.isNaN(rightTs)) return leftIso;
    return rightTs > leftTs ? rightIso : leftIso;
  }
}
