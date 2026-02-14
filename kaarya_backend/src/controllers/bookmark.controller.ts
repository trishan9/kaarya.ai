import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { BOOKMARK_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { BookmarkListQueryDTO, TBookmarkListQueryDTO } from 'src/dtos/bookmarks/bookmark.dto';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { BookmarkService } from 'src/services/bookmark.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';

@ApiTags('Bookmark')
@ApiBearerAuth('access-token')
@Roles(UserRole.USER, UserRole.STUDENT)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: ROUTES.BOOKMARK.BASE,
  version: '1',
})
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get(ROUTES.BOOKMARK.ME)
  @ApiOperation({
    summary: 'List my saved bookmarks',
    description:
      'Returns candidate saved jobs and interviews with saved timestamps for the Saved page.',
  })
  @HttpCode(HttpStatus.OK)
  async listMyBookmarks(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TBookmarkListQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = BookmarkListQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.bookmarkService.listMyBookmarks(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, BOOKMARK_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Post(ROUTES.BOOKMARK.JOB)
  @ApiOperation({
    summary: 'Save a job',
    description: 'Adds one job to the candidate saved list.',
  })
  @HttpCode(HttpStatus.OK)
  async saveJob(
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

      const data = await this.bookmarkService.saveJob(
        request.user,
        parsedJobId.data,
      );
      return buildSuccessResponse(data, BOOKMARK_MESSAGES.SAVE_JOB_SUCCESS);
    });
  }

  @Delete(ROUTES.BOOKMARK.JOB)
  @ApiOperation({
    summary: 'Unsave a job',
    description: 'Removes one job from the candidate saved list.',
  })
  @HttpCode(HttpStatus.OK)
  async removeSavedJob(
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

      const data = await this.bookmarkService.removeSavedJob(
        request.user,
        parsedJobId.data,
      );
      return buildSuccessResponse(data, BOOKMARK_MESSAGES.UNSAVE_JOB_SUCCESS);
    });
  }

  @Post(ROUTES.BOOKMARK.INTERVIEW)
  @ApiOperation({
    summary: 'Save an interview',
    description: 'Adds one interview to the candidate saved list.',
  })
  @HttpCode(HttpStatus.OK)
  async saveInterview(
    @Request() request: { user: TAuthenticatedUser },
    @Param('interviewId') interviewId: string,
  ) {
    return asyncHandler(async () => {
      const parsedInterviewId = ObjectIdDTO.safeParse(interviewId);
      if (!parsedInterviewId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedInterviewId.error),
        });
      }

      const data = await this.bookmarkService.saveInterview(
        request.user,
        parsedInterviewId.data,
      );
      return buildSuccessResponse(data, BOOKMARK_MESSAGES.SAVE_INTERVIEW_SUCCESS);
    });
  }

  @Delete(ROUTES.BOOKMARK.INTERVIEW)
  @ApiOperation({
    summary: 'Unsave an interview',
    description: 'Removes one interview from the candidate saved list.',
  })
  @HttpCode(HttpStatus.OK)
  async removeSavedInterview(
    @Request() request: { user: TAuthenticatedUser },
    @Param('interviewId') interviewId: string,
  ) {
    return asyncHandler(async () => {
      const parsedInterviewId = ObjectIdDTO.safeParse(interviewId);
      if (!parsedInterviewId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedInterviewId.error),
        });
      }

      const data = await this.bookmarkService.removeSavedInterview(
        request.user,
        parsedInterviewId.data,
      );
      return buildSuccessResponse(
        data,
        BOOKMARK_MESSAGES.UNSAVE_INTERVIEW_SUCCESS,
      );
    });
  }
}
