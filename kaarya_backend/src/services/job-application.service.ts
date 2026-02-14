import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import {
  TCreateJobApplicationDTO,
  TJobApplicationsQueryDTO,
  TMyJobApplicationsQueryDTO,
  TMyResumesQueryDTO,
  TUpdateJobApplicationDTO,
  TUpdateResumeActivityDTO,
} from 'src/dtos/jobs/job-application.dto';
import { ACResumeRepository } from 'src/repositories/resume.repository';
import { ACApplicationRepository } from 'src/repositories/application.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { JobPostingService } from './job-posting.service';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly jobPostingService: JobPostingService,
    private readonly resumeRepository: ACResumeRepository,
    private readonly applicationRepository: ACApplicationRepository,
  ) {}

  async getJobApplications(
    currentUser: TAuthenticatedUser,
    jobId: string,
    query: TJobApplicationsQueryDTO,
  ) {
    return await this.jobPostingService.getJobApplications(currentUser, jobId, query);
  }

  async getMyApplications(
    currentUser: TAuthenticatedUser,
    query: TMyJobApplicationsQueryDTO,
  ) {
    return await this.jobPostingService.getMyApplications(currentUser, query);
  }

  async getMyApplicationForJob(currentUser: TAuthenticatedUser, jobId: string) {
    return await this.jobPostingService.getMyApplicationForJob(currentUser, jobId);
  }

  async listMyResumes(currentUser: TAuthenticatedUser, query: TMyResumesQueryDTO) {
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
}
