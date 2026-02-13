import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { JOB_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import {
  CreateJobPostingDTO,
  JobMetricsQueryDTO,
  JobPostingQueryDTO,
  TCreateJobPostingDTO,
  TJobMetricsQueryDTO,
  TJobPostingQueryDTO,
  TUpdateJobPostingDTO,
  UpdateJobPostingDTO,
} from 'src/dtos/jobs/job-posting.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { JobPostingService } from 'src/services/job-posting.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';

@ApiTags('Job Posting')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.JOB.BASE,
  version: '1',
})
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  @Get()
  @ApiOperation({
    summary: 'List job postings',
    description:
      'Returns paginated jobs with backend-supported filters (feed/search/company/status) for dynamic job listing pages and recruiter/student experiences.',
  })
  @HttpCode(HttpStatus.OK)
  async getAllJobs(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TJobPostingQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = JobPostingQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.jobPostingService.getAllJobPostings(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, JOB_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Get(ROUTES.JOB.BY_ID)
  @ApiOperation({
    summary: 'Get job posting by id',
    description:
      'Returns one job posting with normalized company details and metadata needed by the job details page.',
  })
  @HttpCode(HttpStatus.OK)
  async getJobById(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const data = await this.jobPostingService.getJobPostingById(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, JOB_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Post(ROUTES.JOB.VIEW)
  @ApiOperation({
    summary: 'Record job view',
    description:
      'Increments or records job view events for analytics signals such as trending jobs and conversion tracking.',
  })
  @HttpCode(HttpStatus.OK)
  async recordJobView(@Param('id') id: string) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const data = await this.jobPostingService.recordJobView(parsedId.data);
      return buildSuccessResponse(data, JOB_MESSAGES.VIEW_RECORDED);
    });
  }

  @Get(ROUTES.JOB.METRICS)
  @ApiOperation({
    summary: 'Get job metrics',
    description:
      'Returns analytics for a job including view count and applications count. Used by recruiter dashboards and job performance cards.',
  })
  @HttpCode(HttpStatus.OK)
  async getJobMetrics(
    @Param('id') id: string,
    @Query() query: TJobMetricsQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedQuery = JobMetricsQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.jobPostingService.getJobPostingMetrics(
        parsedId.data,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.METRICS_FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Create job posting',
    description:
      'Creates a new job under a company workspace. Recruiters can create only within companies they are members of; admins can create across companies.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'string', example: '65f1ac85a0b5bf507c66d2c9' },
        title: { type: 'string', example: 'Backend Engineer' },
        description: {
          type: 'string',
          example: 'Design and build scalable backend systems.',
        },
        location: { type: 'string', example: 'Kathmandu, Bagmati' },
        employmentType: { type: 'string', example: 'Full-Time' },
        engagementType: { type: 'string', example: 'Internship' },
        workMode: { type: 'string', example: 'remote' },
        salaryRange: {
          type: 'string',
          example: 'NPR 10,00,000 - NPR 15,00,000',
        },
        requirements: {
          type: 'object',
          example: { skills: ['NestJS', 'MongoDB'], minExperienceYears: 2 },
        },
        deadline: { type: 'string', format: 'date-time' },
        status: { type: 'string', example: 'open' },
      },
      required: ['title', 'description', 'deadline'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async createJobPosting(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateJobPostingDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = CreateJobPostingDTO.safeParse(payload);
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.jobPostingService.createJobPosting(
        request.user,
        parsedData.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.JOB.BY_ID)
  @ApiOperation({
    summary: 'Update job posting',
    description:
      'Updates an existing job and its operational status. Access is restricted to workspace recruiters for that company and system admins.',
  })
  @HttpCode(HttpStatus.OK)
  async updateJobPosting(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TUpdateJobPostingDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedData = UpdateJobPostingDTO.safeParse(payload);
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.jobPostingService.updateJobPosting(
        request.user,
        parsedId.data,
        parsedData.data,
      );

      return buildSuccessResponse(data, JOB_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.JOB.BY_ID)
  @ApiOperation({
    summary: 'Delete job posting',
    description:
      'Removes a job posting from the system. Used for lifecycle cleanup or accidental postings, with workspace-level authorization checks.',
  })
  @HttpCode(HttpStatus.OK)
  async deleteJobPosting(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const data = await this.jobPostingService.deleteJobPosting(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, JOB_MESSAGES.DELETE_SUCCESS);
    });
  }
}
