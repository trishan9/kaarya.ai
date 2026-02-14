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
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import {
  CompleteInterviewSessionDTO,
  CreateInterviewDTO,
  InterviewListQueryDTO,
  InterviewSessionQueryDTO,
  StartInterviewSessionDTO,
  TCompleteInterviewSessionDTO,
  TCreateInterviewDTO,
  TInterviewListQueryDTO,
  TInterviewSessionQueryDTO,
  TStartInterviewSessionDTO,
  TUpdateInterviewDTO,
  UpdateInterviewDTO,
} from 'src/dtos/interviews/interview.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { InterviewService } from 'src/services/interview.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';

@ApiTags('Interview')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.INTERVIEW.BASE,
  version: '1',
})
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  @ApiOperation({
    summary: 'List interviews',
    description:
      'Returns interview cards accessible to the current user with ownership/visibility filters and pagination.',
  })
  @HttpCode(HttpStatus.OK)
  async listInterviews(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TInterviewListQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = InterviewListQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.interviewService.listInterviews(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Get(ROUTES.INTERVIEW.BY_ID)
  @ApiOperation({
    summary: 'Get interview by id',
    description:
      'Returns one interview details payload including user-specific attempt and latest feedback summary.',
  })
  @HttpCode(HttpStatus.OK)
  async getInterviewById(
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

      const data = await this.interviewService.getInterviewById(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.RECRUITER,
    UserRole.COLLEGE,
    UserRole.USER,
    UserRole.STUDENT,
  )
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create interview',
    description:
      'Creates an interview and optionally generates questions using OpenAI based on role, level, and tech stack.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Frontend Engineering Mock Interview' },
        description: { type: 'string' },
        interviewType: { type: 'string', example: 'technical' },
        role: { type: 'string', example: 'Frontend Engineer' },
        level: { type: 'string', example: 'Mid-level' },
        techStack: {
          type: 'array',
          items: { type: 'string' },
          example: ['React', 'TypeScript', 'Next.js'],
        },
        questionCount: { type: 'number', example: 8 },
        durationMinutes: { type: 'number', example: 25 },
        visibility: { type: 'string', example: 'public' },
        status: { type: 'string', example: 'published' },
        companyId: { type: 'string', example: '65f1ac85a0b5bf507c66d2c9' },
        collegeId: { type: 'string', example: '65f1ac85a0b5bf507c66d2c9' },
        tags: { type: 'array', items: { type: 'string' } },
        instructions: { type: 'string' },
        generateQuestions: { type: 'boolean', example: true },
        questions: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'interviewType', 'role'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async createInterview(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateInterviewDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = CreateInterviewDTO.safeParse(payload);
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.interviewService.createInterview(
        request.user,
        parsedData.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.CREATE_SUCCESS);
    });
  }

  @Patch(ROUTES.INTERVIEW.BY_ID)
  @ApiOperation({
    summary: 'Update interview',
    description:
      'Updates interview metadata/questions. Interview owners can regenerate questions with AI in-place.',
  })
  @HttpCode(HttpStatus.OK)
  async updateInterview(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TUpdateInterviewDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedData = UpdateInterviewDTO.safeParse(payload);
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.interviewService.updateInterview(
        request.user,
        parsedId.data,
        parsedData.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @Delete(ROUTES.INTERVIEW.BY_ID)
  @ApiOperation({
    summary: 'Delete interview',
    description:
      'Deletes an interview. Available to owner, workspace manager, or admin.',
  })
  @HttpCode(HttpStatus.OK)
  async deleteInterview(
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

      const data = await this.interviewService.deleteInterview(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.DELETE_SUCCESS);
    });
  }

  @Post(ROUTES.INTERVIEW.SESSIONS)
  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Start interview session',
    description:
      'Creates an interview attempt session and returns VAPI payload for web/mobile execution.',
  })
  @HttpCode(HttpStatus.OK)
  async startInterviewSession(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TStartInterviewSessionDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedData = StartInterviewSessionDTO.safeParse(payload ?? {});
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.interviewService.startInterviewSession(
        request.user,
        parsedId.data,
        parsedData.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.SESSION_START_SUCCESS);
    });
  }

  @Patch(ROUTES.INTERVIEW.SESSION_COMPLETE)
  @ApiOperation({
    summary: 'Complete interview session',
    description:
      'Finalizes one session with transcript payload and stores AI evaluation when enabled.',
  })
  @HttpCode(HttpStatus.OK)
  async completeInterviewSession(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Body() payload: TCompleteInterviewSessionDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedSessionId = ObjectIdDTO.safeParse(sessionId);
      if (!parsedSessionId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedSessionId.error),
        });
      }

      const parsedData = CompleteInterviewSessionDTO.safeParse(payload ?? {});
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.interviewService.completeInterviewSession(
        request.user,
        parsedId.data,
        parsedSessionId.data,
        parsedData.data,
      );
      return buildSuccessResponse(
        data,
        INTERVIEW_MESSAGES.SESSION_COMPLETE_SUCCESS,
      );
    });
  }

  @Get(ROUTES.INTERVIEW.MY_SESSIONS)
  @ApiOperation({
    summary: 'List my interview sessions',
    description:
      'Returns paginated sessions and AI evaluations for the current user for a given interview.',
  })
  @HttpCode(HttpStatus.OK)
  async listMyInterviewSessions(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Query() query: TInterviewSessionQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedQuery = InterviewSessionQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.interviewService.listMyInterviewSessions(
        request.user,
        parsedId.data,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.SESSION_FETCH_SUCCESS);
    });
  }

  @Get(ROUTES.INTERVIEW.SESSION_FEEDBACK)
  @ApiOperation({
    summary: 'Get feedback by session id',
    description:
      'Returns completed interview session feedback payload including score breakdown and AI assessment.',
  })
  @HttpCode(HttpStatus.OK)
  async getSessionFeedback(
    @Request() request: { user: TAuthenticatedUser },
    @Param('sessionId') sessionId: string,
  ) {
    return asyncHandler(async () => {
      const parsedSessionId = ObjectIdDTO.safeParse(sessionId);
      if (!parsedSessionId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedSessionId.error),
        });
      }

      const data = await this.interviewService.getSessionFeedback(
        request.user,
        parsedSessionId.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.EVALUATION_FETCH_SUCCESS);
    });
  }

  @Get(ROUTES.INTERVIEW.ANALYTICS)
  @ApiOperation({
    summary: 'Get interview analytics',
    description:
      'Returns creator analytics for a specific interview including participants, completion rate, and score summary.',
  })
  @HttpCode(HttpStatus.OK)
  async getInterviewAnalytics(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Query() query: TInterviewSessionQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedQuery = InterviewSessionQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.interviewService.getInterviewAnalytics(
        request.user,
        parsedId.data,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, INTERVIEW_MESSAGES.ANALYTICS_FETCH_SUCCESS);
    });
  }
}
