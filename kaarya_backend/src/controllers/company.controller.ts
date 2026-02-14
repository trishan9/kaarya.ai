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
import { COMPANY_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import {
  AssignRecruiterToCompanyDTO,
  CompaniesQueryDTO,
  CompanyRecruitersQueryDTO,
  CreateCompanyDTO,
  JoinCompanyByCodeDTO,
  InviteRecruiterToCompanyDTO,
  ObjectIdDTO,
  TAssignRecruiterToCompanyDTO,
  TCompaniesQueryDTO,
  TCompanyRecruitersQueryDTO,
  TCreateCompanyDTO,
  TJoinCompanyByCodeDTO,
  TInviteRecruiterToCompanyDTO,
  TUpdateCompanyDTO,
  UpdateCompanyDTO,
} from 'src/dtos/companies/company.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { CompanyService } from 'src/services/company.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';
import type { Express } from 'express';

@ApiTags('Company')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.COMPANY.BASE,
  version: '1',
})
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List companies',
    description:
      'Returns paginated companies for discovery and admin workflows. Supports search so frontend selectors and admin views can query workspaces quickly.',
  })
  @HttpCode(HttpStatus.OK)
  async listCompanies(@Query() query: TCompaniesQueryDTO) {
    return asyncHandler(async () => {
      const parsedQuery = CompaniesQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.companyService.listCompanies(parsedQuery.data);
      return buildSuccessResponse(data, COMPANY_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Roles(UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COMPANY.ME)
  @ApiOperation({
    summary: 'Get primary recruiter company context',
    description:
      'Returns recruiter company context for compatibility where a single company view is needed. Prefer workspaces endpoint for multi-company switchers.',
  })
  @HttpCode(HttpStatus.OK)
  async getMyCompany(@Request() request: { user: TAuthenticatedUser }) {
    return asyncHandler(async () => {
      const data = await this.companyService.getMyCompany(request.user);
      return buildSuccessResponse(data, COMPANY_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COMPANY.WORKSPACES_ME)
  @ApiOperation({
    summary: 'List recruiter workspaces',
    description:
      'Returns all companies a recruiter belongs to, including company name/logo/inviteCode and membership info. Used by frontend workspace switcher.',
  })
  @HttpCode(HttpStatus.OK)
  async listMyWorkspaces(
    @Request() request: { user: TAuthenticatedUser },
    @Query() query: TCompanyRecruitersQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedQuery = CompanyRecruitersQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.companyService.listRecruiterWorkspaces(
        request.user,
        parsedQuery.data,
      );
      return buildSuccessResponse(data, COMPANY_MESSAGES.WORKSPACES_FETCH_SUCCESS);
    });
  }

  @Get(ROUTES.COMPANY.BY_ID)
  @ApiOperation({
    summary: 'Get company by id',
    description:
      'Returns company profile details by id for candidate and recruiter company profile views.',
  })
  @HttpCode(HttpStatus.OK)
  async getCompanyById(@Param('id') id: string) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const data = await this.companyService.getCompanyById(parsedId.data);
      return buildSuccessResponse(data, COMPANY_MESSAGES.FETCH_SUCCESS);
    });
  }

  @Roles(UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COMPANY.JOIN_BY_CODE)
  @ApiOperation({
    summary: 'Join company by invite code',
    description:
      'Allows a recruiter to join a company workspace using the company inviteCode. This is the main lightweight invite acceptance path.',
  })
  @HttpCode(HttpStatus.OK)
  async joinCompanyByCode(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TJoinCompanyByCodeDTO,
  ) {
    return asyncHandler(async () => {
      const parsedPayload = JoinCompanyByCodeDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.companyService.joinCompanyByInviteCode(
        request.user,
        parsedPayload.data,
      );
      return buildSuccessResponse(data, COMPANY_MESSAGES.JOIN_BY_CODE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Create company workspace',
    description:
      'Creates a new company workspace. Recruiter creators are auto-added as members; admins can create workspaces centrally. Supports logo upload.',
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
        name: { type: 'string', example: 'Kaarya AI' },
        industry: { type: 'string', example: 'SaaS' },
        location: { type: 'string', example: 'Bengaluru, India' },
        verifiedStatus: { type: 'boolean', example: false },
        designation: { type: 'string', example: 'Hiring Manager' },
        logo: { type: 'string', format: 'binary' },
      },
      required: ['name'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async createCompany(
    @Request() request: { user: TAuthenticatedUser },
    @Body() payload: TCreateCompanyDTO,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const logoUrl = logo
        ? await this.cloudinaryService.uploadImage(logo)
        : undefined;

      const parsedData = CreateCompanyDTO.safeParse({
        ...payload,
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.companyService.createCompany(
        request.user,
        parsedData.data,
      );

      return buildSuccessResponse(data, COMPANY_MESSAGES.CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.COMPANY.BY_ID)
  @ApiOperation({
    summary: 'Update company workspace',
    description:
      'Updates workspace details such as name, location, industry, and logo. Recruiters can update only companies they belong to; admins can update any company.',
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
  async updateCompany(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TUpdateCompanyDTO,
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

      const parsedData = UpdateCompanyDTO.safeParse({
        ...payload,
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
      if (!parsedData.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedData.error),
        });
      }

      const data = await this.companyService.updateCompany(
        request.user,
        parsedId.data,
        parsedData.data,
      );

      return buildSuccessResponse(data, COMPANY_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COMPANY.INVITE_CODE_RESET)
  @ApiOperation({
    summary: 'Reset company invite code',
    description:
      'Regenerates a new inviteCode for a workspace. Used to invalidate previously shared codes and continue invites with a fresh code.',
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

      const data = await this.companyService.resetCompanyInviteCode(
        request.user,
        parsedId.data,
      );

      return buildSuccessResponse(data, COMPANY_MESSAGES.INVITE_CODE_RESET_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.COMPANY.BY_ID)
  @ApiOperation({
    summary: 'Delete company workspace',
    description:
      'Deletes a company and cascades workspace data cleanup (for example linked jobs and memberships). Restricted to admins or authorized workspace recruiters.',
  })
  @HttpCode(HttpStatus.OK)
  async deleteCompany(
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

      const data = await this.companyService.deleteCompany(
        request.user,
        parsedId.data,
      );
      return buildSuccessResponse(data, COMPANY_MESSAGES.DELETE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Get(ROUTES.COMPANY.RECRUITERS)
  @ApiOperation({
    summary: 'List workspace members',
    description:
      'Returns paginated recruiter members for a company workspace. Used by member management screens and permission-aware recruiter operations.',
  })
  @HttpCode(HttpStatus.OK)
  async listCompanyRecruiters(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Query() query: TCompanyRecruitersQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedQuery = CompanyRecruitersQueryDTO.safeParse(query);
      if (!parsedQuery.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedQuery.error),
        });
      }

      const data = await this.companyService.listCompanyRecruiters(
        request.user,
        parsedId.data,
        parsedQuery.data,
      );

      return buildSuccessResponse(data, COMPANY_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COMPANY.INVITES)
  @ApiOperation({
    summary: 'Send recruiter workspace invite',
    description:
      'Sends an invite email containing workspace join information and the current inviteCode. Invite persistence is not stored; joining happens via join-by-code endpoint.',
  })
  @HttpCode(HttpStatus.OK)
  async inviteRecruiterToCompany(
    @Request() request: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() payload: TInviteRecruiterToCompanyDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedPayload = InviteRecruiterToCompanyDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.companyService.inviteRecruiterToCompany(
        request.user,
        parsedId.data,
        parsedPayload.data,
      );

      return buildSuccessResponse(data, COMPANY_MESSAGES.INVITE_CREATE_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post(ROUTES.COMPANY.RECRUITERS)
  @ApiOperation({
    summary: 'Admin assign recruiter to company',
    description:
      'Administrative endpoint to directly add a recruiter to a workspace without invite flow. Useful for support and backoffice actions.',
  })
  @HttpCode(HttpStatus.OK)
  async assignRecruiterToCompany(
    @Param('id') id: string,
    @Body() payload: TAssignRecruiterToCompanyDTO,
  ) {
    return asyncHandler(async () => {
      const parsedId = ObjectIdDTO.safeParse(id);
      if (!parsedId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedId.error),
        });
      }

      const parsedPayload = AssignRecruiterToCompanyDTO.safeParse(payload);
      if (!parsedPayload.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedPayload.error),
        });
      }

      const data = await this.companyService.assignRecruiterToCompanyByAdmin({
        recruiterId: parsedPayload.data.recruiterId,
        companyId: parsedId.data,
        designation: parsedPayload.data.designation,
      });

      return buildSuccessResponse(data, COMPANY_MESSAGES.RECRUITER_ASSIGN_SUCCESS);
    });
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.COMPANY.RECRUITER_BY_ID)
  @ApiOperation({
    summary: 'Admin remove recruiter from company',
    description:
      'Administrative endpoint to remove a recruiter membership from a workspace. Used for access cleanup and workspace ownership changes.',
  })
  @HttpCode(HttpStatus.OK)
  async removeRecruiterFromCompany(
    @Param('id') id: string,
    @Param('recruiterId') recruiterId: string,
  ) {
    return asyncHandler(async () => {
      const parsedCompanyId = ObjectIdDTO.safeParse(id);
      if (!parsedCompanyId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedCompanyId.error),
        });
      }

      const parsedRecruiterId = ObjectIdDTO.safeParse(recruiterId);
      if (!parsedRecruiterId.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsedRecruiterId.error),
        });
      }

      const data = await this.companyService.removeRecruiterFromCompanyByAdmin({
        companyId: parsedCompanyId.data,
        recruiterId: parsedRecruiterId.data,
      });

      return buildSuccessResponse(data, COMPANY_MESSAGES.RECRUITER_DELETE_SUCCESS);
    });
  }
}
