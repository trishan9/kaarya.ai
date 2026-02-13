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
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { COLLEGE_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import {
  CollegeStudentsQueryDTO,
  CollegesQueryDTO,
  CreateCollegeDTO,
  InviteStudentToCollegeDTO,
  JoinCollegeByCodeDTO,
  TCollegeStudentsQueryDTO,
  TCollegesQueryDTO,
  TCreateCollegeDTO,
  TInviteStudentToCollegeDTO,
  TJoinCollegeByCodeDTO,
  TUpdateCollegeDTO,
  UpdateCollegeDTO,
} from 'src/dtos/colleges/college.dto';
import { ObjectIdDTO } from 'src/dtos/companies/company.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { CollegeService } from 'src/services/college.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';
import type { Express } from 'express';

@ApiTags('College')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.COLLEGE.BASE,
  version: '1',
})
export class CollegeController {
  constructor(
    private readonly collegeService: CollegeService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List colleges',
  })
  @HttpCode(HttpStatus.OK)
  async listColleges(@Query() query: TCollegesQueryDTO) {
    return asyncHandler(async () => {
      const parsedQuery = CollegesQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.collegeService.listColleges(parsedQuery.data);
      return buildSuccessResponse(data, COLLEGE_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Roles(UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COLLEGE.ME)
  @ApiOperation({
    summary: 'Get primary college context',
  })
  @HttpCode(HttpStatus.OK)
  async getMyCollege(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const data = await this.collegeService.getMyCollege(request.user);
      return buildSuccessResponse(data, COLLEGE_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.COLLEGE, UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COLLEGE.WORKSPACES_ME)
  @ApiOperation({
    summary: 'List college workspaces',
  })
  @HttpCode(HttpStatus.OK)
  async listMyWorkspaces(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TCollegeStudentsQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = CollegeStudentsQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.collegeService.listStudentWorkspaces(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.WORKSPACES_FETCH_SUCCESS);
    });
  }

  @Get(ROUTES.COLLEGE.BY_ID)
  @ApiOperation({
    summary: 'Get college by id',
  })
  @HttpCode(HttpStatus.OK)
  async getCollegeById(@Param('id') id: string) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const data = await this.collegeService.getCollegeById(parsedId.data);
      return buildSuccessResponse(data, COLLEGE_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COLLEGE.JOIN_BY_CODE)
  @ApiOperation({
    summary: 'Join college by invite code',
  })
  @HttpCode(HttpStatus.OK)
  async joinCollegeByCode(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TJoinCollegeByCodeDTO,
  ) {
    return asyncHandler(async () => {
      const parsedPayload = JoinCollegeByCodeDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.collegeService.joinCollegeByInviteCode(
        request.user,
        parsedPayload.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.JOIN_BY_CODE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Create college workspace',
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(
            new ApiError({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Only image files are allowed.',
            }),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Softwarica College' },
        institutionType: { type: 'string', example: 'Engineering College' },
        location: { type: 'string', example: 'Kathmandu, Nepal' },
        logo: { type: 'string', format: 'binary' },
      },
      required: ['name'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async createCollege(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateCollegeDTO,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const logoUrl = logo
        ? await this.cloudinaryService.uploadImage(logo)
        : undefined;

      const parsedData = CreateCollegeDTO.safeParse({
        ...payload,
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.collegeService.createCollege(
        request.user,
        parsedData.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.COLLEGE.BY_ID)
  @ApiOperation({
    summary: 'Update college workspace',
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(
            new ApiError({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Only image files are allowed.',
            }),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  async updateCollege(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TUpdateCollegeDTO,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const logoUrl = logo
        ? await this.cloudinaryService.uploadImage(logo)
        : undefined;

      const parsedData = UpdateCollegeDTO.safeParse({
        ...payload,
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.collegeService.updateCollege(
        request.user,
        parsedId.data,
        parsedData.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COLLEGE.INVITE_CODE_RESET)
  @ApiOperation({
    summary: 'Reset college invite code',
  })
  @HttpCode(HttpStatus.OK)
  async resetInviteCode(
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

      const data = await this.collegeService.resetCollegeInviteCode(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.INVITE_CODE_RESET_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.COLLEGE.BY_ID)
  @ApiOperation({
    summary: 'Delete college workspace',
  })
  @HttpCode(HttpStatus.OK)
  async deleteCollege(
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

      const data = await this.collegeService.deleteCollege(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.DELETE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COLLEGE.STUDENTS)
  @ApiOperation({
    summary: 'List college students',
  })
  @HttpCode(HttpStatus.OK)
  async listCollegeStudents(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Query() query: TCollegeStudentsQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedQuery = CollegeStudentsQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.collegeService.listCollegeStudents(
        request.user,
        parsedId.data,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, COLLEGE_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COLLEGE.INVITES)
  @ApiOperation({
    summary: 'Send student workspace invite',
  })
  @HttpCode(HttpStatus.OK)
  async inviteStudentToCollege(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TInviteStudentToCollegeDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedPayload = InviteStudentToCollegeDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.collegeService.inviteStudentToCollege(
        request.user,
        parsedId.data,
        parsedPayload.data,
      );

      return buildSuccessResponse(data, COLLEGE_MESSAGES.INVITE_CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.COLLEGE.STUDENT_BY_ID)
  @ApiOperation({
    summary: 'Admin remove student from college',
  })
  @HttpCode(HttpStatus.OK)
  async removeStudentFromCollege(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return asyncHandler(async () => {
      const parsedCollegeId = ObjectIdDTO.safeParse(id);
      if (!parsedCollegeId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedCollegeId.error),
        });
      }

      const parsedStudentId = ObjectIdDTO.safeParse(studentId);
      if (!parsedStudentId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedStudentId.error),
        });
      }

      const data = await this.collegeService.removeStudentFromCollege(
        request.user,
        {
          collegeId: parsedCollegeId.data,
          studentId: parsedStudentId.data,
        },
      );

      return buildSuccessResponse(data, COLLEGE_MESSAGES.STUDENT_DELETE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.COLLEGE)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COLLEGE.METRICS)
  @ApiOperation({
    summary: 'Get college workspace metrics',
  })
  @HttpCode(HttpStatus.OK)
  async getCollegeMetrics(
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

      const data = await this.collegeService.getCollegeMetrics(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, COLLEGE_MESSAGES.METRICS_FETCH_SUCCESS);
    });
  }
}
