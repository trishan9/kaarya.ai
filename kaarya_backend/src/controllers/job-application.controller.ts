import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import z from 'zod';
import { extname } from 'path';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { JOB_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import {
  CreateJobApplicationDTO,
  JobApplicationsQueryDTO,
  MyJobApplicationsQueryDTO,
  MyResumesQueryDTO,
  TCreateJobApplicationDTO,
  TJobApplicationsQueryDTO,
  TMyJobApplicationsQueryDTO,
  TMyResumesQueryDTO,
  TUpdateJobApplicationDTO,
  TUpdateResumeActivityDTO,
  UpdateJobApplicationDTO,
  UpdateResumeActivityDTO,
} from 'src/dtos/jobs/job-application.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { JobApplicationService } from 'src/services/job-application.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';
import type { Express } from 'express';

const ALLOWED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_RESUME_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

@ApiTags('Job Application')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.APPLICATION.BASE,
  version: '1',
})
export class JobApplicationController {
  constructor(
    private readonly jobApplicationService: JobApplicationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.APPLICATION.MY_APPLICATIONS)
  @ApiOperation({
    summary: 'List current user applications',
    description:
      'Returns paginated job applications for the current student/user with job, timeline, and resume activity metadata.',
  })
  @HttpCode(HttpStatus.OK)
  async getMyApplications(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TMyJobApplicationsQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = MyJobApplicationsQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.jobApplicationService.getMyApplications(
        request.user,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.MY_APPLICATIONS_FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.APPLICATION.MY_APPLICATION_BY_JOB)
  @ApiOperation({
    summary: 'Get current user application for a job',
    description:
      'Returns the current user application record for the given job if one exists.',
  })
  @HttpCode(HttpStatus.OK)
  async getMyApplicationForJob(
    @Request() request: { user: TAuthenticatedUser },
    @Param('jobId') jobId: string,
  ) {
    return asyncHandler(async () => {
      const parsedJobId = ObjectIdDTO.safeParse(jobId);
      if (!parsedJobId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedJobId.error),
        });
      }

      const data = await this.jobApplicationService.getMyApplicationForJob(
        request.user,
        parsedJobId.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.MY_APPLICATION_FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.APPLICATION.RESUMES_ME)
  @ApiOperation({
    summary: 'List current user resumes',
    description:
      'Returns candidate resumes to reuse while applying to jobs without re-uploading.',
  })
  @HttpCode(HttpStatus.OK)
  async listMyResumes(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TMyResumesQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = MyResumesQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.jobApplicationService.listMyResumes(
        request.user,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, 'Resumes fetched successfully.');
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Get(ROUTES.APPLICATION.JOB_APPLICATIONS)
  @ApiOperation({
    summary: 'List applications for a job',
    description:
      'Returns paginated applications for a specific job. Recruiters can access only jobs from their workspace; admins can access any job.',
  })
  @HttpCode(HttpStatus.OK)
  async getJobApplications(
    @Request() request: { user: TAuthenticatedUser },
    @Param('jobId') jobId: string,
    @Query() query: TJobApplicationsQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedJobId = ObjectIdDTO.safeParse(jobId);
      if (!parsedJobId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedJobId.error),
        });
      }

      const parsedQuery = JobApplicationsQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.jobApplicationService.getJobApplications(
        request.user,
        parsedJobId.data,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.APPLICATIONS_FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.APPLICATION.JOB_APPLICATIONS)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const extension = extname(file.originalname ?? '').toLowerCase();
        const mimeTypeAllowed = ALLOWED_RESUME_MIME_TYPES.has(file.mimetype);
        const extensionAllowed = ALLOWED_RESUME_EXTENSIONS.has(extension);

        if (!mimeTypeAllowed && !extensionAllowed) {
          cb(
            new ApiError({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Only PDF, DOC, or DOCX resumes are allowed.',
            }),
            false,
          );
          return;
        }

        cb(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Submit application for a job',
    description:
      'Creates one application per student/user for a specific job posting using either an existing resumeId or a new resume upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resumeId: {
          type: 'string',
          example: '65f1ac85a0b5bf507c66d2c9',
        },
        coverLetter: { type: 'string' },
        portfolioLinks: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string' },
          ],
        },
        resume: { type: 'string', format: 'binary' },
      },
      description:
        'Provide either resumeId (existing resume) or resume file upload.',
    },
  })
  @HttpCode(HttpStatus.OK)
  async createJobApplication(
    @Request() request: { user: TAuthenticatedUser },
    @Param('jobId') jobId: string,
    @Body() payload: TCreateJobApplicationDTO,
    @UploadedFile() resume?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const parsedJobId = ObjectIdDTO.safeParse(jobId);
      if (!parsedJobId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedJobId.error),
        });
      }

      const hasResumeId =
        typeof payload?.resumeId === 'string' && payload.resumeId.length > 0;

      if (!resume && !hasResumeId) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Choose an existing resume or upload a new resume file.',
        });
      }

      if (resume && hasResumeId) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Provide either resumeId or resume upload, not both.',
        });
      }

      const resumeUpload = resume
        ? await this.cloudinaryService.uploadDocument(resume)
        : null;

      const parsedData = CreateJobApplicationDTO.safeParse({
        ...payload,
        ...(resumeUpload
          ? {
              resumeFileName:
                resume?.originalname ?? resumeUpload.originalFilename,
              resumeUrl: resumeUpload.url,
              resumePublicId: resumeUpload.publicId,
              resumeMimeType: resume?.mimetype,
              resumeFileSize: resumeUpload.bytes,
            }
          : {}),
      });
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.jobApplicationService.createJobApplication(
        request.user,
        parsedJobId.data,
        parsedData.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.APPLICATION_CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.APPLICATION.APPLICATION_BY_JOB)
  @ApiOperation({
    summary: 'Update a job application',
    description:
      'Recruiters can update applicant status and interview metadata for their own workspace jobs.',
  })
  @HttpCode(HttpStatus.OK)
  async updateJobApplication(
    @Request() request: { user: TAuthenticatedUser },
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() payload: TUpdateJobApplicationDTO,
  ) {
    return asyncHandler(async () => {
      const parsedJobId = ObjectIdDTO.safeParse(jobId);
      if (!parsedJobId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedJobId.error),
        });
      }

      const parsedApplicationId = ObjectIdDTO.safeParse(applicationId);
      if (!parsedApplicationId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedApplicationId.error),
        });
      }

      const parsedData = UpdateJobApplicationDTO.safeParse(payload ?? {});
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.jobApplicationService.updateJobApplication(
        request.user,
        parsedJobId.data,
        parsedApplicationId.data,
        parsedData.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.APPLICATION_UPDATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.APPLICATION.APPLICATION_RESUME_ACTIVITY)
  @ApiOperation({
    summary: 'Track resume activity',
    description:
      'Tracks recruiter/admin resume interactions such as preview or download to notify candidates in their application timeline.',
  })
  @HttpCode(HttpStatus.OK)
  async updateApplicationResumeActivity(
    @Request() request: { user: TAuthenticatedUser },
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() payload: TUpdateResumeActivityDTO,
  ) {
    return asyncHandler(async () => {
      const parsedJobId = ObjectIdDTO.safeParse(jobId);
      if (!parsedJobId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedJobId.error),
        });
      }

      const parsedApplicationId = ObjectIdDTO.safeParse(applicationId);
      if (!parsedApplicationId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedApplicationId.error),
        });
      }

      const parsedPayload = UpdateResumeActivityDTO.safeParse(payload ?? {});
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.jobApplicationService.updateApplicationResumeActivity(
        request.user,
        parsedJobId.data,
        parsedApplicationId.data,
        parsedPayload.data,
      );

      return buildSuccessResponse(
        data,
        JOB_MESSAGES.APPLICATION_RESUME_ACTIVITY_UPDATED,
      );
    });
  }
}
