import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
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
import {
  CreateUserDTO,
  LoginDTO,
  TCreateUserDTO,
  TLoginDTO,
  TUpdateMeDTO,
  UpdateMeDTO,
} from 'src/dtos/users/user.dto';
import { AuthGuard } from '@nestjs/passport';
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

@ApiTags('Auth')
@Controller({
  path: ROUTES.AUTH.BASE,
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
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
}
