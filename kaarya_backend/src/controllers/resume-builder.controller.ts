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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { asyncHandler } from 'src/common/utils/async-handler';
import { ROUTES } from 'src/constants/routes.constants';
import { Roles } from 'src/decorators/roles.decorator';
import {
  createResumeBuilderDTO,
  updateResumeBuilderDTO,
  listResumeBuilderQueryDTO,
  aiSummaryDTO,
  aiExperienceBulletsDTO,
  aiSuggestionsDTO,
  atsScanBodyDTO,
  type TCreateResumeBuilderDTO,
  type TUpdateResumeBuilderDTO,
  type TListResumeBuilderQueryDTO,
  type TAiSummaryDTO,
  type TAiExperienceBulletsDTO,
  type TAiSuggestionsDTO,
  type TAtsScanBodyDTO,
} from 'src/dtos/resume-builder/resume-builder.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { ResumeBuilderService } from 'src/services/resume-builder.service';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { UserRole } from 'src/types/user-role.enum';

const multerMemory = memoryStorage();

@ApiTags('Resume Builder')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: ROUTES.RESUME_BUILDER.BASE,
  version: '1',
})
export class ResumeBuilderController {
  constructor(private readonly resumeBuilderService: ResumeBuilderService) {}

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new resume draft',
    description:
      'Create a new resume builder draft. Compatible with web and mobile (Flutter).',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: { user: TAuthenticatedUser },
    @Body() body: TCreateResumeBuilderDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = createResumeBuilderDTO.safeParse(body ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.create(req.user, parsed.data);
      return buildSuccessResponse(data, 'Resume draft created.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.RESUME_BUILDER.LIST)
  @ApiOperation({
    summary: 'List my resume drafts',
    description: 'Paginated list of resume builder drafts. Web & Flutter compatible.',
  })
  @HttpCode(HttpStatus.OK)
  async list(
    @Request() req: { user: TAuthenticatedUser },
    @Query() query: TListResumeBuilderQueryDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = listResumeBuilderQueryDTO.safeParse(query ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.list(req.user, parsed.data);
      return buildSuccessResponse(data, 'Resumes fetched.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Get(ROUTES.RESUME_BUILDER.BY_ID)
  @ApiOperation({
    summary: 'Get resume draft by ID',
  })
  @HttpCode(HttpStatus.OK)
  async getById(
    @Request() req: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const data = await this.resumeBuilderService.getById(req.user, id);
      if (!data) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resume not found.',
        });
      }
      return buildSuccessResponse(data, 'Resume fetched.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Patch(ROUTES.RESUME_BUILDER.BY_ID)
  @ApiOperation({
    summary: 'Update resume draft',
  })
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: { user: TAuthenticatedUser },
    @Param('id') id: string,
    @Body() body: TUpdateResumeBuilderDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = updateResumeBuilderDTO.safeParse(body ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.update(
        req.user,
        id,
        parsed.data,
      );
      if (!data) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resume not found.',
        });
      }
      return buildSuccessResponse(data, 'Resume updated.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Delete(ROUTES.RESUME_BUILDER.BY_ID)
  @ApiOperation({
    summary: 'Delete resume draft',
    description: 'Deletes a resume draft for the authenticated user.',
  })
  @HttpCode(HttpStatus.OK)
  async delete(
    @Request() req: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const deleted = await this.resumeBuilderService.delete(req.user, id);
      if (!deleted) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resume not found.',
        });
      }
      return buildSuccessResponse({ deleted: true }, 'Resume deleted.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.GENERATE_PDF)
  @ApiOperation({
    summary: 'Generate PDF preview',
    description:
      'Generates a PDF from the resume content and returns a temporary URL. Use for preview/download without saving.',
  })
  @HttpCode(HttpStatus.OK)
  async generatePdf(
    @Request() req: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const data = await this.resumeBuilderService.generatePdf(req.user, id);
      return buildSuccessResponse(data, 'PDF generated.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.SAVE)
  @ApiOperation({
    summary: 'Save resume as PDF and link to My Resumes',
    description:
      'Generates PDF, uploads to storage, creates a Resume record so it appears in job applications.',
  })
  @HttpCode(HttpStatus.OK)
  async save(
    @Request() req: { user: TAuthenticatedUser },
    @Param('id') id: string,
  ) {
    return asyncHandler(async () => {
      const data = await this.resumeBuilderService.saveAsResume(req.user, id);
      return buildSuccessResponse(data, 'Resume saved.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.AI_SUMMARY)
  @ApiOperation({
    summary: 'Generate professional summary with AI (Gemini)',
  })
  @HttpCode(HttpStatus.OK)
  async generateAiSummary(
    @Request() req: { user: TAuthenticatedUser },
    @Body() body: TAiSummaryDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = aiSummaryDTO.safeParse(body ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.generateAiSummary(
        req.user,
        parsed.data,
      );
      return buildSuccessResponse(data, 'Summary generated.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.AI_EXPERIENCE_BULLETS)
  @ApiOperation({
    summary: 'Generate ATS-friendly bullet points for an experience (Gemini)',
  })
  @HttpCode(HttpStatus.OK)
  async generateExperienceBullets(
    @Request() req: { user: TAuthenticatedUser },
    @Body() body: TAiExperienceBulletsDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = aiExperienceBulletsDTO.safeParse(body ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.generateExperienceBullets(
        req.user,
        parsed.data,
      );
      return buildSuccessResponse(data, 'Bullets generated.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.AI_SUGGESTIONS)
  @ApiOperation({
    summary: 'Generate AI suggestions for resume builder steps',
    description:
      'Returns structured suggestions for target role, headline, summary, and skills to assist step-by-step resume creation.',
  })
  @HttpCode(HttpStatus.OK)
  async generateSuggestions(
    @Request() req: { user: TAuthenticatedUser },
    @Body() body: TAiSuggestionsDTO,
  ) {
    return asyncHandler(async () => {
      const parsed = aiSuggestionsDTO.safeParse(body ?? {});
      if (!parsed.success) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: z.prettifyError(parsed.error),
        });
      }
      const data = await this.resumeBuilderService.generateAiSuggestions(
        req.user,
        parsed.data,
      );
      return buildSuccessResponse(data, 'Suggestions generated.');
    });
  }

  @Roles(UserRole.USER, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @Post(ROUTES.RESUME_BUILDER.ATS_SCAN)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: multerMemory,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resume: { type: 'string', format: 'binary' },
        targetRole: { type: 'string' },
        experienceLevel: { type: 'string' },
        jobDescription: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'ATS scan resume',
    description:
      'Upload a resume PDF and get ATS score plus suggestions. Optional: targetRole, experienceLevel, jobDescription (form fields). Web & Flutter compatible.',
  })
  @HttpCode(HttpStatus.OK)
  async atsScan(
    @Request() req: { user: TAuthenticatedUser },
    @UploadedFile() resume: Express.Multer.File | undefined,
    @Body() body: TAtsScanBodyDTO,
  ) {
    return asyncHandler(async () => {
      if (!resume) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Resume PDF file is required.',
        });
      }
      const parsed = atsScanBodyDTO.safeParse(body ?? {});
      const payload = parsed.success ? parsed.data : {};
      const data = await this.resumeBuilderService.atsScan(req.user, resume, {
        targetRole: payload.targetRole,
        experienceLevel: payload.experienceLevel,
        jobDescription: payload.jobDescription,
      });
      return buildSuccessResponse(data, 'ATS scan complete.');
    });
  }
}
