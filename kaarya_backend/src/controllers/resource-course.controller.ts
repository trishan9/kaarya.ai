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
import { RESOURCE_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import {
  CreateResourceCourseDTO,
  ResourceCourseListQueryDTO,
  TCreateResourceCourseDTO,
  TResourceCourseListQueryDTO,
  TUpdateResourceCourseDTO,
  UpdateResourceCourseDTO,
} from 'src/dtos/resources/resource-course.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { ResourceCourseService } from 'src/services/resource-course.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';

@ApiTags('Resources')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.RESOURCE.BASE,
  version: '1',
})
export class ResourceCourseController {
  constructor(private readonly resourceCourseService: ResourceCourseService) {}

  @Get()
  @ApiOperation({
    summary: 'List resource courses',
    description:
      'Returns accessible interview-prep courses with ownership, source, and sharing filters.',
  })
  @HttpCode(HttpStatus.OK)
  async listResourceCourses(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TResourceCourseListQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = ResourceCourseListQueryDTO.safeParse(query ?? {});
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.resourceCourseService.listResourceCourses(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, RESOURCE_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Get(ROUTES.RESOURCE.BY_ID)
  @ApiOperation({
    summary: 'Get resource course by id',
    description:
      'Returns one course with chapter-wise AI content and YouTube recommendations.',
  })
  @HttpCode(HttpStatus.OK)
  async getResourceCourseById(
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

      const data = await this.resourceCourseService.getResourceCourseById(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, RESOURCE_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.RECRUITER,
    UserRole.COLLEGE,
    UserRole.USER,
    UserRole.STUDENT,
  )
  @UseGuards(RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Create AI interview-prep resource course',
    description:
      'Creates a custom course and generates chapter content with headings, subheadings, and video recommendations.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Backend Interview Sprint' },
        description: {
          type: 'string',
          example: '4-week course to prepare for backend engineering interviews.',
        },
        category: { type: 'string', example: 'Learn' },
        generationMode: { type: 'string', example: 'learn' },
        difficulty: { type: 'string', example: 'intermediate' },
        targetRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Backend Engineer', 'API Developer'],
        },
        chapterCount: { type: 'number', example: 6 },
        chapterTitles: {
          type: 'array',
          items: { type: 'string' },
          example: ['Networking Basics', 'Database Optimization'],
        },
        visibility: { type: 'string', example: 'public' },
        includeVideoRecommendations: { type: 'boolean', example: true },
        customVideoUrls: {
          type: 'array',
          items: { type: 'string' },
          example: ['https://www.youtube.com/watch?v=example'],
        },
        promptContext: {
          type: 'string',
          example: 'Focus on practical system design round patterns.',
        },
        jobDescriptionContext: {
          type: 'string',
          example:
            'Need interview readiness for a backend role requiring API design, caching, and database performance.',
        },
        companyId: { type: 'string', example: '65f1ac85a0b5bf507c66d2c9' },
        collegeId: { type: 'string', example: '65f1ac85a0b5bf507c66d2c9' },
      },
      required: ['title', 'category', 'generationMode', 'difficulty', 'targetRoles'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async createResourceCourse(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateResourceCourseDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = CreateResourceCourseDTO.safeParse(payload ?? {});
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.resourceCourseService.createResourceCourse(
        request.user,
        parsedData.data,
      );

      return buildSuccessResponse(data, RESOURCE_MESSAGES.CREATE_SUCCESS);
    });
  }

  @Patch(ROUTES.RESOURCE.BY_ID)
  @ApiOperation({
    summary: 'Update resource course',
    description:
      'Updates metadata/sharing settings and can regenerate chapter content with AI.',
  })
  @HttpCode(HttpStatus.OK)
  async updateResourceCourse(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TUpdateResourceCourseDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedData = UpdateResourceCourseDTO.safeParse(payload ?? {});
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.resourceCourseService.updateResourceCourse(
        request.user,
        parsedId.data,
        parsedData.data,
      );
      return buildSuccessResponse(data, RESOURCE_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @Delete(ROUTES.RESOURCE.BY_ID)
  @ApiOperation({
    summary: 'Delete resource course',
    description: 'Deletes a resource course from the platform.',
  })
  @HttpCode(HttpStatus.OK)
  async deleteResourceCourse(
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

      const data = await this.resourceCourseService.deleteResourceCourse(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, RESOURCE_MESSAGES.DELETE_SUCCESS);
    });
  }
}
