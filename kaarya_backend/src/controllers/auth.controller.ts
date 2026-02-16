import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Put,
  Res,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { asyncHandler } from 'src/common/utils/async-handler';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { AuthService } from 'src/services/auth.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import {
  CreateUserDTO,
  LoginDTO,
  TCreateUserDTO,
  TLoginDTO,
  TUpdateMeDTO,
  UpdateMeDTO,
} from 'src/dtos/users/user.dto';
import { AuthGuard } from '@nestjs/passport';
import passport from 'passport';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import {
  CreateUserSwaggerDTO,
  LoginSwaggerDTO,
  UpdateMeSwaggerDTO,
} from 'src/dtos/swagger/users/user.swagger.dto';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { Roles } from 'src/decorators/roles.decorator';
import {
  RequestPasswordResetDTO,
  ResetPasswordDTO,
  TRequestPasswordResetDTO,
  TResetPasswordDTO,
  TVerifyPasswordResetOtpDTO,
  VerifyPasswordResetOtpDTO,
} from 'src/dtos/auth/password-reset.dto';
import {
  RequestPasswordResetSwaggerDTO,
  ResetPasswordSwaggerDTO,
  VerifyPasswordResetOtpSwaggerDTO,
} from 'src/dtos/swagger/auth/password-reset.swagger.dto';
import {
  OAuthCompleteLinkSwaggerDTO,
  OAuthExchangeSwaggerDTO,
} from 'src/dtos/swagger/auth/oauth.swagger.dto';
import { PasswordResetService } from 'src/services/password-reset.service';
import { getRequestMetadata } from 'src/common/utils/request-metadata';
import {
  OAuthAuthorizeQueryDTO,
  OAuthCallbackQueryDTO,
  OAuthCompleteLinkDTO,
  OAuthExchangeDTO,
  OAuthProviderParamDTO,
  TOAuthAuthorizeQueryDTO,
  TOAuthCallbackQueryDTO,
  TOAuthCompleteLinkDTO,
  TOAuthExchangeDTO,
} from 'src/dtos/auth/oauth.dto';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';
import { UserRole } from 'src/types/user-role.enum';
import { Request as ExpressRequest, Response } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';

const ALLOWED_CERTIFICATION_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

@ApiTags('Auth')
@Controller({
  path: ROUTES.AUTH.BASE,
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post(ROUTES.AUTH.SIGNUP)
  @ApiBody({ type: CreateUserSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async signup(@Body() payload: TCreateUserDTO) {
    return asyncHandler(async () => {
      const parsedData = CreateUserDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.authService.signup(parsedData.data);
      return buildSuccessResponse(data, AUTH_MESSAGES.SIGNUP_SUCCESS);
    });
  }

  @Post(ROUTES.AUTH.LOGIN)
  @ApiBody({ type: LoginSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: TLoginDTO) {
    return asyncHandler(async () => {
      const parsedData = LoginDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.authService.login(parsedData.data);
      return buildSuccessResponse(data, AUTH_MESSAGES.LOGIN_SUCCESS);
    });
  }

  @Get(ROUTES.AUTH.OAUTH_AUTHORIZE)
  async oauthAuthorize(
    @Request() request,
    @Param('provider') provider: string,
    @Query() query: TOAuthAuthorizeQueryDTO,
    @Res() response: Response,
  ) {
    return asyncHandler(async () => {
      const parsedProvider = OAuthProviderParamDTO.safeParse({ provider });
      const parsedQuery = OAuthAuthorizeQueryDTO.safeParse(query);

      if (!parsedProvider.success) {
        throw new ApiError({
          message: z.prettifyError(parsedProvider.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (!parsedQuery.success) {
        throw new ApiError({
          message: z.prettifyError(parsedQuery.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const state = await this.authService.createOAuthState({
        provider: parsedProvider.data.provider,
        redirectUri: parsedQuery.data.redirectUri,
        intent: parsedQuery.data.intent,
      });

      this.redirectToProvider(
        request,
        response,
        parsedProvider.data.provider,
        state,
      );
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get(ROUTES.AUTH.OAUTH_LINK_AUTHORIZE)
  async oauthLinkAuthorize(
    @Request() request,
    @Param('provider') provider: string,
    @Query() query: TOAuthAuthorizeQueryDTO,
    @Res() response: Response,
  ) {
    return asyncHandler(async () => {
      const parsedProvider = OAuthProviderParamDTO.safeParse({ provider });
      const parsedQuery = OAuthAuthorizeQueryDTO.safeParse(query);

      if (!parsedProvider.success) {
        throw new ApiError({
          message: z.prettifyError(parsedProvider.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (!parsedQuery.success) {
        throw new ApiError({
          message: z.prettifyError(parsedQuery.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const state = await this.authService.createOAuthState({
        provider: parsedProvider.data.provider,
        redirectUri: parsedQuery.data.redirectUri,
        intent: 'link',
        requestedByUserId: request.user.id,
      });

      this.redirectToProvider(
        request,
        response,
        parsedProvider.data.provider,
        state,
      );
    });
  }

  @Get(ROUTES.AUTH.OAUTH_CALLBACK)
  async oauthCallback(
    @Request() request,
    @Param('provider') provider: string,
    @Query() query: TOAuthCallbackQueryDTO,
    @Res() response: Response,
  ) {
    return asyncHandler(async () => {
      const parsedProvider = OAuthProviderParamDTO.safeParse({ provider });
      const parsedQuery = OAuthCallbackQueryDTO.safeParse(query);

      if (!parsedProvider.success) {
        throw new ApiError({
          message: z.prettifyError(parsedProvider.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (!parsedQuery.success) {
        throw new ApiError({
          message: z.prettifyError(parsedQuery.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (parsedQuery.data.error) {
        const redirectUrl = await this.authService.handleOAuthProviderError({
          provider: parsedProvider.data.provider,
          state: parsedQuery.data.state,
          error: parsedQuery.data.error,
          errorDescription: parsedQuery.data.error_description,
        });

        return response.redirect(redirectUrl);
      }

      const profile = await this.authenticateCallback(
        request,
        response,
        parsedProvider.data.provider,
      );

      const redirectUrl = await this.authService.handleOAuthCallback({
        provider: parsedProvider.data.provider,
        state: parsedQuery.data.state,
        profile,
      });

      return response.redirect(redirectUrl);
    });
  }

  @Post(ROUTES.AUTH.OAUTH_EXCHANGE)
  @ApiBody({ type: OAuthExchangeSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async oauthExchange(@Body() payload: TOAuthExchangeDTO) {
    return asyncHandler(async () => {
      const parsedData = OAuthExchangeDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.authService.exchangeOAuthResultToken(
        parsedData.data.resultToken,
      );

      return buildSuccessResponse(data, AUTH_MESSAGES.OAUTH_RESULT_FETCHED);
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post(ROUTES.AUTH.OAUTH_LINK_COMPLETE)
  @ApiBody({ type: OAuthCompleteLinkSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async oauthCompleteLink(
    @Request() request,
    @Body() payload: TOAuthCompleteLinkDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = OAuthCompleteLinkDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.authService.completeOAuthLink(
        request.user.id,
        parsedData.data.linkToken,
      );

      return buildSuccessResponse(data, AUTH_MESSAGES.OAUTH_LINK_COMPLETED);
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get(ROUTES.AUTH.OAUTH_LINKED_ACCOUNTS)
  @HttpCode(HttpStatus.OK)
  async getLinkedOAuthAccounts(@Request() request) {
    return asyncHandler(async () => {
      const data = await this.authService.getLinkedAccounts(request.user.id);
      return buildSuccessResponse(
        data,
        AUTH_MESSAGES.OAUTH_LINKED_ACCOUNTS_FETCHED,
      );
    });
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Delete(ROUTES.AUTH.OAUTH_UNLINK)
  @HttpCode(HttpStatus.OK)
  async unlinkOAuthAccount(
    @Request() request,
    @Param('provider') provider: string,
  ) {
    return asyncHandler(async () => {
      const parsedProvider = OAuthProviderParamDTO.safeParse({ provider });

      if (!parsedProvider.success) {
        throw new ApiError({
          message: z.prettifyError(parsedProvider.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.authService.unlinkOAuthProvider(
        request.user.id,
        parsedProvider.data.provider,
      );
      return buildSuccessResponse(data, AUTH_MESSAGES.OAUTH_ACCOUNT_UNLINKED);
    });
  }

  @ApiBearerAuth('access-token')
  @Get(ROUTES.AUTH.ME)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async me(@Request() request) {
    return asyncHandler(async () => {
      const user = await this.authService.me(request.user.id);
      return buildSuccessResponse(user, AUTH_MESSAGES.CURRENT_USER_SUCCESS);
    });
  }

  @ApiBearerAuth('access-token')
  @Put(ROUTES.AUTH.UPDATE_ME)
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('photo', {
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
  @ApiBody({ type: UpdateMeSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @Request() request,
    @Body() payload: TUpdateMeDTO,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const parsedData = UpdateMeDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const updatePayload: TUpdateMeDTO = {
        ...parsedData.data,
      };

      if (photo) {
        updatePayload.photo = await this.cloudinaryService.uploadImage(photo);
      }

      const user = await this.authService.updateMe(
        request.user.id,
        updatePayload,
      );

      return buildSuccessResponse(user, USER_MESSAGES.UPDATE_SUCCESS);
    });
  }

  @ApiBearerAuth('access-token')
  @Roles(UserRole.USER, UserRole.STUDENT, UserRole.FACULTY)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post(ROUTES.AUTH.CERTIFICATION_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_CERTIFICATION_MIME_TYPES.has(file.mimetype)) {
          cb(
            new ApiError({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Only PDF, JPG, PNG, and WEBP files are allowed.',
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
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Upload certification media',
    description:
      'Uploads a certification image or PDF and returns a public URL for candidate profile usage.',
  })
  @HttpCode(HttpStatus.OK)
  async uploadCertificationMedia(@UploadedFile() file?: Express.Multer.File) {
    return asyncHandler(async () => {
      if (!file) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Certification file is required.',
        });
      }

      let url: string;
      if (file.mimetype.startsWith('image/')) {
        url = await this.cloudinaryService.uploadImage(file);
      } else {
        const uploaded = await this.cloudinaryService.uploadDocument(file);
        url = uploaded.url;
      }

      return buildSuccessResponse(
        {
          url,
          mimeType: file.mimetype,
          fileName: file.originalname,
          fileSize: file.size,
        },
        'Certification media uploaded successfully.',
      );
    });
  }

  @Post(ROUTES.AUTH.PASSWORD_RESET_REQUEST)
  @ApiBody({ type: RequestPasswordResetSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Request() request,
    @Body() payload: TRequestPasswordResetDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = RequestPasswordResetDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      await this.passwordResetService.requestReset(
        parsedData.data.email,
        getRequestMetadata(request),
      );

      return buildSuccessResponse(
        { submitted: true },
        AUTH_MESSAGES.PASSWORD_RESET_REQUESTED,
      );
    });
  }

  @Post(ROUTES.AUTH.PASSWORD_RESET_VERIFY)
  @ApiBody({ type: VerifyPasswordResetOtpSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetOtp(
    @Request() request,
    @Body() payload: TVerifyPasswordResetOtpDTO,
  ) {
    return asyncHandler(async () => {
      const parsedData = VerifyPasswordResetOtpDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const data = await this.passwordResetService.verifyOtp(
        parsedData.data.email,
        parsedData.data.otp,
        getRequestMetadata(request),
      );

      return buildSuccessResponse(data, AUTH_MESSAGES.PASSWORD_RESET_VERIFIED);
    });
  }

  @Post(ROUTES.AUTH.PASSWORD_RESET_CONFIRM)
  @ApiBody({ type: ResetPasswordSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Request() request, @Body() payload: TResetPasswordDTO) {
    return asyncHandler(async () => {
      const parsedData = ResetPasswordDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      await this.passwordResetService.resetPassword(
        parsedData.data.token,
        parsedData.data.password,
        getRequestMetadata(request),
      );

      return buildSuccessResponse(
        { reset: true },
        AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      );
    });
  }

  private redirectToProvider(
    request: ExpressRequest,
    response: Response,
    provider: AuthProvider,
    state: string,
  ) {
    passport.authenticate(
      provider as string,
      {
        session: false,
        customState: state,
      } as Record<string, unknown>,
    )(request, response);
  }

  private async authenticateCallback(
    request: ExpressRequest,
    response: Response,
    provider: AuthProvider,
  ): Promise<OAuthProviderProfile> {
    return await new Promise<OAuthProviderProfile>((resolve, reject) => {
      passport.authenticate(
        provider,
        { session: false },
        (error: unknown, user?: OAuthProviderProfile) => {
          if (error || !user) {
            reject(
              new ApiError({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: AUTH_MESSAGES.OAUTH_UNAVAILABLE,
              }),
            );
            return;
          }

          resolve(user);
        },
      )(request, response);
    });
  }
}
